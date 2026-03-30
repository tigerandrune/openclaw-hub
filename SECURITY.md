# Security Guide

OpenClaw Hub is designed to run locally. It has **no built-in authentication** because on your own machine, you *are* the auth.

But if you want to access it remotely, read this first.

## Local Access (Default)

Out of the box, Hub listens on `localhost:3100`. Only your machine can reach it. This is safe. You don't need to do anything extra.

## Remote Access — Do It Right

If you want to access Hub from your phone, another device, or anywhere outside your home:

### ✅ Recommended: Cloudflare Tunnel (Free)

Zero ports exposed, encrypted, access control included.

1. Install cloudflared: `sudo apt install cloudflared`
2. Authenticate: `cloudflared tunnel login`
3. Create a tunnel: `cloudflared tunnel create hub`
4. Route your domain: `cloudflared tunnel route dns hub hub.yourdomain.com`
5. Configure `/etc/cloudflared/config.yml`:
```yaml
ingress:
  - hostname: hub.yourdomain.com
    service: http://localhost:3100
  - service: http_status:404
```
6. Run it: `cloudflared tunnel run hub`

**Add Cloudflare Access (free for up to 50 users):**
- Go to Zero Trust dashboard → Access → Applications
- Add your hub URL
- Set policy: allow your email only
- Now you get a login gate before anyone sees your dashboard

**Cost: $0.** Domain is the only expense.

### ✅ Also Good: Tailscale (Free)

Mesh VPN — your devices only, no public exposure.

1. Install Tailscale on your server and devices
2. Access Hub at `http://your-server:3100` from any Tailscale-connected device
3. No config changes needed, no domain needed
4. Only your devices can reach it

**Cost: $0** for personal use (up to 100 devices).

### ⚠️ Be Careful: Reverse Proxy (Nginx/Caddy)

If you already run a reverse proxy:

- **Always use HTTPS** — get a cert via Let's Encrypt
- **Add basic auth or OAuth** — never expose Hub unauthenticated
- **Rate limit** — prevent brute force
- **Fail2ban** — block repeated failed access attempts

### 🚫 Never Do This

- **Don't port-forward 3100 to the internet** — no auth means anyone can see your system info
- **Don't use HTTP over public networks** — your data is visible to anyone on the network
- **Don't share your tunnel URL publicly** — even with Cloudflare Access, minimize exposure
- **Don't run as root** — Hub doesn't need elevated permissions

## What's Exposed

Hub shows system information that could help an attacker:

- Running processes and services
- Disk/memory/CPU usage
- Gateway configuration
- Session history
- Installed plugins and skills

**None of this should be public.** Treat Hub access like SSH access — only people you trust.

## Plugin Security

Third-party plugins can request permissions:

- **No permissions = sandboxed** — can't access network or filesystem
- **`network:<domain>`** — can make external requests (you approve the domain)
- **Review before enabling** — check the source code if you're unsure
- **Disable unused plugins** — smaller attack surface

## Reporting Vulnerabilities

Found a security issue? Open a private report at:
https://github.com/tigerandrune/openclaw-hub/security/advisories

Or email: (set up a security contact later)

Don't open a public issue for security vulnerabilities.
