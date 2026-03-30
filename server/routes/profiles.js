import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const router = Router();
const CONFIG_DIR = join(homedir(), '.openclaw');
const PROFILES_PATH = join(CONFIG_DIR, 'hub-profiles.json');

const ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;

function readProfiles() {
  if (!existsSync(PROFILES_PATH)) {
    // Auto-create from existing config (backwards compat)
    const defaultConfig = configPath('default');
    const name = existsSync(defaultConfig)
      ? (JSON.parse(readFileSync(defaultConfig, 'utf8')).name || 'Default')
      : 'Default';
    const profiles = {
      profiles: [{ id: 'default', name, avatar: name[0].toUpperCase(), createdAt: new Date().toISOString() }],
      defaultProfile: 'default',
    };
    writeProfiles(profiles);
    return profiles;
  }
  try {
    return JSON.parse(readFileSync(PROFILES_PATH, 'utf8'));
  } catch {
    return { profiles: [], defaultProfile: 'default' };
  }
}

function writeProfiles(data) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(PROFILES_PATH, JSON.stringify(data, null, 2));
}

function configPath(profileId) {
  if (profileId === 'default') return join(CONFIG_DIR, 'hub-config.json');
  return join(CONFIG_DIR, `hub-config-${profileId}.json`);
}

// GET /api/profiles
router.get('/', (_req, res) => {
  res.json(readProfiles());
});

// POST /api/profiles — create a new profile
router.post('/', (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name are required' });
  if (!ID_RE.test(id)) return res.status(400).json({ error: 'id must be lowercase alphanumeric + hyphens, 1-32 chars' });

  const data = readProfiles();
  if (data.profiles.some(p => p.id === id)) {
    return res.status(409).json({ error: 'Profile already exists' });
  }

  const profile = {
    id,
    name,
    avatar: name[0].toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  data.profiles.push(profile);
  writeProfiles(data);

  // Create empty config for this profile
  const cfgPath = configPath(id);
  if (!existsSync(cfgPath)) {
    writeFileSync(cfgPath, JSON.stringify({
      name,
      setupComplete: false,
      wizardComplete: false,
      createdAt: new Date().toISOString(),
    }, null, 2));
  }

  res.json({ ok: true, profile });
});

// DELETE /api/profiles/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'default') return res.status(400).json({ error: 'Cannot delete the default profile' });

  const data = readProfiles();
  const idx = data.profiles.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Profile not found' });

  data.profiles.splice(idx, 1);
  if (data.defaultProfile === id) data.defaultProfile = 'default';
  writeProfiles(data);

  // Delete config file
  const cfgPath = configPath(id);
  if (existsSync(cfgPath)) {
    try { unlinkSync(cfgPath); } catch { /* ignore */ }
  }

  res.json({ ok: true });
});

export default router;
export { configPath, readProfiles };
