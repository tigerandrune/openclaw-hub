# OpenClaw Hub

A personal dashboard for [OpenClaw](https://github.com/openclaw/openclaw) — monitor your gateway, manage services, track costs, and extend with plugins.

**Privacy first.** Zero external requests. No analytics, no CDN, no telemetry. Everything runs on your machine.

## Features

- 🏠 **Home** — Widget dashboard with drag-and-drop reorder
- 📊 **Activity** — Session timeline, usage heatmap, channel breakdown
- 💰 **Costs** — Spending trends, model breakdown, daily/weekly/monthly views
- 🔧 **Services** — PM2 processes, installed plugins, skills, memory stats
- 🔔 **Notifications** — Alert history with severity filtering
- ⚙️ **Settings** — Themes, accent colors, profiles, plugins, export/import
- ⌨️ **Command Palette** — `Ctrl+K` to search, navigate, and run actions
- 🧩 **Plugin System** — Drop a folder, get a widget. JSX compiled on the fly.
- 👥 **Multi-User** — Profile switching with per-user config
- 🌐 **8 Languages** — English, Swedish, German, French, Spanish, Portuguese, Japanese, Chinese
- 📱 **Responsive** — Desktop sidebar, tablet collapse, mobile bottom nav

## Quick Start

```bash
git clone https://github.com/openclaw/openclaw-hub.git
cd openclaw-hub
npm install
npm run build
npm start
```

Open `http://localhost:3100`. The setup wizard walks you through configuration.

**With PM2 (recommended for production):**

```bash
pm2 start server/index.js --name openclaw-hub
pm2 save
```

Set `PORT` environment variable to change the default port.

## Setup Wizard

On first launch, you'll configure:

1. **Name** — What to call you
2. **Language** — Pick from 8 languages
3. **Theme** — Dark, light, midnight, or sunset + accent color
4. **Widgets** — Choose which widgets appear on Home
5. **Sidebar** — Full labels or compact icons
6. **Quick Actions** — Pin frequently used actions to Home
7. **Profiles** — Enable multi-user mode (optional)
8. **Summary** — Review and launch

Everything can be changed later in Settings.

## Plugins

Plugins live in `~/.openclaw/hub-plugins/`. Each plugin is a folder with two files:

```
~/.openclaw/hub-plugins/
  my-plugin/
    manifest.json    # Name, description, version, settings schema
    widget.jsx       # React component (compiled to ESM automatically)
```

### Creating a Plugin

```jsx
// widget.jsx
import { useTheme, useConfig, useTranslations } from '@openclaw-hub/api';

const i18n = {
  en: { title: 'My Plugin', greeting: 'Hello' },
  sv: { title: 'Mitt Plugin', greeting: 'Hej' },
};

export default function MyPlugin() {
  const theme = useTheme();
  const [config] = useConfig('my-plugin');
  const t = useTranslations(i18n);

  return <div style={{ color: theme.accent }}>{t('greeting')}</div>;
}
```

See [`examples/plugins/clock/`](examples/plugins/clock/) for a complete working example, or read the full guide: [docs/creating-plugins.md](docs/creating-plugins.md).

### Plugin API

| Hook | Returns | Description |
|------|---------|-------------|
| `useTheme()` | `{ accent, text, muted, surface, ... }` | Current Hub theme colors |
| `useConfig(id)` | `[config, saveConfig]` | Per-plugin persistent settings |
| `useHubData(path)` | `{ data, loading, error }` | Fetch from Hub API |
| `useLanguage()` | `string` | Current language code (`'en'`, `'sv'`, ...) |
| `useTranslations(i18n)` | `(key) => string` | Translation function with fallback |

Full API reference: [docs/plugin-api.md](docs/plugin-api.md)

### Widget Sizes

Plugins declare their size in `manifest.json`:

| Size | Grid Behavior |
|------|--------------|
| `small` | 1 column |
| `medium` | 1 column (default) |
| `large` | 2 columns |
| `full` | Full width |

### Community Plugins

| Plugin | Description | Repo |
|--------|-------------|------|
| **Kanban Board** | Drag-and-drop task board | [openclaw-hub-kanban](https://github.com/openclaw/openclaw-hub-kanban) |

## Troubleshooting

```bash
# Quick check — does everything work?
npm test

# Detailed report with system diagnostics
npm run test:diagnose

# Verbose — see every test result
npm run test:verbose

# Machine-readable output (for AI agents)
JSON_OUTPUT=1 npm test
```

The test suite doubles as a diagnostic tool. If something's broken, the output tells you (or your AI assistant) exactly what and why.

## Security

Hub ships with security headers (CSP, X-Frame-Options, CORS), plugin sandboxing, and path traversal protection out of the box.

It has **no built-in authentication** — on your own machine, you are the auth. For remote access, use Cloudflare Tunnel (free) or Tailscale.

Read the full guide: [SECURITY.md](SECURITY.md)

## Tech Stack

- **Frontend**: React 19, Vite, Framer Motion, dnd-kit, Lucide icons
- **Backend**: Express, esbuild (plugin compilation)
- **Storage**: JSON files in `~/.openclaw/`
- **Tests**: 33 built-in tests (server, security, API, plugins, assets)
- **Zero external dependencies at runtime**

## Project Structure

```
├── server/
│   ├── index.js                  # Express server + security headers
│   ├── routes/                   # API endpoints (config, system, gateway, plugins, ...)
│   └── lib/
│       ├── plugin-compiler.js    # esbuild JSX → ESM compilation
│       └── plugin-api-source.js  # @openclaw-hub/api module source
├── src/
│   ├── components/
│   │   ├── CommandPalette.jsx    # Ctrl+K spotlight search
│   │   ├── Layout.jsx            # Shell with sidebar/bottom nav
│   │   ├── PluginWidget.jsx      # Dynamic plugin loader + error boundary
│   │   └── widgets/              # Built-in dashboard widgets
│   ├── context/                  # Theme, Config, I18n providers
│   ├── hooks/                    # useApi, etc.
│   ├── i18n/                     # 8 language files (289 keys each)
│   └── pages/                    # Route pages (Home, Activity, Costs, ...)
├── examples/plugins/             # Example plugin (clock)
├── test/                         # Test & diagnostic suite
├── docs/                         # Architecture, API, security docs
├── SECURITY.md                   # Security guide + remote access
└── dist/                         # Built frontend (served by Express)
```

## Documentation

| Doc | Description |
|-----|-------------|
| [SECURITY.md](SECURITY.md) | Security model, remote access, plugin safety |
| [docs/creating-plugins.md](docs/creating-plugins.md) | Plugin authoring guide |
| [docs/plugin-api.md](docs/plugin-api.md) | Plugin API reference |
| [docs/plugin-security.md](docs/plugin-security.md) | Plugin permission model |
| [docs/PLUGIN-ARCHITECTURE.md](docs/PLUGIN-ARCHITECTURE.md) | Architecture design doc |
| [docs/MULTI-PROFILE.md](docs/MULTI-PROFILE.md) | Multi-user profile system |

## Contributing

This is an [OpenClaw](https://github.com/openclaw/openclaw) community project. Issues and PRs welcome.

Join the discussion: [OpenClaw Discord](https://discord.com/invite/clawd)

## License

MIT — [Tiger × Rune](https://tigerandrune.dev)
