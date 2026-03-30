# Phase 2 — Execution Plan (Revised after Critic Review)

## Overview
Four features: Settings, Services, Activity, Quick Actions.
All follow existing patterns: Express route → React page → i18n keys → Tailwind styling.

## Security Mandates (from Critic review)
1. **All exec calls use `execFile()` with array args** — NEVER template strings with `exec()`
2. **PM2 action names validated against whitelist**: only `start`, `stop`, `restart`
3. **PM2 process names validated against live `pm2 jlist`** before any action
4. **Action IDs validated against hardcoded server-side map** — config only stores which to display, never commands
5. **Server binds `127.0.0.1` only** (already behind Cloudflare tunnel)
6. **Rate limiting on mutating endpoints** — 5s cooldown per process/action
7. **All new routes handle missing data gracefully** — no crashes on fresh installs

---

## 1. Settings Page (M)

### Backend
- **No new routes needed** — uses existing `/api/config` (GET/POST)

### Frontend
- **Create:** `src/pages/Settings.jsx`
  - Sections: Profile, Appearance, Layout, System
  - Profile: name input, language dropdown (reuse `languages` from i18n/index.js)
  - Appearance: theme cards (reuse from wizard), accent color picker
  - Layout: sidebar style toggle, widget order (up/down buttons — no DnD library, keep it simple), toggle pages on/off
  - System: "Redo setup wizard" button — passes current config as initial values to SetupWizard so nothing is lost
  - All changes save via `saveConfig()` from ConfigContext
- **Modify:** `src/App.jsx` — add `/settings` route
- **i18n keys needed:** `settings.title`, `settings.profile`, `settings.appearance`, `settings.layout`, `settings.system`, `settings.redoWizard`, `settings.saved`

### Dependencies: None — can start immediately
### Agent: Pixel

---

## 2. Services Page (L)

### Backend
- **Create:** `server/routes/services.js`
  - `GET /api/services/pm2` — use `execFile('pm2', ['jlist'])` (no shell), return parsed JSON. If PM2 not installed, return `{ available: false, processes: [] }`
  - `POST /api/services/pm2/:name/:action` — whitelist action to `['start','stop','restart']`, validate `:name` against live PM2 process list, then `execFile('pm2', [action, name])`. Rate limit: 5s cooldown per process. Return 429 if too fast.
  - `GET /api/services/plugins` — read `plugins` key from `openclaw.json` (not filesystem scan)
  - `GET /api/services/skills` — scan `~/.openclaw/skills/` + `~/.openclaw/workspace/skills/`, read first heading + first paragraph from SKILL.md (max 1KB read per file)
  - **Reuse helpers from `discover.js`** where possible (don't duplicate PM2/plugin/skill scanning logic)
- **Modify:** `server/index.js` — mount `/api/services`

### Frontend
- **Create:** `src/pages/Services.jsx`
  - Tab layout: PM2 Processes | Plugins | Skills
  - PM2 tab: table with status dot, name, CPU%, mem, uptime, restarts, action buttons (start/stop/restart)
  - Plugins tab: card grid with name, status (enabled/disabled)
  - Skills tab: card grid with name, description from SKILL.md
  - Auto-refresh every 10s for PM2 data
- **Modify:** `src/App.jsx` — add `/services` route
- **i18n keys needed:** `services.title`, `services.pm2`, `services.plugins`, `services.skills`, `services.start`, `services.stop`, `services.restart`, `services.status.*`, `services.noProcesses`, `services.cpu`, `services.memory`, `services.uptime`, `services.restarts`, `services.pid`

### Dependencies: None — can parallel with Settings
### Agent: Forge (backend), Pixel (frontend)

---

## 3. Activity Page (M)

### Backend
- **Create:** `server/routes/activity.js`
  - `GET /api/activity/sessions` — find where OpenClaw stores session data (check `~/.openclaw/sessions/`, `~/.openclaw/data/`, openclaw.json for paths). If directory missing, return `{ sessions: [], source: null }` gracefully.
  - `GET /api/activity/summary` — aggregate: total sessions, messages per channel, recent activity
  - Limit: last 50 sessions by default, `?limit=N` param
  - **Do NOT scan `~/.openclaw/completions/`** — those are shell completion scripts, not session data

### Frontend
- **Create:** `src/pages/Activity.jsx`
  - Session timeline (list view, most recent first)
  - Per-session: timestamp, channel badge, duration, message count
  - Channel breakdown (simple bar or stat cards — no chart library needed)
  - Empty state for fresh installs
- **Modify:** `src/components/widgets/RecentActivityWidget.jsx` — fetch from `/api/activity/sessions?limit=5`, replace Phase 2 placeholder
- **Modify:** `src/App.jsx` — add `/activity` route
- **i18n keys needed:** `activity.title`, `activity.sessions`, `activity.channels`, `activity.empty`, `activity.duration`, `activity.messages`, `activity.ago`

### Dependencies: None — can parallel
### Agent: Forge (backend), Pixel (frontend)

---

## 4. Quick Actions (S)

### Backend
- **Create:** `server/routes/actions.js`
  - `GET /api/actions` — list available actions from hardcoded server-side map
  - `POST /api/actions/:id/execute` — validate `:id` against hardcoded action map (NEVER user-defined commands), use `execFile()` with array args, rate limit 5s cooldown per action
  - **Hardcoded action map (const, not from config):**
    - `restart-gateway` → `execFile('openclaw', ['gateway', 'restart'])`
    - `check-logs` → read last 50 lines from gateway log file (no exec needed)
    - `gateway-status` → `execFile('openclaw', ['gateway', 'status'])`
  - Config `quickActions` array only stores which IDs to display, never commands

### Frontend
- **Modify:** `src/pages/Home.jsx` — add quick action buttons section below greeting
  - Show actions from `config.quickActions` as small buttons
  - Click → POST to execute → show result toast
- **Modify:** `src/pages/Settings.jsx` — add "Quick Actions" section to configure which actions show on home
- **i18n keys needed:** `actions.restartGateway`, `actions.checkLogs`, `actions.gatewayStatus`, `actions.executing`, `actions.success`, `actions.failed`

### Dependencies: Settings page (for config UI), but execution works standalone
### Agent: Forge (backend), Pixel (actions on Home)

---

## Parallel Execution Plan

### Wave 1 (parallel)
- **Forge:** Services backend (`server/routes/services.js`) + Activity backend (`server/routes/activity.js`) + Actions backend (`server/routes/actions.js`)
- **Pixel:** Settings page + Services frontend + Activity frontend

### Wave 2 (after Wave 1)
- **Pixel:** Quick Actions on Home + Settings integration
- **Pixel:** Wire RecentActivityWidget to real data

### Wave 3
- **Scout:** Test all new routes + pages
- **Shield:** Security review (especially PM2 exec and action execution)
- **Verifier:** Completion gate

---

## i18n
All new strings need keys in all 8 language files: en, sv, de, fr, es, pt, ja, zh.
Add keys as components are built, translate in a single batch at the end.

## File Summary
### Create (6 files)
- `server/routes/services.js`
- `server/routes/activity.js`
- `server/routes/actions.js`
- `src/pages/Settings.jsx`
- `src/pages/Services.jsx`
- `src/pages/Activity.jsx`

### Modify (5 files)
- `server/index.js` (mount new routes)
- `src/App.jsx` (add routes)
- `src/pages/Home.jsx` (quick actions)
- `src/components/widgets/RecentActivityWidget.jsx` (real data)
- `src/i18n/*.json` (all 8 files — new keys)
