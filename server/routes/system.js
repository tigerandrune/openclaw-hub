import { Router } from 'express';
import si from 'systeminformation';

const router = Router();

// Cache for 3s so rapid widget refreshes don't hammer the OS
let cache = null;
let cacheTs = 0;
const CACHE_TTL = 3000;

router.get('/', async (_req, res) => {
  try {
    const now = Date.now();
    if (cache && now - cacheTs < CACHE_TTL) {
      return res.json(cache);
    }

    const [cpuLoad, cpuData, mem, fsData] = await Promise.all([
      si.currentLoad(),
      si.cpu(),
      si.mem(),
      si.fsSize(),
    ]);

    // Pick the main disk (largest, or first)
    const disks = fsData.filter(d => d.size > 0);
    const mainDisk = disks.sort((a, b) => b.size - a.size)[0] ?? { size: 0, used: 0, use: 0 };

    cache = {
      cpu: {
        usage: Math.round(cpuLoad.currentLoad * 10) / 10,
        cores: cpuData.physicalCores || cpuLoad.cpus.length,
        model: `${cpuData.manufacturer} ${cpuData.brand}`.trim(),
        speed: cpuData.speed,
      },
      memory: {
        total: mem.total,
        used: mem.active,
        free: mem.available,
        percentage: Math.round((mem.active / mem.total) * 1000) / 10,
      },
      disk: {
        total: mainDisk.size,
        used: mainDisk.used,
        free: mainDisk.size - mainDisk.used,
        percentage: Math.round(mainDisk.use * 10) / 10,
        mount: mainDisk.mount,
      },
      uptime: Math.floor(si.time().uptime ?? 0),
    };
    cacheTs = now;

    res.json(cache);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
