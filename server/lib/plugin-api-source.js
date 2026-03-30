// This file is served as /api/plugins/_api.js
// It provides the hooks and utilities that plugins import from '@openclaw-hub/api'
// All data comes from window.__OPENCLAW_PLUGIN_API__ set by the PluginSandbox

export function useTheme() {
  const api = window.__OPENCLAW_PLUGIN_API__;
  if (!api) throw new Error('Plugin API not available — are you inside a PluginWidget?');
  return api.theme;
}

/**
 * Returns the current Hub language code (e.g. 'en', 'sv', 'de').
 * Plugins use this to pick from their own translation strings.
 */
export function useLanguage() {
  const api = window.__OPENCLAW_PLUGIN_API__;
  if (!api) return 'en';
  return api.language || 'en';
}

/**
 * Helper: create a t() function from a translations object.
 * Usage:
 *   const translations = { en: { title: 'Clock' }, sv: { title: 'Klocka' } };
 *   const t = useTranslations(translations);
 *   t('title') → 'Klocka' (if Hub language is Swedish)
 */
export function useTranslations(translations) {
  const lang = useLanguage();
  const strings = translations[lang] || translations['en'] || {};
  const fallback = translations['en'] || {};
  return (key) => strings[key] ?? fallback[key] ?? key;
}

export function useConfig(pluginId) {
  const api = window.__OPENCLAW_PLUGIN_API__;
  if (!api) throw new Error('Plugin API not available');
  const config = api.getPluginConfig(pluginId) || {};
  const setConfig = (newConfig) => api.setPluginConfig(pluginId, newConfig);
  return [config, setConfig];
}

export function useHubData() {
  const api = window.__OPENCLAW_PLUGIN_API__;
  if (!api) throw new Error('Plugin API not available');
  return api.hubData || {};
}

export function useInterval(callback, ms) {
  const api = window.__OPENCLAW_PLUGIN_API__;
  if (!api) return;
  // Enforce minimum 1s interval
  const safeMs = Math.max(ms, 1000);
  const id = setInterval(callback, safeMs);
  // Register for cleanup
  if (api.registerCleanup) {
    api.registerCleanup(() => clearInterval(id));
  }
  return id;
}

export function useNotification() {
  const api = window.__OPENCLAW_PLUGIN_API__;
  if (!api) return () => {};
  return api.notify || (() => {});
}

export function registerAction(id, label, handler) {
  const api = window.__OPENCLAW_PLUGIN_API__;
  if (!api) return;
  if (api.registerAction) {
    api.registerAction(id, label, handler);
  }
}

export async function pluginFetch(url, options) {
  // Route through server proxy for transparency
  const api = window.__OPENCLAW_PLUGIN_API__;
  if (!api) throw new Error('Plugin API not available');
  const pluginId = api.pluginId;
  const res = await fetch('/api/plugins/' + encodeURIComponent(pluginId) + '/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, options }),
  });
  if (!res.ok) {
    throw new Error('pluginFetch failed: ' + (await res.text()));
  }
  return res.json();
}
