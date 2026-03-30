import { Router } from 'express';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const router = Router();

// Cache for 60 seconds
let cache = null;
let cacheTs = 0;
const CACHE_TTL = 60000; // 60 seconds

// Get all session JSONL files modified in the last 30 days
async function getRecentSessionFiles() {
  const agentsPath = join(homedir(), '.openclaw', 'agents');
  const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
  const files = [];

  try {
    const agentDirs = await readdir(agentsPath);
    
    for (const agentDir of agentDirs) {
      const sessionsPath = join(agentsPath, agentDir, 'sessions');
      
      try {
        const sessionFiles = await readdir(sessionsPath);
        
        for (const file of sessionFiles) {
          if (!file.endsWith('.jsonl')) continue;
          
          const filePath = join(sessionsPath, file);
          const stats = await stat(filePath);
          
          if (stats.mtime.getTime() > cutoffTime) {
            files.push({
              path: filePath,
              agent: agentDir,
              mtime: stats.mtime.getTime()
            });
          }
        }
      } catch (err) {
        // Skip if sessions directory doesn't exist
        continue;
      }
    }
  } catch (err) {
    console.error('Error reading agents directory:', err);
  }

  return files;
}

// Parse JSONL file and extract usage data
async function parseSessionFile(filePath) {
  const entries = [];
  
  try {
    const content = await readFile(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        
        // Look for assistant messages with usage data
        if (entry.type === 'message' && 
            entry.message?.role === 'assistant' && 
            entry.message?.usage) {
          
          const usage = entry.message.usage;
          const cost = usage.cost || {};
          
          entries.push({
            timestamp: entry.timestamp || entry.message.timestamp,
            model: entry.message.model,
            provider: entry.message.provider,
            usage: {
              input: usage.input || 0,
              output: usage.output || 0,
              cacheRead: usage.cacheRead || 0,
              cacheWrite: usage.cacheWrite || 0,
              totalTokens: usage.totalTokens || 0,
              cost: cost.total || 0
            }
          });
        }
      } catch (parseErr) {
        // Skip malformed lines
        continue;
      }
    }
  } catch (err) {
    console.error(`Error parsing file ${filePath}:`, err);
  }
  
  return entries;
}

// Get aggregated costs data
async function getCostsData() {
  const now = Date.now();
  if (cache && now - cacheTs < CACHE_TTL) {
    return cache;
  }

  const files = await getRecentSessionFiles();
  const allEntries = [];
  const agentData = {};
  const modelData = {};
  
  // Parse all session files
  for (const file of files) {
    const entries = await parseSessionFile(file.path);
    
    for (const entry of entries) {
      entry.agent = file.agent;
      allEntries.push(entry);
      
      // Aggregate by agent
      if (!agentData[file.agent]) {
        agentData[file.agent] = { tokens: 0, cost: 0, sessions: new Set() };
      }
      agentData[file.agent].tokens += entry.usage.totalTokens;
      agentData[file.agent].cost += entry.usage.cost;
      agentData[file.agent].sessions.add(file.path);
      
      // Aggregate by model
      const model = entry.model || 'unknown';
      if (!modelData[model]) {
        modelData[model] = { tokens: 0, cost: 0 };
      }
      modelData[model].tokens += entry.usage.totalTokens;
      modelData[model].cost += entry.usage.cost;
    }
  }

  // Convert agent sessions sets to counts
  for (const agent in agentData) {
    agentData[agent].sessions = agentData[agent].sessions.size;
  }

  cache = {
    entries: allEntries,
    agentData,
    modelData,
    totalTokens: allEntries.reduce((sum, e) => sum + e.usage.totalTokens, 0),
    totalCost: allEntries.reduce((sum, e) => sum + e.usage.cost, 0)
  };
  cacheTs = now;

  return cache;
}

// Helper to get date boundaries
function getDateBoundaries() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return { today, weekAgo, monthAgo };
}

// Helper to filter entries by date range
function filterByDate(entries, startDate, endDate = null) {
  const start = startDate.getTime();
  const end = endDate ? endDate.getTime() : Date.now();
  
  return entries.filter(entry => {
    const entryTime = typeof entry.timestamp === 'string' 
      ? new Date(entry.timestamp).getTime() 
      : entry.timestamp;
    return entryTime >= start && entryTime <= end;
  });
}

// GET /api/costs/summary
router.get('/summary', async (_req, res) => {
  try {
    const data = await getCostsData();
    const { today, weekAgo, monthAgo } = getDateBoundaries();
    
    const todayEntries = filterByDate(data.entries, today);
    const weekEntries = filterByDate(data.entries, weekAgo);
    const monthEntries = filterByDate(data.entries, monthAgo);
    
    // Find most active model
    const modelCounts = {};
    for (const entry of data.entries) {
      const model = entry.model || 'unknown';
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    }
    const mostActiveModel = Object.entries(modelCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    res.json({
      today: {
        tokens: todayEntries.reduce((sum, e) => sum + e.usage.totalTokens, 0),
        cost: Math.round(todayEntries.reduce((sum, e) => sum + e.usage.cost, 0) * 100000) / 100000,
        sessions: new Set(todayEntries.map(e => `${e.agent}:${e.timestamp}`)).size
      },
      thisWeek: {
        tokens: weekEntries.reduce((sum, e) => sum + e.usage.totalTokens, 0),
        cost: Math.round(weekEntries.reduce((sum, e) => sum + e.usage.cost, 0) * 100000) / 100000,
        sessions: new Set(weekEntries.map(e => `${e.agent}:${e.timestamp}`)).size
      },
      thisMonth: {
        tokens: monthEntries.reduce((sum, e) => sum + e.usage.totalTokens, 0),
        cost: Math.round(monthEntries.reduce((sum, e) => sum + e.usage.cost, 0) * 100000) / 100000,
        sessions: new Set(monthEntries.map(e => `${e.agent}:${e.timestamp}`)).size
      },
      mostActiveModel
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/costs/daily?days=14
router.get('/daily', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 14, 90); // Cap at 90 days
    const data = await getCostsData();
    
    const dailyData = {};
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    // Initialize all days with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        date: dateStr,
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        cost: 0
      };
    }
    
    // Aggregate entries by date
    for (const entry of data.entries) {
      const entryTime = typeof entry.timestamp === 'string' 
        ? new Date(entry.timestamp).getTime() 
        : entry.timestamp;
      
      if (entryTime < cutoffTime) continue;
      
      const date = new Date(entryTime).toISOString().split('T')[0];
      if (dailyData[date]) {
        dailyData[date].input += entry.usage.input;
        dailyData[date].output += entry.usage.output;
        dailyData[date].cacheRead += entry.usage.cacheRead;
        dailyData[date].cacheWrite += entry.usage.cacheWrite;
        dailyData[date].cost += entry.usage.cost;
      }
    }
    
    // Round costs and sort by date (newest first)
    const result = Object.values(dailyData)
      .map(day => ({
        ...day,
        cost: Math.round(day.cost * 100000) / 100000
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/costs/by-agent
router.get('/by-agent', async (_req, res) => {
  try {
    const data = await getCostsData();
    
    const result = Object.entries(data.agentData)
      .map(([agent, stats]) => ({
        agent,
        tokens: stats.tokens,
        cost: Math.round(stats.cost * 100000) / 100000,
        sessions: stats.sessions
      }))
      .sort((a, b) => b.cost - a.cost);
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/costs/by-model
router.get('/by-model', async (_req, res) => {
  try {
    const data = await getCostsData();
    
    const total = data.totalCost;
    const result = Object.entries(data.modelData)
      .map(([model, stats]) => ({
        model,
        tokens: stats.tokens,
        cost: Math.round(stats.cost * 100000) / 100000,
        percentage: total > 0 ? Math.round((stats.cost / total) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.cost - a.cost);
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;