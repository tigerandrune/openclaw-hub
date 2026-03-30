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
  const memBackend = ocConfig?.memory?.backend ?? null;
  const memPlugin = ocConfig?.plugins?.slots?.memory ?? null;
  const lancedbPath = join(OC_DIR, 'memory', 'lancedb');
  const hasLancedb = existsSync(lancedbPath);
  const kmPath = join(homedir(), '.km');
  const hasKm = existsSync(kmPath);

  // Build status — only include what's actually configured/found
  const status = { active: false, services: [] };

  if (memBackend) {
    status.active = true;
    status.services.push({ name: memBackend, type: 'backend', status: 'active' });
  }
  if (memPlugin) {
    // Only show plugin if the underlying service exists
    if (memPlugin.includes('lancedb') && !hasLancedb) {
      // Configured but not installed — skip silently for fresh users
    } else {
      status.active = true;
      status.services.push({ name: memPlugin, type: 'plugin', status: 'active' });
    }
  }
  if (hasKm) {
    status.active = true;
    status.services.push({ name: 'km', type: 'knowledge', status: 'active' });
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
