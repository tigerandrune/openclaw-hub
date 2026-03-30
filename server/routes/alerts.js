import { Router } from 'express';

const router = Router();

// Cache for 30 seconds to avoid overwhelming the system checks
let cache = null;
let cacheTs = 0;
const CACHE_TTL = 30000; // 30 seconds

// Alert rule definitions — titleKey/descKey are i18n keys resolved on the frontend
const RULES = {
  cpu: [
    { threshold: 90, severity: 'critical', titleKey: 'alerts.rule.cpu.critical', id: 'cpu-critical' },
    { threshold: 75, severity: 'warning', titleKey: 'alerts.rule.cpu.high', id: 'cpu-high' }
  ],
  memory: [
    { threshold: 90, severity: 'critical', titleKey: 'alerts.rule.memory.critical', id: 'memory-critical' },
    { threshold: 80, severity: 'warning', titleKey: 'alerts.rule.memory.high', id: 'memory-high' }
  ],
  disk: [
    { threshold: 95, severity: 'critical', titleKey: 'alerts.rule.disk.critical', id: 'disk-critical' },
    { threshold: 85, severity: 'warning', titleKey: 'alerts.rule.disk.high', id: 'disk-high' },
    { threshold: 75, severity: 'info', titleKey: 'alerts.rule.disk.elevated', id: 'disk-elevated' }
  ]
};

const SELF_PORT = process.env.PORT || 3100;

async function fetchInternalAPI(endpoint) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`http://127.0.0.1:${SELF_PORT}${endpoint}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch ${endpoint}:`, error.message);
    return null;
  }
}

function createAlert(id, severity, category, title, description, value, threshold, component) {
  return {
    id,
    severity,
    category,
    title,
    description,
    value,
    threshold,
    component
  };
}

function checkResourceAlerts(value, resourceName, rules) {
  const alerts = [];
  
  for (const rule of rules) {
    if (value > rule.threshold) {
      alerts.push(createAlert(
        rule.id,
        rule.severity,
        'system',
        rule.titleKey, // i18n key — frontend resolves
        null, // description generated on frontend from value + component
        value,
        rule.threshold,
        resourceName.toLowerCase()
      ));
      break; // Only add the highest severity alert that matches
    }
  }
  
  return alerts;
}

function determineStatus(value, rules) {
  for (const rule of rules) {
    if (value > rule.threshold) {
      return rule.severity === 'info' ? 'info' : 
             rule.severity === 'warning' ? 'warning' : 'critical';
    }
  }
  return 'healthy';
}

router.get('/', async (_req, res) => {
  try {
    const now = Date.now();
    if (cache && now - cacheTs < CACHE_TTL) {
      return res.json(cache);
    }

    // Fetch all required data in parallel
    const [systemStats, pm2Data, gatewayHealth] = await Promise.all([
      fetchInternalAPI('/api/system'),
      fetchInternalAPI('/api/services/pm2'),
      fetchInternalAPI('/api/gateway')
    ]);

    const alerts = [];
    const checks = [];

    // System stats checks (CPU, Memory, Disk)
    if (systemStats) {
      const cpuUsage = systemStats.cpu?.usage || 0;
      const memoryPercent = systemStats.memory?.percentage || 0;
      const diskPercent = systemStats.disk?.percentage || 0;

      // Generate CPU alerts
      alerts.push(...checkResourceAlerts(cpuUsage, 'CPU', RULES.cpu));
      checks.push({
        name: 'CPU',
        status: determineStatus(cpuUsage, RULES.cpu),
        value: `${Math.round(cpuUsage)}%`
      });

      // Generate Memory alerts
      alerts.push(...checkResourceAlerts(memoryPercent, 'Memory', RULES.memory));
      checks.push({
        name: 'Memory',
        status: determineStatus(memoryPercent, RULES.memory),
        value: `${Math.round(memoryPercent)}%`
      });

      // Generate Disk alerts
      alerts.push(...checkResourceAlerts(diskPercent, 'Disk', RULES.disk));
      checks.push({
        name: 'Disk',
        status: determineStatus(diskPercent, RULES.disk),
        value: `${Math.round(diskPercent)}%`
      });
    } else {
      // System stats unavailable
      alerts.push(createAlert(
        'system-offline',
        'critical',
        'system',
        'alerts.rule.system.offline',
        null,
        null,
        null,
        'system'
      ));
      checks.push({ name: 'System', status: 'critical', value: 'offline' });
    }

    // Gateway health check
    if (gatewayHealth) {
      const isOnline = gatewayHealth.online === true;
      if (!isOnline) {
        alerts.push(createAlert(
          'gateway-offline',
          'critical',
          'gateway',
          'alerts.rule.gateway.offline',
          null,
          null,
          null,
          'gateway'
        ));
      }
      checks.push({
        name: 'Gateway',
        status: isOnline ? 'healthy' : 'critical',
        value: isOnline ? 'online' : 'offline'
      });
    } else {
      // Gateway check failed
      alerts.push(createAlert(
        'gateway-unavailable',
        'critical',
        'gateway',
        'alerts.rule.gateway.unavailable',
        null,
        null,
        null,
        'gateway'
      ));
      checks.push({ name: 'Gateway', status: 'critical', value: 'unavailable' });
    }

    // PM2 process checks
    if (pm2Data && pm2Data.available) {
      const processes = pm2Data.processes || [];
      
      processes.forEach(process => {
        const isOnline = process.status === 'online';
        const restartCount = process.restarts || 0;
        
        // Process down alert
        if (!isOnline) {
          alerts.push(createAlert(
            `pm2-${process.name}-down`,
            'critical',
            'services',
            'alerts.rule.process.down',
            null,
            null,
            null,
            process.name
          ));
        }
        
        // High restart count alert
        if (restartCount > 10) {
          alerts.push(createAlert(
            `pm2-${process.name}-restarts`,
            'warning',
            'services',
            'alerts.rule.process.restarts',
            null,
            restartCount,
            10,
            process.name
          ));
        }
        
        // Add to checks
        checks.push({
          name: process.name,
          status: !isOnline ? 'critical' : (restartCount > 10 ? 'warning' : 'healthy'),
          value: isOnline ? 'online' : process.status
        });
      });
    } else if (pm2Data && !pm2Data.available) {
      // PM2 not available, but that's OK - just note it
      checks.push({
        name: 'PM2',
        status: 'info',
        value: 'not available'
      });
    } else {
      // PM2 check failed
      alerts.push(createAlert(
        'pm2-check-failed',
        'warning',
        'services',
        'alerts.rule.pm2.checkFailed',
        null,
        null,
        null,
        'pm2'
      ));
      checks.push({ name: 'PM2', status: 'warning', value: 'check failed' });
    }

    // Generate summary counts
    const summary = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      total: checks.length
    };

    // Cache the result
    cache = {
      alerts,
      summary,
      checks,
      timestamp: now
    };
    cacheTs = now;

    res.json(cache);
    
  } catch (error) {
    console.error('Alerts endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to generate alerts',
      details: error.message 
    });
  }
});

export default router;