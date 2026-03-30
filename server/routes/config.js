import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const router = Router();
const CONFIG_DIR = join(homedir(), '.openclaw');
const CONFIG_PATH = join(CONFIG_DIR, 'hub-config.json');

function readConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return null;
  }
}

router.get('/', (_req, res) => {
  const config = readConfig();
  res.json(config ?? { setupComplete: false });
});

router.post('/', (req, res) => {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const existing = readConfig() ?? {};
    const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
    if (!updated.createdAt) {
      updated.createdAt = new Date().toISOString();
    }
    writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));
    res.json({ ok: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
