# Plugin API Reference

Everything your plugin can access.

## Hooks

### useTheme()

Get the current dashboard theme colors. Use these to match the user's style.

```jsx
import { useTheme } from '@openclaw-hub/api';

const theme = useTheme();
// theme.bg        → background color
// theme.surface   → card/panel background
// theme.border    → border color
// theme.text      → primary text
// theme.muted     → secondary text
// theme.accent    → user's accent color (gold, blue, etc.)
// theme.success   → green
// theme.warning   → amber
// theme.error     → red
// theme.isDark    → boolean
```

### useConfig(pluginId)

Read and write your plugin's settings. Persisted across restarts.

```jsx
import { useConfig } from '@openclaw-hub/api';

const [config, setConfig] = useConfig('my-plugin');

// Read
console.log(config.city); // "Stockholm"

// Write (merges with existing config)
setConfig({ city: "Umeå" });
```

### useHubData()

Access system information. Read-only. Updates automatically.

```jsx
import { useHubData } from '@openclaw-hub/api';

const data = useHubData();
// data.gateway.status    → "online" | "offline"
// data.gateway.model     → "claude-sonnet-4-20250514"
// data.gateway.uptime    → seconds
// data.system.cpu        → percentage (0-100)
// data.system.memory     → { used, total, percentage }
// data.system.disk       → { used, total, percentage }
// data.channels          → ["discord", "telegram", ...]
// data.sessions.total    → number
// data.sessions.today    → number
// data.user.name         → "Tiger"
// data.user.theme        → "dark"
```

**Requires permission:** `hub:system` for CPU/memory/disk. Everything else is available by default.

### useInterval(callback, ms)

Run something on a timer. Automatically cleans up when the widget unmounts.

```jsx
import { useInterval } from '@openclaw-hub/api';

useInterval(() => {
  // refresh data every 30 seconds
  fetchMyData();
}, 30000);
```

### useNotification()

Show a toast notification to the user.

```jsx
import { useNotification } from '@openclaw-hub/api';

const notify = useNotification();

notify({
  title: "Song changed",
  message: "Now playing: Something Good",
  type: "info"  // "info" | "success" | "warning" | "error"
});
```

## Actions

### registerAction(id, label, handler)

Add a command to the Ctrl+K command palette.

```jsx
import { registerAction } from '@openclaw-hub/api';

registerAction('spotify-play-pause', 'Spotify: Play/Pause', () => {
  togglePlayback();
});
```

Users can then trigger your action from the command palette without opening your widget.

## Network Requests

Plugins **cannot** make network requests by default. If your plugin needs to call an external API:

1. Declare the domain in `manifest.json`:
```json
{
  "permissions": ["network:api.spotify.com"]
}
```

2. Use the provided fetch wrapper:
```jsx
import { pluginFetch } from '@openclaw-hub/api';

// Only works for domains declared in permissions
const response = await pluginFetch('https://api.spotify.com/v1/me/player');
const data = await response.json();
```

Regular `fetch()` and `XMLHttpRequest` are blocked for plugins. This is intentional.

## Permissions

| Permission | What it allows | When you need it |
|------------|---------------|-----------------|
| (none) | Theme, config, notifications, actions | Most widgets |
| `hub:system` | CPU, memory, disk data | System monitors |
| `hub:config` | Read hub-wide configuration | Widgets that adapt to setup |
| `network:<domain>` | HTTP requests to that domain | External APIs (Spotify, weather, etc.) |
| `filesystem:read` | Read files in scoped directory | File viewers, log readers |
| `filesystem:write` | Write files in scoped directory | Note-taking, data export |

**Rule of thumb:** request the minimum permissions you need. Users see the permission list before enabling your plugin. Fewer permissions = more trust = more installs.

## Lifecycle

```
Plugin folder detected
  → manifest.json parsed
  → appears in Settings → Plugins (disabled)
  
User enables plugin
  → permissions reviewed and approved
  → widget.jsx loaded
  → appears in widget picker
  
User adds to home page
  → component mounted
  → hooks activate (data flows, timers start)
  
User removes from home page
  → component unmounted
  → timers cleaned up, connections closed
  
User disables plugin
  → removed from widget picker
  → settings preserved (re-enable = same config)
```

## Styling Guidelines

- Use `useTheme()` for colors — don't hardcode
- Respect the user's font choice — use `inherit` for font-family
- Keep padding consistent: `1rem` inside your widget
- The card wrapper (border, shadow, rounded corners) is provided by Hub — you only style the inside
- Test in both light and dark themes

## Debugging

During development, open browser devtools. Your widget runs in the same context as Hub. Console logs, breakpoints, and React DevTools all work normally.

Hub logs plugin errors to the console with the prefix `[hub-plugin:your-id]`.
