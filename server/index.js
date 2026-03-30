import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

import configRoutes from './routes/config.js';
import profilesRoutes from './routes/profiles.js';
import systemRoutes from './routes/system.js';
import gatewayRoutes from './routes/gateway.js';
import discoverRoutes from './routes/discover.js';
import servicesRoutes from './routes/services.js';
import activityRoutes from './routes/activity.js';
import actionsRoutes from './routes/actions.js';
import costsRoutes from './routes/costs.js';
import alertsRoutes from './routes/alerts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3100;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// API routes
app.use('/api/config', configRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/alerts', alertsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Serve built frontend in production
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(`OpenClaw Hub API running on http://127.0.0.1:${PORT}`);
});
