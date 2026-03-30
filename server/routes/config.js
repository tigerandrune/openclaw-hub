import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const router = Router();
const CONFIG_DIR = join(homedir(), '.openclaw');

function configPath(profileId) {
  if (!profileId || profileId === 'default') return join(CONFIG_DIR, 'hub-config.json');
  // Sanitize — only allow alphanumeric + hyphens
  const safe = profileId.replace(/[^a-z0-9-]/g, '');
  if (!safe) return join(CONFIG_DIR, 'hub-config.json');
  return join(CONFIG_DIR, `hub-config-${safe}.json`);
}

function readConfig(profileId) {
  const path = configPath(profileId);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

router.get('/', (req, res) => {
  const profile = req.query.profile;
  const config = readConfig(profile);
  res.json(config ?? { setupComplete: false });
});

router.post('/', (req, res) => {
  try {
    const profile = req.query.profile;
    const path = configPath(profile);
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const existing = readConfig(profile) ?? {};
    const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
    if (!updated.createdAt) {
      updated.createdAt = new Date().toISOString();
    }
    writeFileSync(path, JSON.stringify(updated, null, 2));
    res.json({ ok: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
