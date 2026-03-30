import { Router } from 'express';
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { compilePlugin } from '../lib/plugin-compiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();
const PLUGINS_DIR = join(homedir(), '.openclaw', 'hub-plugins');

// Cache manifest scans for 10s
let manifestCache = null;
let manifestCacheTs = 0;
const CACHE_TTL = 10000;

function safeReadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const ID_PATTERN = /^[a-z0-9-]+$/;

function scanPlugins() {
  const now = Date.now();
  if (manifestCache && now - manifestCacheTs < CACHE_TTL) {
    return manifestCache;
  }

  if (!existsSync(PLUGINS_DIR)) {
    manifestCache = [];
    manifestCacheTs = now;
    return [];
  }

  const plugins = [];
  try {
    const dirs = readdirSync(PLUGINS_DIR).filter(d => {
      try {
        return statSync(join(PLUGINS_DIR, d)).isDirectory() && ID_PATTERN.test(d);
      } catch { return false; }
    });

    for (const dir of dirs) {
      const manifestPath = join(PLUGINS_DIR, dir, 'manifest.json');
      const widgetPath = join(PLUGINS_DIR, dir, 'widget.jsx');

      if (!existsSync(manifestPath) || !existsSync(widgetPath)) continue;

      const manifest = safeReadJson(manifestPath);
      if (!manifest || !manifest.id || !manifest.name) continue;

      // Enforce id matches folder name
      if (manifest.id !== dir) continue;

      plugins.push({
        id: manifest.id,
        name: manifest.name,
        description: manifest.description || '',
        author: manifest.author || 'unknown',
        version: manifest.version || '0.0.0',
        size: manifest.size || 'medium',
        permissions: Array.isArray(manifest.permissions) ? manifest.permissions : [],
        hasSettings: !!manifest.settings && Object.keys(manifest.settings).length > 0,
        settingsSchema: manifest.settings || {},
        hasPreview: existsSync(join(PLUGINS_DIR, dir, 'preview.png')),
        hasCustomSettings: existsSync(join(PLUGINS_DIR, dir, 'settings.jsx')),
      });
    }
  } catch (err) {
    console.error('[plugins] scan error:', err.message);
  }

  manifestCache = plugins;
  manifestCacheTs = now;
  return plugins;
}

// GET /api/plugins — list all installed plugins
router.get('/', (_req, res) => {
  res.json(scanPlugins());
});

// GET /api/plugins/_api.js — serve the plugin API module
router.get('/_api.js', (_req, res) => {
  const apiPath = join(__dirname, '..', 'lib', 'plugin-api-source.js');
  const code = readFileSync(apiPath, 'utf8');
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(code);
});

// GET /api/plugins/_react.js — serve React as ES module shim
router.get('/_react.js', (_req, res) => {
  // Plugins import from 'react' — we redirect to a shim that re-exports
  // from the global React that's already loaded on the page
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`
const R = window.React;
export default R;
export const {
  useState, useEffect, useCallback, useMemo, useRef, useContext,
  createContext, createElement, Fragment, memo, forwardRef,
  Suspense, lazy, startTransition, useReducer, useLayoutEffect,
  useImperativeHandle, useDebugValue, useDeferredValue,
  useTransition, useSyncExternalStore, useId
} = R;
`);
});

// GET /api/plugins/_jsx-runtime.js — serve jsx-runtime shim
router.get('/_jsx-runtime.js', (_req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`
const R = window.React;
const JR = window.ReactJSXRuntime || {};
export const jsx = JR.jsx || R.createElement;
export const jsxs = JR.jsxs || R.createElement;
export const jsxDEV = JR.jsx || R.createElement;
export const Fragment = R.Fragment;
`);
});

// GET /api/plugins/:id/widget — serve compiled widget
router.get('/:id/widget', (req, res) => {
  const { id } = req.params;
  if (!ID_PATTERN.test(id)) return res.status(400).json({ error: 'Invalid plugin ID' });

  const widgetPath = join(PLUGINS_DIR, id, 'widget.jsx');
  if (!existsSync(widgetPath)) return res.status(404).json({ error: 'Plugin not found' });

  try {
    const code = compilePlugin(widgetPath, id);
    res.set('Content-Type', 'application/javascript');
    res.set('Cache-Control', 'no-cache'); // always check mtime via compiler cache
    res.send(code);
  } catch (err) {
    console.error(`[plugins] compile error for ${id}:`, err.message);
    res.status(500).json({ error: 'Compilation failed', detail: err.message });
  }
});

// GET /api/plugins/:id/settings — serve compiled settings component
router.get('/:id/settings', (req, res) => {
  const { id } = req.params;
  if (!ID_PATTERN.test(id)) return res.status(400).json({ error: 'Invalid plugin ID' });

  const settingsPath = join(PLUGINS_DIR, id, 'settings.jsx');
  if (!existsSync(settingsPath)) return res.status(404).json({ error: 'No custom settings' });

  try {
    const code = compilePlugin(settingsPath, id);
    res.set('Content-Type', 'application/javascript');
    res.send(code);
  } catch (err) {
    res.status(500).json({ error: 'Compilation failed', detail: err.message });
  }
});

// GET /api/plugins/:id/preview — serve preview image
router.get('/:id/preview', (req, res) => {
  const { id } = req.params;
  if (!ID_PATTERN.test(id)) return res.status(400).json({ error: 'Invalid plugin ID' });

  const previewPath = join(PLUGINS_DIR, id, 'preview.png');
  if (!existsSync(previewPath)) return res.status(404).json({ error: 'No preview' });

  res.sendFile(previewPath);
});

// GET /api/plugins/:id/config — get plugin config
router.get('/:id/config', (req, res) => {
  const { id } = req.params;
  if (!ID_PATTERN.test(id)) return res.status(400).json({ error: 'Invalid plugin ID' });

  const configPath = join(homedir(), '.openclaw', 'hub-config.json');
  const config = safeReadJson(configPath) || {};
  const pluginConfig = config.pluginConfigs?.[id] || {};
  res.json(pluginConfig);
});

// POST /api/plugins/:id/config — save plugin config
router.post('/:id/config', (req, res) => {
  const { id } = req.params;
  if (!ID_PATTERN.test(id)) return res.status(400).json({ error: 'Invalid plugin ID' });

  const configPath = join(homedir(), '.openclaw', 'hub-config.json');
  const config = safeReadJson(configPath) || {};
  if (!config.pluginConfigs) config.pluginConfigs = {};
  config.pluginConfigs[id] = req.body;

  writeFileSync(configPath, JSON.stringify(config, null, 2));
  res.json({ ok: true });
});

export default router;
