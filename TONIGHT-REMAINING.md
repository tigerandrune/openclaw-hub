# Tonight's Remaining Work — OpenClaw Hub

**Date:** 2026-03-30, starting ~22:15  
**Goal:** Complete all spec features. All-nighter.

---

## Design Principle
**Nothing should be there unless you chose it.** Every feature is opt-in via wizard or settings. Empty/unconfigured widgets don't render. This is what makes it personal.

---

## Round 1 — Quick Personalization (~30 min)

### 1. Custom Dashboard Title
- Add `dashboardTitle` to config
- Wizard step or Settings field
- Home page shows it (e.g. "Tiger's Command Center") instead of generic "OpenClaw Hub"
- If empty/unset, falls back to "OpenClaw Hub"

### 2. Action Bookmarks (upgrade existing)
- Current bookmarks widget only supports external URLs
- Spec says: "pin your most-used actions (restart gateway, check logs, etc.)"
- Upgrade to support BOTH:
  - **URL bookmarks** — external links with favicon (existing)
  - **Action bookmarks** — dashboard actions (restart gateway, check logs, clear sessions, switch model)
- Action bookmarks execute in-app, URL bookmarks open new tab
- Visual distinction between the two types

### 3. Sidebar Style Toggle
- Two modes: "icons + text" (full) vs "icons only" (compact)
- Saved in config as `sidebarStyle: "full" | "compact"`
- Toggle in Settings under Appearance
- Add to wizard Step 3b per spec
- Live preview in both wizard and settings

---

## Round 2 — Layout Control (~1 hr)

### 4. Pinned Pages (Show/Hide Nav Items)
- In Settings, toggle which pages appear in sidebar/bottom nav
- Config: `enabledPages: ["home", "activity", "costs", "services", "alerts", "settings"]`
- Home and Settings always visible (can't disable)
- Disabled pages still accessible via URL, just hidden from nav
- Persist in config

### 5. Drag-to-Reorder Widgets ⭐ THE BIG ONE
- Install `@dnd-kit/core` + `@dnd-kit/sortable`
- Home page widgets become draggable
- New order saved to `config.widgetOrder`
- Visual feedback: grab handle, drop shadow, insertion indicator
- Mobile: long-press to drag
- This is the core differentiator from generic admin panels

---

## Round 3 — Data Polish (~1 hr)

### 6. Hourly Activity Heatmap
- GitHub contribution graph style
- Shows session activity by hour × day
- Data from session JSONL files (same source as Activity page)
- CSS-only (no chart library needed)
- Add as opt-in widget for Home page

### 7. Budget Gauge (Costs page)
- **Opt-in only** — not shown unless user sets a budget
- Wizard Step 3: "Budget tracking" toggle card → if enabled, "Set monthly budget" input
- Settings: enable/disable, set/change amount
- Home widget: circular gauge showing spend vs budget
- Costs page: gauge at top of summary
- Config: `budget: { enabled: true, monthly: 50 }` (or absent = disabled)
- Empty/zero budget = widget doesn't render

---

## Round 4 — Mobile Polish (~30 min)

### 8. Pull-to-Refresh
- Touch gesture on mobile to refresh data
- Visual indicator (spinner at top)
- Triggers re-fetch on all visible widgets

### 9. Swipe Between Pages
- Left/right swipe navigates between adjacent pages
- Follow nav order
- Subtle transition animation

---

## Round 5 — If We're Still Standing

### 10. Multi-User Profiles (Wizard Step 6)
- Optional toggle: "Just me" / "Multiple people"
- If multi: config becomes `hub-config-{username}.json`
- Profile switcher in sidebar footer
- Each user gets own: theme, layout, widgets, notes, greeting
- No auth by default (local trust)
- Can be enabled later in Settings

---

## Already Complete ✅

| Feature | Status |
|---------|--------|
| Greeting with name | ✅ |
| Theme picker (dark/light/norse) | ✅ |
| Custom accent color | ✅ |
| Widget toggle (choose which show) | ✅ |
| Quick notes widget | ✅ |
| URL bookmarks widget | ✅ |
| Setup wizard (6 steps) | ✅ |
| i18n (8 languages, 175 keys) | ✅ |
| Home page with widgets | ✅ |
| Activity page (timeline, agents) | ✅ |
| Costs page (summary, daily, agents, models) | ✅ |
| Services page (PM2, plugins, skills) | ✅ |
| Alerts page (health checks) | ✅ |
| Settings page (full config) | ✅ |
| Command palette (Ctrl+K) | ✅ |
| Responsive (desktop/tablet/mobile) | ✅ |
| Bottom nav (mobile) | ✅ |

---

## Skipping Tonight
- **Widget Plugin System** — architecture project, not a feature sprint
- Needs: plugin API, manifest spec, permissions model, hot reload, plugin browser
- Better as a separate focused project

---

## Build Rules
- All UI strings through `t()` / i18n
- All 8 language files must maintain key parity
- `npm run build` before deploy
- `pm2 restart openclaw-hub` after deploy
- Test on both desktop and mobile breakpoints
