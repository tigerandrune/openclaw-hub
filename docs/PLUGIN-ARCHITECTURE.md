# Plugin Architecture — Design Doc

**Status:** Design (pre-implementation)
**Author:** Tiger × Rune
**Date:** 2026-03-30

---

## Problem

The Hub has 8 hardcoded widgets. Adding a new one means editing Home.jsx, creating a component, adding i18n keys, rebuilding, and redeploying. Users can't add their own widgets without forking.

## Goal

Users drop a folder into `~/.openclaw/hub-plugins/<name>/`, and it shows up as a widget they can enable and place on their home page. No rebuild. No restart.

---

## Architecture Overview

```
~/.openclaw/hub-plugins/
├── clock/
│   ├── manifest.json     ← metadata + permissions + settings schema
│   ├── widget.jsx        ← the actual component (compiled by server on load)
│   ├── settings.jsx      ← optional custom settings UI
│   └── preview.png       ← optional screenshot for plugin browser
├── spotify/
│   ├── manifest.json
│   ├── widget.jsx
│   └── settings.jsx
```

### How It Works (3-layer system)

```
Layer 1: DISCOVERY (server)
  Server scans hub-plugins/, reads manifests, serves metadata
  Endpoint: GET /api/plugins → list of installed plugins + their manifests

Layer 2: COMPILATION (server)
  Server reads widget.jsx, transforms JSX → JS via esbuild
  Endpoint: GET /api/plugins/:id/widget → compiled JS module
  Endpoint: GET /api/plugins/:id/settings → compiled settings JS module

Layer 3: RUNTIME (client)
  Client loads compiled JS as a dynamic module
  Plugin component rendered inside a sandboxed wrapper
  Error boundary catches crashes — one bad plugin can't kill the dashboard
```

---

## Layer 1: Discovery

### Server: `routes/plugins.js`

```
GET /api/plugins
  → Scans ~/.openclaw/hub-plugins/*/manifest.json
  → Returns array of plugin metadata
  → Cached 10s (filesystem scan is cheap but not free)

GET /api/plugins/:id/manifest
  → Returns single plugin's manifest

POST /api/plugins/:id/enable
  → Saves to hub-config.json: enabledPlugins[id] = true

POST /api/plugins/:id/disable
  → Saves to hub-config.json: enabledPlugins[id] = false

GET /api/plugins/:id/config
  → Returns plugin-specific settings

POST /api/plugins/:id/config
  → Saves plugin-specific settings
```

### manifest.json Schema

```json
{
  "id": "clock",                          // required, unique, lowercase alphanumeric + hyphens
  "name": "Clock",                        // required, display name
  "description": "Shows current time",    // required, one line
  "author": "tigerandrune",               // required
  "version": "1.0.0",                     // required, semver
  "size": "small",                        // "small" | "medium" | "large" | "full"
  "permissions": [],                      // array of permission strings
  "settings": {                           // optional settings schema
    "format": {
      "type": "select",
      "label": "Time format",
      "options": ["12h", "24h"],
      "default": "24h"
    }
  }
}
```

**Validation rules:**
- `id` must match folder name
- `id` must be `[a-z0-9-]+` (no dots, no slashes, no unicode)
- `widget.jsx` must exist in same folder
- Unknown permissions are rejected

---

## Layer 2: Compilation

### Why compile server-side?

Raw JSX doesn't run in the browser. Options:
1. **Ship pre-built** — requires plugin authors to have a build step (bad DX)
2. **Compile in-browser** — huge Babel/SWC bundle, slow first load
3. **Compile on server** — fast (esbuild), transparent, cacheable ✅

### Server: esbuild transform

```js
// When GET /api/plugins/:id/widget is hit:
const jsx = readFileSync(`${pluginsDir}/${id}/widget.jsx`, 'utf8');
const result = esbuild.transformSync(jsx, {
  loader: 'jsx',
  format: 'esm',
  jsx: 'automatic',         // React 17+ transform
  jsxImportSource: 'react',
  target: 'es2020',
  minify: false,             // keep readable for auditing
});
// Serve result.code with Content-Type: application/javascript
```

**Caching:**
- In-memory cache keyed by `${id}:${mtime}`
- Cache invalidated when file changes
- No disk cache needed (esbuild transforms in <5ms)

### Import rewriting

Plugin code uses:
```jsx
import { useTheme, useConfig } from '@openclaw-hub/api';
```

Server rewrites this to:
```jsx
import { useTheme, useConfig } from '/api/plugins/_api.js';
```

The `_api.js` endpoint serves the plugin API module — a pre-built bundle that exposes all the hooks and utilities documented in plugin-api.md.

---

## Layer 3: Runtime

### Dynamic module loading

```jsx
// In the client, PluginLoader component:
async function loadPlugin(pluginId) {
  const module = await import(`/api/plugins/${pluginId}/widget`);
  return module.default; // the React component
}
```

### PluginWidget wrapper

Every plugin renders inside a wrapper:

```jsx
<PluginWidget
  id="clock"
  manifest={manifest}
  size="small"
>
  <ErrorBoundary fallback={<PluginCrashed id="clock" />}>
    <Suspense fallback={<PluginLoading />}>
      <PluginSandbox permissions={manifest.permissions}>
        <DynamicPluginComponent />
      </PluginSandbox>
    </Suspense>
  </ErrorBoundary>
</PluginWidget>
```

**What this gives us:**
1. **Error boundary** — plugin crash shows "Widget crashed" instead of blank page
2. **Suspense** — loading spinner while module loads
3. **Sandbox wrapper** — provides API context, enforces permissions
4. **Size** — outer div sets grid size based on manifest

### Plugin API Provider

Plugins access Hub data through a context provider, NOT direct imports:

```jsx
// PluginSandbox provides:
const pluginApi = {
  useTheme: () => currentTheme,
  useConfig: (id) => [pluginConfigs[id], updatePluginConfig(id)],
  useHubData: () => hubData,                    // filtered by permissions
  useInterval: (cb, ms) => safeInterval(cb, ms),
  useNotification: () => showNotification,
  pluginFetch: (url) => restrictedFetch(url, manifest.permissions),
};
```

### Permission enforcement

```js
function useHubData(permissions) {
  const fullData = useRawHubData();

  // Strip system info unless hub:system permission granted
  if (!permissions.includes('hub:system')) {
    delete fullData.system;
  }

  return fullData;
}

function restrictedFetch(url, permissions) {
  const domain = new URL(url).hostname;
  const allowed = permissions
    .filter(p => p.startsWith('network:'))
    .map(p => p.split(':')[1]);

  if (!allowed.includes(domain)) {
    throw new Error(`Plugin not permitted to access ${domain}`);
  }
  return fetch(url);
}
```

---

## Integration with Existing System

### Home.jsx changes

```jsx
// Current: hardcoded map
const WIDGET_MAP = {
  health: SystemHealthWidget,
  gateway: GatewayWidget,
  // ...
};

// New: dynamic map that includes plugins
const WIDGET_MAP = {
  // Built-in widgets (unchanged)
  health: SystemHealthWidget,
  gateway: GatewayWidget,
  notes: NotesWidget,
  activity: RecentActivityWidget,
  bookmarks: BookmarksWidget,
  heatmap: HeatmapWidget,
  channels: ChannelsWidget,
  model: ModelWidget,

  // Plugin widgets added dynamically
  // 'plugin:clock' → PluginWidget wrapper → dynamic import
};

// In render:
if (id.startsWith('plugin:')) {
  return <PluginWidget key={id} pluginId={id.replace('plugin:', '')} />;
}
const Widget = WIDGET_MAP[id];
```

### Widget picker (wizard + settings)

Built-in widgets show as before. Enabled plugins appear in a separate "Plugins" section of the picker with their manifest name + description.

### Config storage

```json
// hub-config.json additions:
{
  "enabledPlugins": {
    "clock": true,
    "spotify": true,
    "todo": false
  },
  "pluginConfigs": {
    "clock": { "format": "24h" },
    "spotify": { "clientId": "abc..." }
  }
}
```

---

## File Structure (new files to create)

```
server/
  routes/plugins.js           ← Discovery + compilation + config API
  lib/plugin-compiler.js      ← esbuild JSX transform + import rewriting
  lib/plugin-api-bundle.js    ← Pre-built @openclaw-hub/api module

src/
  components/
    PluginWidget.jsx           ← Wrapper: error boundary + suspense + sandbox
    PluginSandbox.jsx          ← API context provider + permission enforcement
    PluginCrashed.jsx          ← Crash fallback UI
    PluginLoading.jsx          ← Loading spinner
    PluginBrowser.jsx          ← Enable/disable + permission review UI
    PluginSettings.jsx         ← Auto-generated settings form from manifest

  hooks/
    usePluginLoader.js         ← Dynamic import + caching
    usePluginApi.js            ← The hooks that plugins consume
```

---

## Implementation Order

### Phase 1: Core (tonight?)
1. `server/routes/plugins.js` — discovery + manifest reading
2. `server/lib/plugin-compiler.js` — esbuild JSX→JS
3. `server/lib/plugin-api-bundle.js` — @openclaw-hub/api shim
4. `src/components/PluginWidget.jsx` — wrapper with error boundary
5. `src/hooks/usePluginLoader.js` — dynamic import
6. Home.jsx integration — render `plugin:*` IDs from widgetOrder
7. Example plugin: `clock` (drop in `~/.openclaw/hub-plugins/clock/`)

### Phase 2: Settings + Permissions
8. Plugin config read/write API
9. Auto-generated settings form from manifest schema
10. Permission review dialog on enable
11. `pluginFetch` with domain allowlist

### Phase 3: Polish
12. Plugin browser UI in Settings
13. Preview image support
14. Custom settings.jsx loading
15. Widget size grid integration

---

## Dependencies

Only ONE new dependency: **esbuild** (already in most Node.js projects as a transitive dep)

```bash
npm install esbuild --save
```

esbuild is:
- ~9MB, single binary, no deps
- Transforms JSX in <5ms
- Already used by Vite under the hood
- We only use `transformSync` — no bundling, no watching

---

## Security & Privacy Model

### What WE guarantee (the Hub itself)
- Zero telemetry, zero analytics, zero external calls
- All data from local `~/.openclaw/` files
- All assets bundled locally — no CDNs, no Google Fonts
- This applies to every line of code WE ship

### What we DON'T guarantee (third-party plugins)
Plugins run in the same JS context as the dashboard. A plugin *can*:
- Call `fetch()` to any URL
- Read the DOM
- Access `localStorage`
- Do anything JavaScript can do in a browser

**This is by design.** It's the same trust model as VS Code extensions, Obsidian plugins, Chrome extensions, and npm packages. Sandboxing (iframes, Web Workers) would severely limit what plugins can do and make the DX painful for plugin authors — all for security theater, since a determined bad actor can always find escape hatches.

### How we protect users instead

| Layer | What it does |
|-------|-------------|
| **Source is readable** | Plugins are `.jsx` files, not minified bundles. Users (and agents) can read the actual code before enabling. |
| **Permissions signal intent** | A clock widget declaring `network:sketchy.com` is an obvious red flag, even though we don't enforce it at runtime. |
| **Warning on enable** | Plugin browser shows clear warning: "Third-party plugins run with full access. Review the source before enabling." |
| **Agent install warning** | `AGENT_INSTALL` blocks include a caution so AI agents don't blindly install plugins without flagging the risk to the user. |
| **Error boundary** | A crashing plugin can't take down the dashboard — each widget is isolated via React error boundary. |
| **Config scoping** | Plugin API only exposes a plugin's own config by default. A plugin *could* bypass this, but the API doesn't make it easy. |

### For AI agents installing plugins

```
⚠️ AGENT CAUTION: Third-party Hub plugins run with full browser
access. Before installing or enabling a plugin on behalf of a user:
1. Read the widget.jsx source code
2. Check manifest.json permissions — flag anything unexpected
3. Ask the user before enabling plugins from unknown authors
4. Never auto-enable plugins without explicit user approval
```

---

## Open Questions

1. **Hot reload in dev?** Could watch plugin files and push updates via SSE. Nice-to-have, not V1.
2. **Plugin dependencies?** V1: plugins can only import from `@openclaw-hub/api` and `react`. No npm deps. Revisit if needed.
3. **Tasks as first plugin?** The Kanban/Tasks feature was removed from nav. Building it as the first real plugin would prove the system works.
4. **Future: opt-in CSP?** If the ecosystem grows and trust becomes harder, we could add an optional `Content-Security-Policy: connect-src 'self'` mode that blocks all external calls page-wide. Plugins needing network would go through a server proxy. Not V1 — premature until there's an actual ecosystem.

---

## Decision

Build Phase 1 tonight. It's ~6 files, one dependency, and we have a working example (clock) to prove it end-to-end. Phases 2-3 iterate from there.
