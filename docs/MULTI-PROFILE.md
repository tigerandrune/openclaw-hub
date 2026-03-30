# Multi-Profile System

## Overview

OpenClaw Hub supports multiple user profiles on a single instance. Each profile gets its own personalized experience — theme, language, widget layout, bookmarks, and budget settings. No authentication is built in; access control is handled externally (Cloudflare Zero Trust, reverse proxy auth, etc).

## Use Cases

- **Family/household**: Partner, kids, or roommates sharing one OpenClaw server
- **Team**: Small dev team with one shared instance, each person wants their own dashboard layout
- **Demos**: Quick profile switching for showing different configurations

## Architecture

### Storage

Each profile is a separate JSON config file:

```
~/.openclaw/hub-config.json          # default profile (backwards compatible)
~/.openclaw/hub-config-tiger.json    # named profile
~/.openclaw/hub-config-tuva.json     # named profile
```

A profile index file tracks available profiles:

```
~/.openclaw/hub-profiles.json
```

```json
{
  "profiles": [
    { "id": "default", "name": "Tiger", "avatar": "T", "createdAt": "2026-03-30T20:00:00Z" },
    { "id": "tuva", "name": "Tuva", "avatar": "T", "createdAt": "2026-03-30T22:00:00Z" }
  ],
  "defaultProfile": "default"
}
```

### Profile Config

Each profile config contains the same structure as the current `hub-config.json`:

```json
{
  "name": "Tiger",
  "dashboardTitle": "Tiger's Command Center",
  "theme": "dark",
  "language": "en",
  "sidebarStyle": "full",
  "widgetOrder": ["health", "gateway", "heatmap", "notes"],
  "enabledPages": ["activity", "costs", "services", "notifications"],
  "bookmarks": [],
  "quickActions": [],
  "budget": { "enabled": true, "monthly": 200 },
  "notes": "",
  "wizardComplete": true
}
```

### Profile Selection

Active profile is determined by (in priority order):

1. **URL parameter**: `?profile=tuva` — useful for bookmarks or shared links
2. **localStorage**: `openclaw-hub-profile` — remembers last used profile
3. **Default**: Falls back to `"default"` profile (reads `hub-config.json`)

### File Mapping

| Profile ID | Config File |
|-----------|------------|
| `default` | `hub-config.json` |
| `tiger`   | `hub-config-tiger.json` |
| `tuva`    | `hub-config-tuva.json` |

The `default` profile uses the original filename for backwards compatibility. Existing single-user installs keep working with zero changes.

## API Endpoints

### GET /api/profiles
List all profiles.

**Response:**
```json
{
  "profiles": [
    { "id": "default", "name": "Tiger", "avatar": "T", "createdAt": "..." },
    { "id": "tuva", "name": "Tuva", "avatar": "T", "createdAt": "..." }
  ],
  "defaultProfile": "default"
}
```

### POST /api/profiles
Create a new profile.

**Request:**
```json
{
  "id": "tuva",
  "name": "Tuva"
}
```

**Rules:**
- `id` must be lowercase alphanumeric + hyphens, 1-32 chars
- `id` must be unique
- Creates a new config file with defaults
- New profile has `wizardComplete: false` — triggers wizard on first visit

**Response:**
```json
{ "ok": true, "profile": { "id": "tuva", "name": "Tuva", "avatar": "T", "createdAt": "..." } }
```

### DELETE /api/profiles/:id
Delete a profile and its config file.

**Rules:**
- Cannot delete the `default` profile
- Cannot delete the currently active profile (client-side check)
- Deletes the config file from disk

**Response:**
```json
{ "ok": true }
```

### GET /api/config?profile=tuva
Existing config endpoint, now accepts optional `profile` query param.

### PUT /api/config?profile=tuva
Existing config save endpoint, now accepts optional `profile` query param.

## UI Components

### Profile Switcher (Sidebar)

Located at the bottom of the sidebar, replaces the current user avatar section:

```
┌─────────────────────┐
│ 🔵 Tiger        ▾   │  ← Click to expand
├─────────────────────┤
│   Tiger     ✓       │  ← Current (checkmark)
│   Tuva              │  ← Switch to
│ ─────────────────── │
│   + New Profile     │  ← Create
│   ⚙ Manage          │  ← Goes to Settings
└─────────────────────┘
```

### Profile Management (Settings Page)

New section in Settings: "Profiles"

- List all profiles with name, avatar initial, created date
- Edit profile name
- Delete profile (with confirmation)
- Create new profile
- Set default profile

### New Profile Flow

1. Click "+ New Profile" anywhere (sidebar, settings)
2. Modal/inline form: enter name (ID auto-generated from name)
3. Profile created → auto-switch to it
4. Setup wizard runs (since `wizardComplete: false`)
5. User personalizes their experience

## Frontend Changes

### ConfigContext Updates

The `ConfigContext` needs to be profile-aware:

```jsx
// Current
const configPath = '/api/config';

// New
const activeProfile = getActiveProfile(); // URL param → localStorage → 'default'
const configPath = `/api/config?profile=${activeProfile}`;
```

Functions to add:
- `switchProfile(id)` — updates localStorage, reloads config
- `getActiveProfile()` — reads URL param or localStorage
- `createProfile(name)` — POST to /api/profiles, then switch

### URL Behavior

- Switching profiles updates localStorage but does NOT change the URL by default
- Sharing a profile link: append `?profile=tuva` to any page URL
- The `?profile` param takes precedence over localStorage (allows bookmarking)

## Migration & Backwards Compatibility

### Existing Installs (Zero Changes)

- No `hub-profiles.json` exists → system creates one on first API call with a single `default` profile
- `hub-config.json` continues to work as-is — it's the `default` profile's config
- Single-user installs never see profile UI unless they create a second profile
- **The profile switcher only appears when 2+ profiles exist**

### Data Isolation

Profiles share:
- Session data (activity, costs) — these are system-wide, not per-user
- Services status — same OpenClaw instance
- Alerts — same system

Profiles do NOT share:
- Theme, language, sidebar style
- Widget order and enabled widgets
- Bookmarks and quick actions
- Notes
- Budget settings
- Dashboard title

## Security Considerations

- **No authentication**: Profile switching is cosmetic. Anyone with access can switch to any profile. This is by design — auth is handled at the network layer (Cloudflare, Tailscale, VPN, etc.)
- **No secrets in profiles**: Config files contain UI preferences only. No API keys, passwords, or tokens.
- **File permissions**: Config files inherit the OpenClaw user's filesystem permissions
- **Input validation**: Profile IDs are sanitized (alphanumeric + hyphens only) to prevent path traversal

## i18n Keys

```json
{
  "profiles.title": "Profiles",
  "profiles.switch": "Switch profile",
  "profiles.new": "New Profile",
  "profiles.manage": "Manage profiles",
  "profiles.delete": "Delete profile",
  "profiles.deleteConfirm": "Delete this profile? This cannot be undone.",
  "profiles.default": "Default",
  "profiles.created": "Created",
  "profiles.active": "Active",
  "profiles.name": "Profile name",
  "profiles.namePlaceholder": "Enter a name",
  "profiles.create": "Create",
  "profiles.cancel": "Cancel",
  "profiles.cannotDeleteDefault": "Cannot delete the default profile",
  "profiles.switchTo": "Switch to {name}"
}
```

## Implementation Order

1. **Backend**: Profile index file + API endpoints (GET/POST/DELETE profiles, config?profile= param)
2. **ConfigContext**: Make profile-aware (read active profile, pass to API calls)
3. **Profile Switcher**: Sidebar dropdown (only shows with 2+ profiles)
4. **Settings Section**: Profile management UI
5. **New Profile Flow**: Create + auto-wizard
6. **i18n**: All 8 languages
7. **Testing**: Create/switch/delete profiles, verify config isolation

## Files to Modify

| File | Change |
|------|--------|
| `server/routes/config.js` | Add `?profile` query param support |
| `server/routes/profiles.js` | New — CRUD for profiles |
| `server/index.js` | Register profiles routes |
| `src/context/ConfigContext.jsx` | Profile-aware config loading |
| `src/components/Sidebar.jsx` | Profile switcher dropdown |
| `src/pages/Settings.jsx` | Profile management section |
| `src/pages/SetupWizard.jsx` | No changes needed (already config-driven) |
| `src/i18n/*.json` | Add profile keys (all 8 languages) |
