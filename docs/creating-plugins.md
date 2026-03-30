# Creating a Plugin

You want to add something to OpenClaw Hub. Here's how.

## The Short Version

1. Create a folder in `~/.openclaw/hub-plugins/`
2. Add a `manifest.json` (what it is)
3. Add a `widget.jsx` (what it looks like)
4. Done. It shows up in the dashboard.

## Step by Step

### 1. Create the folder

```bash
mkdir -p ~/.openclaw/hub-plugins/my-widget
cd ~/.openclaw/hub-plugins/my-widget
```

### 2. Create manifest.json

This tells Hub what your plugin is and what it needs.

```json
{
  "id": "my-widget",
  "name": "My Widget",
  "description": "A short sentence about what it does.",
  "author": "your-name",
  "version": "1.0.0",
  "size": "medium",
  "permissions": [],
  "settings": {}
}
```

**Size options:**
| Size | Grid | Good for |
|------|------|----------|
| `small` | 1×1 | Single number, status indicator |
| `medium` | 2×1 | Charts, lists, players |
| `large` | 2×2 | Tables, detailed views |
| `full` | full width | Dashboards within dashboards |

**Permissions:** Leave empty unless you need them. See [Plugin API](plugin-api.md#permissions) for options.

### 3. Create widget.jsx

This is a React component. It gets rendered inside a card on the dashboard.

```jsx
import { useTheme } from '@openclaw-hub/api';

export default function MyWidget() {
  const theme = useTheme();
  
  return (
    <div style={{ color: theme.text }}>
      <h3>Hello from my widget</h3>
      <p>It works.</p>
    </div>
  );
}
```

That's it. That's a working plugin.

### 4. See it in the dashboard

Open Hub → Settings → Plugins → Enable "My Widget" → it appears in your widget picker.

No restart needed.

## Adding Settings

If your plugin needs configuration (API keys, preferences, etc.), add a `settings` field to the manifest and create `settings.jsx`.

**manifest.json:**
```json
{
  "settings": {
    "city": {
      "type": "string",
      "label": "Your city",
      "default": "Stockholm"
    },
    "units": {
      "type": "select",
      "label": "Temperature units",
      "options": ["celsius", "fahrenheit"],
      "default": "celsius"
    }
  }
}
```

Hub auto-generates a settings form from this. But if you want a custom settings UI:

**settings.jsx:**
```jsx
import { useConfig } from '@openclaw-hub/api';

export default function MySettings() {
  const [config, setConfig] = useConfig('my-widget');
  
  return (
    <div>
      <label>City</label>
      <input 
        value={config.city || ''} 
        onChange={e => setConfig({ ...config, city: e.target.value })}
      />
    </div>
  );
}
```

## Adding a Preview Image

Drop a `preview.png` (400×300px recommended) in your plugin folder. This shows up in the plugin browser so people know what it looks like before enabling it.

## Real Example: Clock Widget

A complete minimal plugin:

**~/.openclaw/hub-plugins/clock/manifest.json**
```json
{
  "id": "clock",
  "name": "Clock",
  "description": "Shows the current time. That's it.",
  "author": "tigerandrune",
  "version": "1.0.0",
  "size": "small",
  "permissions": [],
  "settings": {
    "format": {
      "type": "select",
      "label": "Time format",
      "options": ["12h", "24h"],
      "default": "24h"
    }
  }
}
```

**~/.openclaw/hub-plugins/clock/widget.jsx**
```jsx
import { useState, useEffect } from 'react';
import { useConfig, useTheme } from '@openclaw-hub/api';

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const [config] = useConfig('clock');
  const theme = useTheme();
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatted = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: config.format === '12h'
  });
  
  return (
    <div style={{ 
      color: theme.accent, 
      fontSize: '2rem', 
      fontWeight: 'bold',
      textAlign: 'center' 
    }}>
      {formatted}
    </div>
  );
}
```

Two files. Under 40 lines. Fully functional.

## Publishing

When your plugin is ready:

1. Push it to a GitHub repo
2. Add an Agent Install section (see below)
3. Optionally publish to ClawHub: `clawhub publish ~/.openclaw/hub-plugins/my-widget`

<!-- AGENT_INSTALL_START -->
```bash
# Install this plugin
cd ~/.openclaw/hub-plugins
git clone https://github.com/AUTHOR/PLUGIN_NAME.git
# No build step needed — Hub loads it automatically
```

**Requirements:** OpenClaw Hub installed
**Verify:** Plugin appears in Hub → Settings → Plugins
<!-- AGENT_INSTALL_END -->

## Next Steps

- [Plugin API Reference](plugin-api.md) — all available hooks and data
- [Security & Permissions](plugin-security.md) — what permissions mean and when to use them
