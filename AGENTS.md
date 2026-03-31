# AGENTS.md — For AI Coding Agents

You're working on **OpenClaw Hub**, a local-first personal dashboard for OpenClaw.

## Project Structure

```
openclaw-hub/
├── server/           # Express API (Node.js)
│   ├── index.js      # Entry point, security headers, static serving
│   └── routes/       # API routes (alerts, discover, gateway, services, etc.)
├── src/              # React frontend (Vite)
│   ├── components/   # Reusable components (Sidebar, Skeleton, etc.)
│   ├── pages/        # Page components (Home, Alerts, Services, etc.)
│   ├── hooks/        # Custom hooks (useApi, useTheme)
│   ├── context/      # React context (I18n, Config)
│   └── i18n/         # Translation files (8 languages)
├── docs/             # Documentation
├── test/             # Test suite
├── examples/         # Example plugins
└── scripts/          # Update script
```

## Key Rules

1. **No external requests.** No CDN, no analytics, no Google Fonts, no external APIs from the frontend. CSP enforces this.
2. **All user-facing text must be i18n'd.** Use `t('key')` — never hardcode English strings. Update all 8 language files: `en`, `sv`, `de`, `fr`, `es`, `pt`, `ja`, `zh`.
3. **Config lives outside the repo** at `~/.openclaw/hub-config.json`. Never commit user config.
4. **All widgets must use the `widget-card` class.**
5. **Hash functions must coerce inputs to `String()`** — channels and agents can be numbers.
6. **Test before committing:** `npm run build && npm test` must both pass.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, dnd-kit, Lucide icons
- **Backend:** Express, reads from OpenClaw config (`~/.openclaw/`)
- **Styling:** CSS custom properties (`var(--bg)`, `var(--text)`, `var(--accent)`, etc.) + Tailwind utilities
- **i18n:** Custom context — `useI18n()` returns `{ t, lang }`. `t(key, vars)` with interpolation.
- **Data fetching:** `useApi(url, interval)` hook with visibility-based polling

## API Endpoints

All API routes are at `/api/*` and read local system state. No authentication (localhost only).

- `/api/system` — CPU, memory, disk, uptime
- `/api/gateway` — OpenClaw gateway status
- `/api/discover` — Channels, model, memory services
- `/api/services/pm2` — PM2 process list
- `/api/services/plugins` — Installed plugins
- `/api/alerts` — Health alerts with severity
- `/api/alerts/test` — 6 fake alerts for testing

## Common Patterns

**Adding a new widget:**
1. Create component in `src/components/widgets/`
2. Add to `WIDGET_MAP` in `src/pages/Home.jsx`
3. Wrap in `<WidgetErrorBoundary>`
4. Add i18n keys to all 8 language files

**Adding an API route:**
1. Create route file in `server/routes/`
2. Mount in `server/index.js`
3. Keep it read-only — Hub observes, it doesn't control

**Adding i18n keys:**
- Edit all 8 files in `src/i18n/`
- `getString(lang, key)` falls back to English, then returns the key itself
- `t(key, vars)` — second arg is interpolation vars, not a fallback
