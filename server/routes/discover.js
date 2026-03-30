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
    channels: [],
    model: primaryModel,
    plugins: listPlugins(),
    skills: listSkills(),
    memory: existsSync(join(OC_DIR, 'memory')),
    boulder: existsSync(join(OC_DIR, 'boulder')),
  });
});

export default router;
