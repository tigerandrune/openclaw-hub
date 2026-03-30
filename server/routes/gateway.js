import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const router = Router();
const OPENCLAW_CONFIG = join(homedir(), '.openclaw', 'openclaw.json');

async function checkGatewayHealth(port) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://127.0.0.1:${port}/`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

router.get('/', async (_req, res) => {
  try {
    if (!existsSync(OPENCLAW_CONFIG)) {
      return res.json({ online: false, reason: 'No config found' });
    }

    const raw = readFileSync(OPENCLAW_CONFIG, 'utf8');
    const config = JSON.parse(raw);

    // Model: check common paths in openclaw.json
    const primaryModel =
      config.agents?.defaults?.model?.primary ??
      config.agents?.defaults?.model ??
      config.model ??
      null;

    // Channels: use the actual channels config key
    const channels = config.channels ? Object.keys(config.channels) : [];

    // Port: check both locations (gateway.port and gateway.bind.port)
    const gatewayPort =
      config.gateway?.port ??
      (typeof config.gateway?.bind === 'object' ? config.gateway.bind.port : null) ??
      18789;

    const online = await checkGatewayHealth(gatewayPort);

    res.json({
      online,
      model: typeof primaryModel === 'string' ? primaryModel : null,
      channels,
      port: gatewayPort,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, online: false });
  }
});

export default router;
