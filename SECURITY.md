# Security Guide

OpenClaw Hub is designed to run locally. It has **no built-in authentication** because on your own machine, you *are* the auth.

But if you want to access it remotely — or you're deploying it for others — read this first.

## Threat Model

Hub displays sensitive system information:

| Data | Risk |
|------|------|
| CPU, memory, disk usage | System profiling |
| Running processes (PM2) | Service enumeration |
| Gateway config & status | Infrastructure mapping |
| Session history & costs | Usage patterns, spending |
| Installed plugins & skills | Attack surface discovery |

**Treat Hub access like SSH access.** Only people you trust should see it.

## Built-In Protections

These ship by default — you don't need to configure them.

### Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'` | Blocks XSS, injection, framing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `no-referrer` | No URL leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Blocks sensor access |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |

Server version (`X-Powered-By`) is suppressed.

### Zero External Requests

- No CDN, no analytics, no telemetry, no external fonts
- All assets bundled and served locally
- No outbound network calls from the frontend
- CSP enforces this at the browser level

### Plugin Sandboxing

- Plugin IDs validated (alphanumeric + hyphens only)
- Path traversal protection on all plugin routes
- Plugins declare permissions in `manifest.json`
- Import rewriting prevents arbitrary module loading
- No filesystem or network access by default

### Verify It Yourself

```bash
# Run the security tests
npm test

# Or the full diagnostic suite
npm run test:diagnose

# Check headers manually
curl -sI http://localhost:3100/ | grep -iE "x-frame|csp|x-content|referrer"
```

## Local Access (Default)

Hub listens on `localhost:3100`. Only your machine can reach it. This is safe. You don't need to do anything extra.

## Remote Access

If you want to access Hub from your phone, another device, or outside your network:

### ✅ Recommended: Cloudflare Tunnel (Free)

Zero ports exposed, encrypted, access control included.

```bash
# Install
sudo apt install cloudflared
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create hub
cloudflared tunnel route dns hub hub.yourdomain.com
```

`/etc/cloudflared/config.yml`:
```yaml
ingress:
  - hostname: hub.yourdomain.com
    service: http://localhost:3100
  - service: http_status:404
```

```bash
cloudflared tunnel run hub
```

**Add Cloudflare Access (free for ≤50 users):**
1. Zero Trust dashboard → Access → Applications
2. Add your hub URL
3. Set policy: allow your email only
4. Login gate before anyone sees your dashboard

**Cost: $0.** Domain is the only expense.

### ✅ Also Good: Tailscale (Free)

Mesh VPN — your devices only, no public exposure.

1. Install Tailscale on server + devices
2. Access Hub at `http://your-server:3100`
3. No config changes, no domain needed
4. Only your devices can reach it

**Cost: $0** for personal use (up to 100 devices).

### ⚠️ Reverse Proxy (Nginx/Caddy)

If you already run a reverse proxy:

- **Always use HTTPS** — cert via Let's Encrypt
- **Add auth** — basic auth, OAuth, or mTLS. Never expose unauthenticated.
- **Rate limit** — prevent brute force on any future auth
- **Fail2ban** — block repeated failed access

Example Nginx config:

```nginx
server {
    listen 443 ssl;
    server_name hub.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/hub.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hub.yourdomain.com/privkey.pem;

    # Basic auth
    auth_basic "OpenClaw Hub";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 🚫 Never Do This

- **Don't port-forward 3100 to the internet** — no auth means anyone can read your system info
- **Don't use HTTP over public networks** — your data is plaintext
- **Don't share your tunnel URL publicly** — minimize exposure even with access control
- **Don't run as root** — Hub doesn't need elevated permissions

## Plugin Security

### Permission Model

Plugins declare required permissions in `manifest.json`:

```json
{
  "permissions": []
}
```

| Permission | Access | Risk |
|-----------|--------|------|
| *(none)* | Theme, config, localStorage only | Low |
| `network:<domain>` | HTTP requests to specific domain | Medium |

### Before Installing a Plugin

1. **Read the source** — it's just a `.jsx` file, usually under 300 lines
2. **Check permissions** — anything requesting `network:` should have a reason
3. **Check the author** — known community member?
4. **Test first** — install, check the Settings → Plugins warning banner

### Plugin Isolation

- Plugins run in the browser (same-origin, no server-side execution)
- CSP blocks inline scripts and external resource loading
- Plugins cannot access other plugins' data (separate config namespaces)
- No filesystem access — plugins use `localStorage` or the config API

### Known Limitations

- Plugins share the same JavaScript context (no iframe isolation yet)
- A malicious plugin could theoretically read other plugins' localStorage
- CSP `style-src 'unsafe-inline'` is required for theme integration — this weakens CSS injection protection
- **Future:** iframe sandboxing for untrusted plugins (tracked as enhancement)

## Multi-User Security

The multi-user profile system is for **convenience, not security**:

- Profiles switch config files (`hub-config-{name}.json`)
- No authentication — anyone with access can switch profiles
- No data isolation — all profiles share the same system view
- Optional PIN support is planned but not yet implemented

**If you need real user isolation**, use separate OS accounts or containerized instances.

## Data Storage

| Data | Location | Encryption |
|------|----------|------------|
| Config | `~/.openclaw/hub-config.json` | None (plaintext JSON) |
| Profiles | `~/.openclaw/hub-config-{name}.json` | None |
| Plugin data | Browser localStorage | None |
| Kanban tasks | Browser localStorage | None |

No secrets are stored by Hub itself. Gateway credentials, API keys, and tokens are managed by OpenClaw core, not Hub.

## Reporting Vulnerabilities

Found a security issue? **Do not open a public issue.**

- GitHub Security Advisory: [Report on GitHub](https://github.com/tigerandrune/openclaw-hub/security/advisories/new)
- Or contact the maintainers directly through the [OpenClaw Discord](https://discord.com/invite/clawd)

We take security reports seriously and will respond within 48 hours.
