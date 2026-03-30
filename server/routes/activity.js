import { Router } from 'express';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const router = Router();
const OC_DIR = join(homedir(), '.openclaw');
const AGENTS_DIR = join(OC_DIR, 'agents');

function parseSessionFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const firstLine = content.split('\n')[0];
    if (!firstLine.trim()) return null;
    
    const sessionMeta = JSON.parse(firstLine);
    if (sessionMeta.type !== 'session') return null;
    
    const stat = statSync(filePath);
    
    return {
      id: sessionMeta.id,
      timestamp: sessionMeta.timestamp,
      size: stat.size,
      modified: stat.mtime.toISOString(),
      agent: filePath.includes('/agents/') ? filePath.split('/agents/')[1].split('/')[0] : 'unknown'
    };
  } catch (error) {
    return null;
  }
}

// GET /api/activity/sessions - List session files from all agents
router.get('/sessions', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const sessions = [];

  if (!existsSync(AGENTS_DIR)) {
    return res.json({ sessions: [], source: null });
  }

  try {
    // Scan all agent directories
    const agentDirs = readdirSync(AGENTS_DIR);
    
    for (const agentName of agentDirs) {
      const agentPath = join(AGENTS_DIR, agentName);
      const sessionsPath = join(agentPath, 'sessions');
      
      if (!existsSync(sessionsPath)) continue;
      
      try {
        const sessionFiles = readdirSync(sessionsPath)
          .filter(file => file.endsWith('.jsonl'))
          .map(file => join(sessionsPath, file));
        
        for (const sessionFile of sessionFiles) {
          const sessionData = parseSessionFile(sessionFile);
          if (sessionData) {
            sessions.push(sessionData);
          }
        }
      } catch (error) {
        console.warn(`Failed to read sessions for agent: ${agentName}`, error.message);
      }
    }

    // Sort by timestamp descending (most recent first)
    sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    const limitedSessions = sessions.slice(0, limit);

    res.json({
      sessions: limitedSessions,
      total: sessions.length,
      source: AGENTS_DIR
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to scan session directories',
      details: error.message,
      sessions: [],
      source: null
    });
  }
});

// GET /api/activity/summary - Aggregate activity statistics
router.get('/summary', (req, res) => {
  const sessions = [];
  const agentStats = {};
  
  if (!existsSync(AGENTS_DIR)) {
    return res.json({
      totalSessions: 0,
      agents: [],
      recentActivity: 0
    });
  }

  try {
    const agentDirs = readdirSync(AGENTS_DIR);
    
    for (const agentName of agentDirs) {
      const sessionsPath = join(AGENTS_DIR, agentName, 'sessions');
      
      if (!existsSync(sessionsPath)) continue;
      
      try {
        const sessionFiles = readdirSync(sessionsPath)
          .filter(file => file.endsWith('.jsonl'));
        
        agentStats[agentName] = {
          name: agentName,
          sessions: sessionFiles.length,
          lastActivity: null
        };
        
        for (const file of sessionFiles) {
          const sessionData = parseSessionFile(join(sessionsPath, file));
          if (sessionData) {
            sessions.push(sessionData);
            
            // Track latest activity per agent
            const sessionDate = new Date(sessionData.timestamp);
            if (!agentStats[agentName].lastActivity || 
                sessionDate > new Date(agentStats[agentName].lastActivity)) {
              agentStats[agentName].lastActivity = sessionData.timestamp;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to process agent sessions: ${agentName}`, error.message);
      }
    }

    // Calculate recent activity (last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentSessions = sessions.filter(session => 
      new Date(session.timestamp) > yesterday
    );

    res.json({
      totalSessions: sessions.length,
      agents: Object.values(agentStats),
      recentActivity: recentSessions.length,
      lastUpdated: now.toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate activity summary',
      details: error.message,
      totalSessions: 0,
      agents: [],
      recentActivity: 0
    });
  }
});

// GET /api/activity/heatmap - Hourly activity heatmap (last 4 weeks)
router.get('/heatmap', (req, res) => {
  const weeks = parseInt(req.query.weeks) || 4;
  const now = new Date();
  const cutoff = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

  // grid[dayOfWeek][hour] = count
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  let total = 0;

  if (!existsSync(AGENTS_DIR)) {
    return res.json({ grid, total: 0, weeks });
  }

  try {
    const agentDirs = readdirSync(AGENTS_DIR);

    for (const agentName of agentDirs) {
      const sessionsPath = join(AGENTS_DIR, agentName, 'sessions');
      if (!existsSync(sessionsPath)) continue;

      const files = readdirSync(sessionsPath).filter(f => f.endsWith('.jsonl'));

      for (const file of files) {
        try {
          const firstLine = readFileSync(join(sessionsPath, file), 'utf8').split('\n')[0];
          if (!firstLine.trim()) continue;
          const meta = JSON.parse(firstLine);
          if (meta.type !== 'session' || !meta.timestamp) continue;

          const d = new Date(meta.timestamp);
          if (d < cutoff) continue;

          const day = d.getDay(); // 0=Sun
          const hour = d.getHours();
          grid[day][hour]++;
          total++;
        } catch { /* skip bad files */ }
      }
    }

    res.json({ grid, total, weeks });
  } catch (error) {
    res.status(500).json({ error: error.message, grid, total: 0, weeks });
  }
});

export default router;