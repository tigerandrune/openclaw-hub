import { Router } from 'express';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const router = Router();
const OC_DIR = join(homedir(), '.openclaw');
const OPENCLAW_CONFIG = join(OC_DIR, 'openclaw.json');

// Rate limiting for PM2 actions - in-memory cooldown
const actionCooldowns = new Map();
const COOLDOWN_MS = 5000; // 5 second cooldown

function checkCooldown(processName) {
  const key = `pm2:${processName}`;
  const lastAction = actionCooldowns.get(key);
  if (lastAction && Date.now() - lastAction < COOLDOWN_MS) {
    return Math.ceil((COOLDOWN_MS - (Date.now() - lastAction)) / 1000);
  }
  return 0;
}

function setCooldown(processName) {
  const key = `pm2:${processName}`;
  actionCooldowns.set(key, Date.now());
}

function safeReadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

// GET /api/services/pm2 - List PM2 processes
router.get('/pm2', async (_req, res) => {
  try {
    // Check if PM2 is available by trying to get the version
    await execFileAsync('pm2', ['--version'], { timeout: 3000 });
  } catch (error) {
    // PM2 not installed or not in PATH
    return res.json({ available: false, processes: [] });
  }

  try {
    const { stdout } = await execFileAsync('pm2', ['jlist'], { timeout: 5000 });
    const processes = JSON.parse(stdout);
    
    const formatted = processes.map(proc => ({
      name: proc.name,
      status: proc.pm2_env?.status || 'unknown',
      cpu: proc.monit?.cpu || 0,
      memory: proc.monit?.memory || 0,
      pid: proc.pid || null,
      uptime: proc.pm2_env?.pm_uptime || null,
      restarts: proc.pm2_env?.restart_time || 0,
    }));

    res.json({ available: true, processes: formatted });
  } catch (error) {
    res.status(500).json({ 
      available: true, 
      processes: [], 
      error: 'Failed to fetch PM2 processes' 
    });
  }
});

// POST /api/services/pm2/:name/:action - Execute PM2 action
router.post('/pm2/:name/:action', async (req, res) => {
  const { name, action } = req.params;

  // SECURITY: Whitelist actions
  const ALLOWED_ACTIONS = ['start', 'stop', 'restart'];
  if (!ALLOWED_ACTIONS.includes(action)) {
    return res.status(400).json({ 
      error: 'Invalid action', 
      allowed: ALLOWED_ACTIONS 
    });
  }

  // Rate limiting check
  const cooldownSeconds = checkCooldown(name);
  if (cooldownSeconds > 0) {
    return res.status(429).json({
      error: 'Rate limited',
      retryAfter: cooldownSeconds
    });
  }

  try {
    // First, get current process list to validate the name exists
    const { stdout } = await execFileAsync('pm2', ['jlist'], { timeout: 5000 });
    const processes = JSON.parse(stdout);
    
    const processExists = processes.some(proc => proc.name === name);
    if (!processExists) {
      return res.status(404).json({ 
        error: 'Process not found', 
        name 
      });
    }

    // Execute the action using execFile with array args (no shell)
    await execFileAsync('pm2', [action, name], { timeout: 10000 });
    
    // Set cooldown after successful action
    setCooldown(name);

    res.json({ 
      success: true, 
      action, 
      name,
      message: `Successfully ${action}ed ${name}` 
    });
  } catch (error) {
    res.status(500).json({ 
      error: `Failed to ${action} ${name}`, 
      details: error.message 
    });
  }
});

// GET /api/services/plugins - List OpenClaw plugins
router.get('/plugins', (_req, res) => {
  if (!existsSync(OPENCLAW_CONFIG)) {
    return res.json([]);
  }

  const config = safeReadJson(OPENCLAW_CONFIG);
  if (!config || !config.plugins) {
    return res.json([]);
  }

  // Return plugins from config, mapping to expected format
  const plugins = Object.entries(config.plugins).map(([name, pluginConfig]) => ({
    id: name,
    name: name,
    enabled: pluginConfig?.enabled !== false, // default to true
    config: pluginConfig
  }));

  res.json(plugins);
});

// GET /api/services/skills - List available skills
router.get('/skills', (_req, res) => {
  const skills = [];
  const skillDirs = [
    join(OC_DIR, 'skills'),
    join(OC_DIR, 'workspace', 'skills')
  ];

  for (const skillDir of skillDirs) {
    if (!existsSync(skillDir)) continue;

    try {
      const entries = readdirSync(skillDir);
      for (const entry of entries) {
        const entryPath = join(skillDir, entry);
        const stat = statSync(entryPath);
        
        if (!stat.isDirectory()) continue;

        const skillMdPath = join(entryPath, 'SKILL.md');
        if (!existsSync(skillMdPath)) continue;

        try {
          // Read first 1KB to get name and description
          const buffer = readFileSync(skillMdPath);
          const content = buffer.subarray(0, 1024).toString('utf8');
          const lines = content.split('\n');
          
          let name = entry; // default to directory name
          let description = '';

          // Look for first heading
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('# ')) {
              name = line.substring(2).trim();
              // Look for first non-empty paragraph after heading
              for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('---')) {
                  description = nextLine;
                  break;
                }
              }
              break;
            }
          }

          skills.push({
            id: entry,
            name,
            description,
            path: entryPath
          });
        } catch (error) {
          // Skip skills that can't be read
          console.warn(`Failed to read skill: ${entry}`, error.message);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan skill directory: ${skillDir}`, error.message);
    }
  }

  res.json(skills);
});

export default router;