# OpenClaw Hub — Spec

> A personal dashboard for OpenClaw. Works on any install, feels like yours.

## Principles

1. **Privacy first** — zero telemetry, zero analytics, zero external calls. Your data never leaves your machine. No CDNs, no Google Fonts, no tracking pixels, no "anonymous usage data." Nothing phones home. Ever.
2. **Auto-discover** — detect what's available, hide what's missing
3. **No external dependencies** — all data from local `~/.openclaw/` files. All assets bundled locally.
4. **Works on first launch** — fresh install with zero sessions should look good
5. **Personal space** — customizable, not generic
6. **Universal** — works across all OpenClaw installs
7. **Auditable** — open source, no minified blobs, no hidden endpoints. Anyone can read every line.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express (API layer)
- **Port:** 3100
- **Config:** `~/.openclaw/hub-config.json` (user preferences)
- **No database** — JSON files + filesystem reads

## First-Run Setup Wizard

Interactive, conversational onboarding. Runs once, < 30 seconds.

### Step 1: "What should we call you?"
- Name input
- Sets greeting across dashboard

### Step 2: "Pick your vibe"
- Theme previews: Dark (default), Light, Norse (gold/charcoal)
- Live preview on click, confirm to select
- Custom accent color option

### Step 3: "What do you care about?"
- Toggleable cards for each feature/page
- Auto-detect availability (dim unavailable, explain why)
- Categories: System Health, Activity, Costs, Tasks, Services, Notes
- Everything on by default, user turns off what they don't want

### Step 4: "Arrange your home"
- Drag enabled widgets into preferred order
- Top = most prominent on home page

### Step 5: "You're set"
- Summary of choices
- "Change anytime in Settings"
- "Let's go" button → straight to dashboard

### Step 3b: "Sidebar style"
- Icons + text (full sidebar)
- Icons only (compact)
- Preview both live

### Step 3c: "Quick actions"
- Show available actions as toggleable cards
- Restart gateway, check logs, clear sessions, switch model, etc.
- Selected ones get pinned to home page as quick-action buttons

### Step 6 (optional): "Will anyone else use this?"
- Toggle: "Just me" / "Multiple people"
- If multi-user: create first profile, explain how to add more
- If single: skip profile system entirely, simpler config

**Rules:**
- Only runs on first visit (no config file exists)
- "Redo setup" available in Settings
- No "next/next/next" — card-swipe feel, fast

## Pages

### Home
- Personalized greeting ("Good evening, Tiger")
- Widget-based layout (user-arranged)
- Available widgets:
  - System health (CPU, memory, disk)
  - Gateway status (online/offline, model, uptime)
  - Active channels (Discord, Telegram, Signal, etc.)
  - Quick notes (scratchpad, saved locally)
  - Recent activity (last 5 sessions)
  - Current model info

### Activity
- Session timeline
- Messages per channel (bar chart)
- Agent activity log
- Hourly heatmap

### Costs
- Spending summary (daily/weekly/monthly)
- Trend chart
- Model breakdown (pie chart)
- Budget gauge (if set)

### Kanban
- Drag & drop task board
- Columns: Todo, In Progress, Done
- Assign agents, priority levels, labels
- Data from boulder/KM or standalone

### Services
- PM2 process list (status, uptime, restarts)
- Plugins list (enabled/disabled)
- Skills inventory
- Memory/knowledge status

### Notifications
- Agent completions
- Cron results
- Errors and alerts
- Filterable by type/severity

### Settings
- Edit name/greeting
- Change theme/accent color
- Rearrange widgets
- Toggle pages on/off
- Redo setup wizard
- Export/import config

## Responsive Design

Mobile-first approach. Adapts automatically, no separate "mobile mode."

### Desktop (1024px+)
- Full sidebar (icons + text or icons-only based on preference)
- Widget grid: 2-3 columns
- Command palette via Ctrl+K

### Tablet (768px - 1023px)
- Collapsed sidebar (icons only)
- Widget grid: 2 columns
- Command palette via search icon

### Mobile (<768px)
- Bottom navigation bar (5 main icons)
- Single column, stacked widgets
- Swipe gestures for page navigation
- Pull-to-refresh for data updates
- Quick actions as floating action button (FAB)

## Multi-User Support (Optional)

Enabled during setup wizard. Off by default — most people are solo users.

**When enabled:**
- Config stored as `~/.openclaw/hub-config-{username}.json`
- Profile switcher in sidebar footer
- Each user has own: theme, layout, widgets, notes, greeting
- No auth by default (local trust) — optional PIN/password per profile
- "Add user" in Settings creates a new profile with its own setup wizard

**When disabled:**
- Single `~/.openclaw/hub-config.json`
- No profile switcher, no user management
- Can be enabled later in Settings

## Command Palette (Ctrl+K)
- Search actions
- Quick commands: restart gateway, switch model, clear sessions
- Navigate to any page
- Fuzzy search

## Widget Plugin System

Third-party creators can build custom widgets. Drop a folder, get a widget.

### Plugin Structure
```
~/.openclaw/hub-plugins/
  plugin-name/
    manifest.json    ← metadata, permissions, settings schema
    widget.jsx       ← React component
    settings.jsx     ← optional config UI
    preview.png      ← screenshot for plugin browser
```

### manifest.json
```json
{
  "id": "plugin-name",
  "name": "Display Name",
  "description": "What it does",
  "author": "creator",
  "version": "1.0.0",
  "size": "medium",
  "permissions": [],
  "settings": {}
}
```

### Permissions Model
- Plugins declare required permissions in manifest
- User approves on install/first enable
- Available permissions:
  - `network:<domain>` — make external requests (must specify domain)
  - `filesystem:read` — read local files (scoped)
  - `filesystem:write` — write local files (scoped)
  - `hub:config` — access hub configuration
  - `hub:system` — access system health data
- **No permissions = no network, no filesystem** — safe by default
- Plugins without `network:*` permissions maintain zero-external-calls guarantee

### Plugin API (exposed to widgets)
- `useHubData()` — system info, gateway status, sessions
- `useConfig(pluginId)` — read/write plugin-specific settings
- `useTheme()` — current theme colors for consistent styling
- `registerAction(id, label, handler)` — add to command palette

### Size Presets
- `small` — 1x1 grid cell
- `medium` — 2x1
- `large` — 2x2
- `full` — full width

### Installation
- Manual: drop folder in `~/.openclaw/hub-plugins/`
- ClawHub: `clawhub install plugin-name` (future)
- Hot reload: appears in widget picker without restart

### Plugin Browser (in Settings)
- Browse installed plugins
- Enable/disable per plugin
- View permissions before enabling
- Link to ClawHub for discovering new plugins

## Auto-Discovery Service

```js
detectEnvironment() → {
  pm2: boolean,        // PM2 installed + processes?
  gateway: boolean,    // OpenClaw gateway running?
  sessions: number,    // Session count
  channels: string[],  // Active channels
  model: string,       // Current model
  plugins: string[],   // Installed plugins
  skills: string[],    // Installed skills
  memory: boolean,     // Memory system active?
  boulder: boolean,    // Task queue available?
}
```

Features gracefully degrade based on detection results.

## Config File (`~/.openclaw/hub-config.json`)

```json
{
  "name": "Tiger",
  "theme": "dark",
  "accentColor": "#D4A853",
  "setupComplete": true,
  "enabledPages": ["home", "activity", "services", "kanban"],
  "homeWidgets": ["greeting", "health", "gateway", "notes", "recent"],
  "widgetOrder": ["greeting", "health", "gateway", "notes", "recent"],
  "notes": "Remember to check the logs tomorrow",
  "sidebarStyle": "full",
  "quickActions": ["restart-gateway", "check-logs"],
  "bookmarks": [],
  "createdAt": "2026-03-30T19:33:00Z"
}
```
