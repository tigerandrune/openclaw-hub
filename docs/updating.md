# Updating OpenClaw Hub

## Quick Update

```bash
cd openclaw-hub
npm run update
```

This runs `scripts/update.sh` which:
1. Pulls the latest changes (`git pull --ff-only`)
2. Installs any new dependencies (`npm install`)
3. Rebuilds the frontend (`npm run build`)
4. Restarts PM2 if you're running it via `pm2`

## What Doesn't Get Touched

Your config lives at `~/.openclaw/hub-config.json` — completely outside the repo. Updates never overwrite your settings, themes, widget layout, or profile data.

Plugin data and bookmarks stored in `localStorage` are also unaffected.

## Manual Update

If you prefer doing it step by step:

```bash
cd openclaw-hub
git pull
npm install
npm run build
# Then restart however you run it:
pm2 restart openclaw-hub   # if using PM2
# or just:
npm start
```

## Checking Your Version

```bash
node -e "console.log(require('./package.json').version)"
```

Or check the Settings page in the dashboard — the version is shown at the bottom.

## Troubleshooting

**`git pull` fails with merge conflicts:**
You've modified source files. Either stash your changes (`git stash && git pull && git stash pop`) or reset (`git checkout . && git pull`).

**Build fails after update:**
Try a clean install:
```bash
rm -rf node_modules
npm install
npm run build
```

**PM2 doesn't restart:**
Make sure the PM2 process is named `openclaw-hub`:
```bash
pm2 list
pm2 restart openclaw-hub
```
