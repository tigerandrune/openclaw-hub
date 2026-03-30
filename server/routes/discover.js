import { Router } from 'express';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

const router = Router();
const OC_DIR = join(homedir(), '.openclaw');

function safeRead(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function checkPm2() {
  try {
    execSync('which pm2', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

function countSessions() {
  const sessionDirs = [
    join(OC_DIR, 'sessions'),
    join(OC_DIR, 'completions'),
  ];
  let count = 0;
  for (const dir of sessionDirs) {
    if (existsSync(dir)) {
      try {
        count += readdirSync(dir).filter(f => f.endsWith('.json')).length;
      } catch {}
    }
  }
  return count;
}

function listPlugins() {
  const pluginsDir = join(OC_DIR, 'hub-plugins');
  if (!existsSync(pluginsDir)) return [];
  try {
    return readdirSync(pluginsDir).filter(f => {
      const stat = statSync(join(pluginsDir, f));
      return stat.isDirectory();
    });
  } catch {
    return [];
  }
}

function getChannels() {
  const ocConfig = safeRead(join(OC_DIR, 'openclaw.json'));
  if (!ocConfig?.channels) return [];
  const channels = [];
  for (const [name, cfg] of Object.entries(ocConfig.channels)) {
    if (cfg && typeof cfg === 'object') {
      channels.push({
        id: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        enabled: cfg.enabled !== false,
      });
    }
  }
  return channels;
}

function getModelInfo() {
  const ocConfig = safeRead(join(OC_DIR, 'openclaw.json'));
  const primary = ocConfig?.agents?.defaults?.model?.primary ?? null;
  const fallbacks = ocConfig?.agents?.defaults?.model?.fallbacks ?? [];
  return { primary, fallbacks };
}

function getMemoryStatus() {
  const ocConfig = safeRead(join(OC_DIR, 'openclaw.json'));
  const status = { active: false, services: [] };

  // 1. Memory backend from config (qmd, sqlite, etc.)
  const memBackend = ocConfig?.memory?.backend ?? null;
  if (memBackend) {
    status.active = true;
    status.services.push({ name: memBackend, type: 'backend', status: 'active' });
  }

  // 2. Memory plugin slot — show whatever is configured, verify it exists
  const memPlugin = ocConfig?.plugins?.slots?.memory ?? null;
  if (memPlugin) {
    // Try to verify the plugin's backing store exists
    const knownChecks = {
      'memory-lancedb': join(OC_DIR, 'memory', 'lancedb'),
      'memory-sqlite': join(OC_DIR, 'memory', 'memory.db'),
    };
    const checkPath = knownChecks[memPlugin];
    if (!checkPath || existsSync(checkPath)) {
      // Unknown plugin = assume it works; known plugin = verify path exists
      status.active = true;
      status.services.push({ name: memPlugin, type: 'plugin', status: 'active' });
    }
  }

  // 3. Any other memory-related plugins from plugins.entries
  const entries = ocConfig?.plugins?.entries ?? {};
  for (const [name, cfg] of Object.entries(entries)) {
    if (name.startsWith('memory-') && name !== memPlugin && cfg?.enabled !== false) {
      status.active = true;
      status.services.push({ name, type: 'plugin', status: 'active' });
    }
  }

  // 4. Local knowledge tools (auto-detect by directory presence)
  const knowledgeTools = [
    { name: 'km', label: 'KM (Knowledge Manager)', path: join(homedir(), '.km') },
    { name: 'brv', label: 'ByteRover', path: join(homedir(), '.brv') },
  ];
  for (const tool of knowledgeTools) {
    if (existsSync(tool.path)) {
      status.active = true;
      status.services.push({ name: tool.label, type: 'knowledge', status: 'active' });
    }
  }

  return status;
}

function listSkills() {
  const skillsDir = join(OC_DIR, 'skills');
  if (!existsSync(skillsDir)) return [];
  try {
    return readdirSync(skillsDir)
      .filter(f => f.endsWith('.js') || f.endsWith('.md'))
      .map(f => f.replace(/\.(js|md)$/, ''));
  } catch {
    return [];
  }
}

router.get('/', (_req, res) => {
  const ocConfig = safeRead(join(OC_DIR, 'openclaw.json'));
  const gatewayOnline = existsSync(join(OC_DIR, 'openclaw.json'));
  const primaryModel = ocConfig?.agents?.defaults?.model?.primary ?? null;

  res.json({
    pm2: checkPm2(),
    gateway: gatewayOnline,
    sessions: countSessions(),
    channels: getChannels(),
    model: primaryModel,
    modelInfo: getModelInfo(),
    memoryStatus: getMemoryStatus(),
    plugins: listPlugins(),
    skills: listSkills(),
    memory: existsSync(join(OC_DIR, 'memory')),
    boulder: existsSync(join(OC_DIR, 'boulder')),
  });
});

export default router;
