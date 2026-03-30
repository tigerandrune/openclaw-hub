# OpenClaw Hub

A personal dashboard for [OpenClaw](https://github.com/openclaw/openclaw) — monitor your gateway, manage services, track costs, and extend with plugins.

**Privacy first.** Zero external requests. No analytics, no CDN, no telemetry. Everything runs on your machine.

## Features

- 🏠 **Home** — Customizable widget dashboard with drag-and-drop reorder
- 📊 **Activity** — Session timeline, usage heatmap, channel breakdown
- 💰 **Costs** — Spending trends, model breakdown, daily/weekly/monthly views
- 🔧 **Services** — PM2 processes, installed plugins, skills, memory stats
- 🔔 **Notifications** — Alert history with severity filtering
- ⚙️ **Settings** — Themes, accent colors, profiles, export/import config
- ⌨️ **Command Palette** — Ctrl+K to search, navigate, and run actions
- 🧩 **Plugin System** — Drop a folder, get a widget. JSX compiled on the fly.
- 👥 **Multi-User** — Profile switching with per-user config
- 🌐 **i18n** — English, Swedish, German, French, Spanish, Portuguese, Japanese, Chinese
- 📱 **Responsive** — Desktop sidebar, tablet collapse, mobile bottom nav

## Quick Start

```bash
# Clone
git clone https://github.com/openclaw/openclaw-hub.git
cd openclaw-hub

# Install
npm install

# Build frontend
npm run build

# Start (production)
node server/index.js

# Or with PM2
pm2 start server/index.js --name openclaw-hub
```

The dashboard runs on `http://localhost:3100` by default. Set `PORT` env var to change it.

## Setup Wizard

On first launch, a setup wizard walks you through:

1. **Name** — What to call you
2. **Language** — Pick from 8 languages
3. **Theme** — Dark, light, midnight, or sunset + accent color
4. **Widgets** — Choose which widgets appear on Home
5. **Sidebar** — Full labels or compact icons
6. **Quick Actions** — Pin frequently used actions
7. **Profiles** — Enable multi-user mode (optional)
8. **Summary** — Review and launch

## Plugins

Plugins live in `~/.openclaw/hub-plugins/`. Each plugin is a folder with:

```
~/.openclaw/hub-plugins/
  my-plugin/
    manifest.json    # Name, description, version, permissions
    widget.jsx       # React component (compiled to ESM on the fly)
```

### Plugin API

Plugins import from `@openclaw-hub/api`:

```jsx
import { useTheme, useConfig, useHubData, useTranslations, useLanguage } from '@openclaw-hub/api';

const i18n = {
  en: { title: 'My Plugin' },
  sv: { title: 'Mitt Plugin' },
};

export default function MyPlugin() {
  const theme = useTheme();        // { accent, text, muted, surface, ... }
  const [config] = useConfig('my-plugin');  // Per-plugin settings
  const t = useTranslations(i18n); // Localized strings

  return <div style={{ color: theme.accent }}>{t('title')}</div>;
}
```

See [docs/creating-plugins.md](docs/creating-plugins.md) for the full guide.

### Example Plugin

The `examples/plugins/clock/` directory contains a complete example plugin — a clock widget with 12/24h toggle and 8-language support. Copy it to get started:

```bash
cp -r examples/plugins/clock ~/.openclaw/hub-plugins/clock
```

### Community Plugins

| Plugin | Description | Repo |
|--------|-------------|------|
| **Kanban Board** | Drag-and-drop task board | [openclaw-hub-kanban](https://github.com/openclaw/openclaw-hub-kanban) |

## Widget Sizes

Plugins declare their size in `manifest.json`:

| Size | Grid Behavior |
|------|--------------|
| `small` | 1 column |
| `medium` | 1 column |
| `large` | 2 columns |
| `full` | Full width |

## Tech Stack

- **Frontend**: React 19, Vite, Framer Motion, dnd-kit, Lucide icons
- **Backend**: Express, ESBuild (plugin compilation)
- **Storage**: JSON files in `~/.openclaw/`
- **Zero dependencies on external services**

## Security

- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **No external requests**: All assets bundled, no CDN, no fonts loaded externally
- **Plugin sandboxing**: ID validation, path traversal protection, permission declarations
- **CORS**: Enabled for local development only

See [docs/plugin-security.md](docs/plugin-security.md) for the plugin security model.

## Project Structure

```
├── server/
│   ├── index.js              # Express server
│   ├── routes/               # API endpoints
│   └── lib/
│       ├── plugin-compiler.js    # ESBuild JSX → ESM
│       └── plugin-api-source.js  # @openclaw-hub/api module
├── src/
│   ├── components/           # React components
│   │   ├── CommandPalette.jsx
│   │   ├── Layout.jsx
│   │   ├── PluginWidget.jsx
│   │   └── widgets/          # Built-in widgets
│   ├── context/              # Theme, Config, I18n providers
│   ├── hooks/                # useApi, etc.
│   ├── i18n/                 # Translation files (8 languages)
│   └── pages/                # Route pages
├── docs/                     # Documentation
└── dist/                     # Built frontend (served by Express)
```

## Configuration

All config lives in `~/.openclaw/hub-config.json` (or `hub-config-{profile}.json` for multi-user). Fully exportable and importable from Settings.

## Contributing

This is an [OpenClaw](https://github.com/openclaw/openclaw) community project. Issues and PRs welcome.

## License

MIT
