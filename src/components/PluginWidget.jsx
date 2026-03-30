import { useState, useEffect, useRef, Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Error boundary as class component (React requirement)
class PluginErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[hub-plugin:${this.props.pluginId}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 text-center">
          <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
            Plugin crashed
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: 200 }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded mt-1"
            style={{ background: 'var(--surface2)', color: 'var(--accent)' }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Module cache — don't re-import the same plugin every render
const moduleCache = new Map();

function usePluginComponent(pluginId) {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Check cache first
      if (moduleCache.has(pluginId)) {
        setComponent(() => moduleCache.get(pluginId));
        setLoading(false);
        return;
      }

      try {
        // Dynamic import of compiled plugin module from server
        // Add timestamp to bust browser cache when plugin files change
        const mod = await import(/* @vite-ignore */ `/api/plugins/${pluginId}/widget?t=${Date.now()}`);
        const comp = mod.default;
        if (!cancelled) {
          moduleCache.set(pluginId, comp);
          setComponent(() => comp);
          setLoading(false);
        }
      } catch (err) {
        console.error(`[hub-plugin:${pluginId}] load failed:`, err);
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [pluginId]);

  return { Component, loading, error };
}

// Set up the global API that plugin-api-source.js reads from
function setupPluginAPI(pluginId) {
  // Get current theme from CSS variables
  const style = getComputedStyle(document.documentElement);
  const theme = {
    bg: style.getPropertyValue('--background')?.trim() || '#0a0a0a',
    surface: style.getPropertyValue('--surface')?.trim() || '#141414',
    surface2: style.getPropertyValue('--surface2')?.trim() || '#1e1e1e',
    border: style.getPropertyValue('--border')?.trim() || '#2a2a2a',
    text: style.getPropertyValue('--text')?.trim() || '#e5e5e5',
    muted: style.getPropertyValue('--text-muted')?.trim() || '#888',
    accent: style.getPropertyValue('--accent')?.trim() || '#D4A853',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    isDark: document.documentElement.getAttribute('data-theme') !== 'light',
  };

  const cleanups = [];

  window.__OPENCLAW_PLUGIN_API__ = {
    pluginId,
    theme,
    hubData: {}, // TODO: populate from discover API
    getPluginConfig: (id) => {
      try {
        const stored = localStorage.getItem(`plugin-config:${id}`);
        return stored ? JSON.parse(stored) : {};
      } catch { return {}; }
    },
    setPluginConfig: (id, config) => {
      localStorage.setItem(`plugin-config:${id}`, JSON.stringify(config));
      // Also persist to server
      fetch(`/api/plugins/${id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).catch(() => {});
    },
    notify: ({ title, message, type }) => {
      console.log(`[plugin:${pluginId}] notification:`, { title, message, type });
      // TODO: hook into a toast system
    },
    registerCleanup: (fn) => cleanups.push(fn),
    registerAction: (id, label, handler) => {
      // TODO: hook into command palette
      console.log(`[plugin:${pluginId}] registered action:`, id, label);
    },
  };

  return () => {
    cleanups.forEach(fn => { try { fn(); } catch {} });
  };
}

export default function PluginWidget({ pluginId, manifest }) {
  const { Component: PluginComponent, loading, error } = usePluginComponent(pluginId);
  const cleanupRef = useRef(null);

  useEffect(() => {
    cleanupRef.current = setupPluginAPI(pluginId);
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [pluginId]);

  const size = manifest?.size || 'medium';

  return (
    <div
      className="widget-card p-4 rounded-xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Plugin header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)' }}
        >
          {(manifest?.name || pluginId).charAt(0).toUpperCase()}
        </div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {manifest?.name || pluginId}
        </h3>
        <span className="text-xs px-1.5 py-0.5 rounded-full ml-auto" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
          plugin
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <AlertTriangle size={16} style={{ color: '#ef4444', margin: '0 auto' }} />
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Failed to load plugin
          </p>
          <p className="text-xs mt-1 font-mono" style={{ color: '#ef4444', fontSize: '0.65rem' }}>
            {error.message}
          </p>
        </div>
      ) : PluginComponent ? (
        <PluginErrorBoundary pluginId={pluginId}>
          <PluginComponent />
        </PluginErrorBoundary>
      ) : null}
    </div>
  );
}
