# Plugin Security

How we keep plugins safe without making them useless.

## The Default: Sandboxed

A plugin with no permissions can:
- ✅ Render UI
- ✅ Use theme colors
- ✅ Save/load its own settings
- ✅ Show notifications
- ✅ Add command palette actions
- ❌ Make network requests
- ❌ Read/write files
- ❌ Access system data (CPU, memory)
- ❌ Access other plugins' data

This means a clock widget, a calculator, a note pad, a pomodoro timer — none of these need any permissions. They just work, safely.

## When Permissions Are Needed

### network:\<domain\>

Your plugin talks to an external service.

```json
{ "permissions": ["network:api.spotify.com", "network:api.openweathermap.org"] }
```

- Each domain must be listed explicitly
- Wildcards are not allowed (`network:*` won't work)
- The user sees exactly which domains before approving
- `pluginFetch()` enforces the allowlist at runtime

**Why this matters:** A malicious plugin can't phone home if it didn't declare the domain. And the user knows exactly where their data goes.

### hub:system

Your plugin shows system stats (CPU, RAM, disk).

```json
{ "permissions": ["hub:system"] }
```

**Why gated:** System info can fingerprint a machine. Most widgets don't need it.

### filesystem:read / filesystem:write

Your plugin reads or writes files.

```json
{ "permissions": ["filesystem:read"] }
```

- Scoped to a plugin-specific directory: `~/.openclaw/hub-plugins/your-plugin/data/`
- Cannot read outside this directory
- Cannot read `~/.openclaw/openclaw.json` or other system configs

**Why scoped:** A plugin should never be able to read your OpenClaw config, API keys, or other plugins' data.

## What Users See

When enabling a plugin with permissions, Hub shows:

```
┌─────────────────────────────────────────┐
│  Enable "Spotify Player"?               │
│                                         │
│  This plugin requests:                  │
│                                         │
│  🌐 Network: api.spotify.com            │
│     Can send/receive data to Spotify    │
│                                         │
│  ℹ️  No filesystem or system access     │
│                                         │
│  [Cancel]              [Enable Plugin]  │
└─────────────────────────────────────────┘
```

No permissions? No prompt. Just enable and go.

## For Plugin Authors

### Do
- Request minimum permissions
- Explain in your README why you need each permission
- Handle permission denial gracefully (show a helpful message)
- Keep API keys in plugin settings, not hardcoded

### Don't
- Request permissions you don't use
- Try to bypass `pluginFetch()` — it won't work
- Store sensitive data in `localStorage` — use `useConfig()` instead
- Assume permissions are granted — always check

## Reviewing Third-Party Plugins

Before enabling a plugin you didn't write:

1. **Check the source** — it's a `.jsx` file, you can read it
2. **Check permissions** — does a clock really need network access?
3. **Check the author** — do they have other plugins? A GitHub profile?
4. **Check the manifest** — does the description match what the code does?

If something looks wrong, don't enable it. Report it on GitHub or ClawHub.

## Vulnerability Reporting

Found a security issue in the plugin system itself?

→ https://github.com/tigerandrune/openclaw-hub/security/advisories

Found a malicious plugin on ClawHub?

→ Report via ClawHub (flagging system TBD) or open an issue.
