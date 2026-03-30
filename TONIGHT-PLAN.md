# Tonight's Plan — OpenClaw Hub Completion

**Date:** 2026-03-30  
**Goal:** Ship a complete, polished dashboard with zero stubs  
**Final nav:** Home → Activity → Costs → Services → Alerts → Settings

---

## ✅ Already Done (Phase 1 + 2)

| Page | Status | Notes |
|------|--------|-------|
| Home | ✅ | Widgets, quick actions, greeting |
| Activity | ✅ | Session timeline, agent breakdown, date grouping |
| Services | ✅ | PM2 start/stop/restart, plugins, skills |
| Settings | ✅ | Profile, appearance, layout, system, redo wizard |
| Setup Wizard | ✅ | 6-step onboarding, all 8 languages |
| i18n | ✅ | 8 languages, 141 keys each, perfect parity |

---

## Phase 3: Costs Page

**What:** Token usage and cost tracking from real session data.

### Data Source
- Session JSONL files in `~/.openclaw/agents/*/sessions/*.jsonl`
- Each message entry may contain `usage` field with `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`
- Parse last N sessions, aggregate by day/agent/model

### Backend Route: `server/routes/costs.js`
- `GET /api/costs/summary` — total tokens today, this week, this month
- `GET /api/costs/daily?days=30` — daily breakdown array
- `GET /api/costs/by-agent` — tokens per agent
- `GET /api/costs/by-model` — tokens per model

### Frontend: `src/pages/Costs.jsx`
**Layout:**
1. **Summary cards** (top row)
   - Today's tokens (input + output)
   - This week's tokens
   - This month's tokens
   - Most active model

2. **Daily chart** (main area)
   - Simple bar chart (CSS-only, no chart library)
   - Last 14 days, input vs output tokens
   - Hover shows exact numbers

3. **Breakdown tables**
   - By agent: name, total tokens, session count
   - By model: model name, tokens, % of total

### Security
- Read-only file access (no writes)
- Limit parsing to last 100 sessions per agent (prevent slow scans)
- Cache results for 60 seconds

### i18n Keys Needed
```
costs.title, costs.subtitle
costs.today, costs.thisWeek, costs.thisMonth
costs.inputTokens, costs.outputTokens, costs.totalTokens
costs.byAgent, costs.byModel, costs.daily
costs.noData, costs.sessions, costs.mostActive
costs.tokens (unit label)
```

---

## Phase 4: Alerts Page

**What:** System health notifications and warnings from real-time data.

### Data Source
- PM2 process status (already have API)
- System stats (already have API)
- Gateway health (already have API)
- No persistent alert storage — generate alerts on-the-fly from current state

### Backend Route: `server/routes/alerts.js`
- `GET /api/alerts` — current active alerts, generated from system state

### Alert Rules (checked on each request)
| Alert | Condition | Severity |
|-------|-----------|----------|
| PM2 process down | Any process status !== 'online' | critical |
| High CPU | CPU > 90% | warning |
| High memory | Memory > 85% | warning |
| High disk | Disk > 90% | critical |
| Disk warning | Disk > 75% | warning |
| Gateway offline | Gateway health check fails | critical |
| High restarts | PM2 process restarts > 10 | warning |

### Frontend: `src/pages/Alerts.jsx`
**Layout:**
1. **Status banner** (top)
   - Green "All systems healthy" when no alerts
   - Yellow/Red banner when alerts exist
   - Count of active alerts by severity

2. **Alert cards**
   - Icon + severity color (red=critical, yellow=warning, green=ok)
   - Title, description, timestamp
   - Affected component (PM2 process name, disk, gateway, etc.)

3. **System overview**
   - Quick health grid: each monitored thing as a card with green/yellow/red dot
   - Gateway, each PM2 process, CPU, Memory, Disk

### Security
- Read-only (checks existing APIs)
- No alert storage (stateless — regenerated each load)
- Rate limit same as other endpoints

### i18n Keys Needed
```
alerts.title, alerts.subtitle
alerts.allClear, alerts.critical, alerts.warning
alerts.count (X active alerts)
alerts.cpu, alerts.memory, alerts.disk
alerts.gateway, alerts.process, alerts.restarts
alerts.healthy, alerts.degraded, alerts.down
alerts.systemOverview, alerts.noAlerts
```

---

## Phase 5: Cleanup & Polish

### Remove Tasks
- [ ] Remove `nav.tasks` from sidebar navigation
- [ ] Remove `/kanban` route from App.jsx
- [ ] Remove StubPage references if no longer needed
- [ ] Remove `nav.tasks` from all 8 i18n files

### Fix Known Issues
- [ ] Remove `nav.costs` → stub, wire to real Costs page
- [ ] Remove `nav.alerts` → stub, wire to real Alerts page
- [ ] Audit for any remaining hardcoded English strings
- [ ] Check mobile responsiveness on all new pages

### Polish
- [ ] Consistent empty states across all pages
- [ ] Loading skeletons on Costs and Alerts pages
- [ ] Error states with retry buttons
- [ ] Page transitions / animations consistent with Phase 1

### i18n Sync
- [ ] Add all new keys to all 8 language files
- [ ] Verify key count parity after all additions
- [ ] Remove orphaned keys (nav.tasks, etc.)

---

## Phase 6: Git Commit & Deploy

- [ ] `git add -A && git commit` with clear message
- [ ] Final build + PM2 restart
- [ ] Smoke test all 6 pages
- [ ] Clear config for fresh wizard test
- [ ] Screenshot final state

---

## Build Order

```
Phase 3 (Costs)
├── Backend: costs.js route (parse sessions, aggregate)
├── Frontend: Costs.jsx (cards + chart + tables)
├── i18n: Add keys to all 8 languages
├── Wire: Route in App.jsx, nav link
└── Test: Verify real data shows

Phase 4 (Alerts)
├── Backend: alerts.js route (check all systems)
├── Frontend: Alerts.jsx (banner + cards + overview)
├── i18n: Add keys to all 8 languages
├── Wire: Route in App.jsx, nav link
└── Test: Verify alerts trigger on real conditions

Phase 5 (Cleanup)
├── Remove Tasks from nav + routes + i18n
├── Wire Costs + Alerts nav links to real pages
├── Polish pass on all pages
└── Final i18n audit

Phase 6 (Ship)
├── Git commit
├── Build + deploy
└── Full smoke test
```

---

## Constraints
- No external chart libraries (CSS-only charts)
- No persistent storage for alerts (stateless)
- Session parsing capped at 100 per agent (performance)
- All new keys must exist in all 8 languages before build
- Security: read-only, localhost-only, rate-limited
