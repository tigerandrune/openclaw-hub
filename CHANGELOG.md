# Changelog

## 2.1.0 — 2026-03-31

### Added
- **Alert indicators**: Red/yellow badge on sidebar Bell icon and home page banner linking to Alerts
- **Loading states**: App shell spinner before React loads, skeleton placeholders on Home page
- **Widget error boundaries**: Crashed widgets show retry button instead of blanking the page
- **Mobile bottom nav**: 5-tab bar with alert badge, safe area insets for notched phones
- **Sidebar signature**: "Made with ♥ by Tiger × Rune"
- **Screenshots**: 4 real screenshots in README (home, alerts, services, settings)

### Fixed
- Alert titles use proper casing ("Cpu usage" not "CPU USAGE")
- Down processes say "not running" instead of "not responding"
- Restart count thresholds show count, not percentage
- Drag-and-drop grabs entire widget card, not just grip icon
- Non-string channel/agent values no longer crash activity widgets
- CSP allows `data:` URIs for bundled fonts
- Security advisory link points to correct repo

### Cleaned
- Removed debug `console.log`s from PluginWidget
- Removed unused imports (`Plus`, `Users`)
- Removed dead `.bottom-nav` CSS

---

## 2.0.0 — 2026-03-31

First public release.

### Features

- **Dashboard**: 8 built-in widgets (system health, gateway, channels, model, notes, bookmarks, heatmap, activity)
- **Drag-and-drop**: Reorder widgets on Home via dnd-kit
- **Activity page**: Session timeline, usage heatmap, channel breakdown
- **Costs page**: Spending trends, model breakdown, budget tracking
- **Services page**: PM2 processes, plugins, skills, memory overview
- **Notifications page**: Alert history with severity filtering
- **Settings page**: Theme, accent color, language, sidebar style, profiles, plugins, export/import
- **Command Palette**: `Ctrl+K` spotlight search — navigate, run actions, switch themes, toggle plugins
- **Setup Wizard**: 8-step onboarding (name, language, theme, widgets, sidebar, actions, profiles, summary)
- **Plugin System**: Drop-folder install, esbuild JSX→ESM compilation, import rewriting, error boundaries
- **Plugin API**: `useTheme`, `useConfig`, `useHubData`, `useLanguage`, `useTranslations`
- **Widget sizes**: Plugins declare `small`/`medium`/`large`/`full`, enforced in CSS grid
- **Multi-user profiles**: Create, switch, delete — per-user config files
- **i18n**: 8 languages × 289 keys (en, sv, de, fr, es, pt, ja, zh)
- **Responsive**: Desktop sidebar, tablet collapse, mobile bottom nav
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Test suite**: 33 tests + diagnostic mode for troubleshooting

### Example Plugins

- **Clock**: Time display with 12/24h toggle, 8 languages (included in `examples/plugins/`)
- **Kanban Board**: Drag-and-drop task board ([separate repo](https://github.com/openclaw/openclaw-hub-kanban))

### Security

- Zero external requests (no CDN, no analytics, no telemetry)
- Content Security Policy enforced
- Server version suppressed
- Plugin ID validation + path traversal protection
- See [SECURITY.md](SECURITY.md) for the full guide
