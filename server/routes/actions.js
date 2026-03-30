import { Router } from 'express';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const router = Router();
const OC_DIR = join(homedir(), '.openclaw');

// Rate limiting for actions - in-memory cooldown
const actionCooldowns = new Map();
const COOLDOWN_MS = 5000; // 5 second cooldown

// SECURITY: Hardcoded action map - NEVER read commands from config or user input
const ACTIONS = {
  'restart-gateway': {
    id: 'restart-gateway',
    label: 'Restart Gateway',
    description: 'Restart the OpenClaw gateway service',
    icon: '🔄',
    destructive: true,
    command: ['openclaw', 'gateway', 'restart']
  },
  'gateway-status': {
    id: 'gateway-status',
    label: 'Gateway Status',
    description: 'Check OpenClaw gateway service status',
    icon: '📊',
    destructive: false,
    command: ['openclaw', 'gateway', 'status']
  },
  'check-logs': {
    id: 'check-logs',
    label: 'Check Logs',
    description: 'View recent OpenClaw gateway logs',
    icon: '📝',
    destructive: false,
    command: null // Special handling - reads files instead of exec
  }
};

function checkCooldown(actionId) {
  const lastAction = actionCooldowns.get(actionId);
  if (lastAction && Date.now() - lastAction < COOLDOWN_MS) {
    return Math.ceil((COOLDOWN_MS - (Date.now() - lastAction)) / 1000);
  }
  return 0;
}

function setCooldown(actionId) {
  actionCooldowns.set(actionId, Date.now());
}

function findLogFile() {
  const logDir = join(OC_DIR, 'logs');
  if (!existsSync(logDir)) return null;

  try {
    const logFiles = readdirSync(logDir)
      .filter(file => file.includes('gateway') || file.includes('openclaw'))
      .sort((a, b) => {
        // Sort by modification time, newest first
        try {
          const statA = statSync(join(logDir, a));
          const statB = statSync(join(logDir, b));
          return statB.mtime - statA.mtime;
        } catch {
          return 0;
        }
      });

    return logFiles.length > 0 ? join(logDir, logFiles[0]) : null;
  } catch {
    return null;
  }
}

function readLastLines(filePath, lineCount = 50) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const lastLines = lines.slice(-lineCount - 1, -1); // -1 to remove last empty line
    return lastLines.join('\n');
  } catch (error) {
    throw new Error(`Failed to read log file: ${error.message}`);
  }
}

// GET /api/actions - List available actions
router.get('/', (_req, res) => {
  // Return only the action metadata, never the commands
  const actionList = Object.values(ACTIONS).map(action => ({
    id: action.id,
    label: action.label,
    description: action.description,
    icon: action.icon,
    destructive: action.destructive || false
  }));

  res.json(actionList);
});

// POST /api/actions/:id/execute - Execute an action
router.post('/:id/execute', async (req, res) => {
  const { id } = req.params;

  // SECURITY: Validate action ID against hardcoded map
  if (!ACTIONS[id]) {
    return res.status(404).json({
      error: 'Action not found',
      validActions: Object.keys(ACTIONS)
    });
  }

  // Rate limiting check
  const cooldownSeconds = checkCooldown(id);
  if (cooldownSeconds > 0) {
    return res.status(429).json({
      error: 'Rate limited',
      retryAfter: cooldownSeconds
    });
  }

  const action = ACTIONS[id];

  try {
    let result;

    if (id === 'check-logs') {
      // Special handling for log reading - no exec needed
      const logFile = findLogFile();
      if (!logFile) {
        return res.status(404).json({
          error: 'No log files found',
          action: action.label
        });
      }

      const logs = readLastLines(logFile, 50);
      result = {
        success: true,
        action: action.label,
        output: logs,
        logFile: logFile.split('/').pop() // Just the filename for security
      };
    } else {
      // Execute command using execFile with array args (no shell)
      const { stdout, stderr } = await execFileAsync(
        action.command[0], 
        action.command.slice(1),
        { timeout: 15000 }
      );

      result = {
        success: true,
        action: action.label,
        output: stdout || stderr || 'Command completed successfully'
      };
    }

    // Set cooldown after successful execution
    setCooldown(id);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: `Failed to execute ${action.label}`,
      details: error.message,
      action: action.label
    });
  }
});

export default router;