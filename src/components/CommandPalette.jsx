import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { useConfig } from '../context/ConfigContext';
import { useApi } from '../hooks/useApi';
import {
  Search, Home, Activity, DollarSign, Server, Bell, Settings,
  Zap, RotateCcw, Trash2, ArrowRight, Command, Monitor,
  Sun, Moon, Puzzle, X,
} from 'lucide-react';

// Simple fuzzy match — returns score (0 = no match, higher = better)
function fuzzyMatch(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  
  // Exact substring match scores highest
  if (t.includes(q)) return 100 + (q.length / t.length) * 50;
  
  // Fuzzy: all chars must appear in order
  let qi = 0;
  let score = 0;
  let lastMatch = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 10;
      // Consecutive matches bonus
      if (lastMatch === ti - 1) score += 5;
      // Start-of-word bonus
      if (ti === 0 || t[ti - 1] === ' ') score += 8;
      lastMatch = ti;
      qi++;
    }
  }
  
  return qi === q.length ? score : 0;
}

const PAGE_ICON_MAP = {
  home: Home,
  activity: Activity,
  costs: DollarSign,
  services: Server,
  notifications: Bell,
  settings: Settings,
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { config, saveConfig } = useConfig();
  const { data: actions } = useApi('/api/actions');
  const { data: plugins } = useApi('/api/plugins');

  // Global Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Build items list
  const items = useMemo(() => {
    const result = [];

    // Pages
    const pages = [
      { path: '/', label: t('nav.home'), icon: Home, section: 'pages' },
      { path: '/activity', label: t('nav.activity'), icon: Activity, section: 'pages' },
      { path: '/costs', label: t('nav.costs'), icon: DollarSign, section: 'pages' },
      { path: '/services', label: t('nav.services'), icon: Server, section: 'pages' },
      { path: '/notifications', label: t('nav.notifications'), icon: Bell, section: 'pages' },
      { path: '/settings', label: t('nav.settings'), icon: Settings, section: 'pages' },
    ];

    for (const page of pages) {
      result.push({
        id: `page:${page.path}`,
        label: page.label,
        sublabel: `Go to ${page.label}`,
        icon: page.icon,
        section: 'Navigate',
        action: () => navigate(page.path),
      });
    }

    // Quick actions from API
    if (actions?.length) {
      for (const action of actions) {
        result.push({
          id: `action:${action.id}`,
          label: action.label || action.id,
          sublabel: action.description || 'Run action',
          icon: Zap,
          section: 'Actions',
          action: async () => {
            try {
              await fetch(`/api/actions/${action.id}`, { method: 'POST' });
            } catch {}
          },
        });
      }
    }

    // Theme switches
    result.push({
      id: 'theme:dark',
      label: 'Dark theme',
      sublabel: 'Switch to dark mode',
      icon: Moon,
      section: 'Appearance',
      action: () => saveConfig({ theme: 'dark' }),
    });
    result.push({
      id: 'theme:light',
      label: 'Light theme',
      sublabel: 'Switch to light mode',
      icon: Sun,
      section: 'Appearance',
      action: () => saveConfig({ theme: 'light' }),
    });

    // Settings shortcuts
    result.push({
      id: 'settings:wizard',
      label: 'Redo setup wizard',
      sublabel: 'Restart the onboarding flow',
      icon: RotateCcw,
      section: 'Settings',
      action: () => {
        saveConfig({ setupComplete: false });
        navigate('/');
      },
    });

    // Plugins
    if (plugins?.length) {
      for (const plugin of plugins) {
        const key = `plugin:${plugin.id}`;
        const widgetOrder = config?.widgetOrder || config?.homeWidgets || [];
        const isEnabled = widgetOrder.includes(key);
        result.push({
          id: `plugin:toggle:${plugin.id}`,
          label: `${isEnabled ? 'Remove' : 'Add'} ${plugin.name} plugin`,
          sublabel: plugin.description,
          icon: Puzzle,
          section: 'Plugins',
          action: () => {
            const order = [...widgetOrder];
            if (isEnabled) {
              saveConfig({ widgetOrder: order.filter(id => id !== key), homeWidgets: order.filter(id => id !== key) });
            } else {
              order.push(key);
              saveConfig({ widgetOrder: order, homeWidgets: order });
            }
          },
        });
      }
    }

    return result;
  }, [t, actions, plugins, config, navigate, saveConfig]);

  // Filter and sort by fuzzy match
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    return items
      .map(item => ({ ...item, score: fuzzyMatch(query, item.label) + fuzzyMatch(query, item.sublabel) * 0.5 }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [items, query]);

  // Clamp selected index
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
      setOpen(false);
    }
  }, [filtered, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  // Group by section
  const sections = {};
  for (const item of filtered) {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  }

  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Palette */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 520,
          zIndex: 9999,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPalette.placeholder')}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              color: 'var(--text)',
            }}
          />
          <kbd style={{
            fontSize: '0.65rem',
            padding: '0.15rem 0.4rem',
            borderRadius: '0.25rem',
            background: 'var(--surface2)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            maxHeight: 360,
            overflowY: 'auto',
            padding: '0.5rem',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '2rem 1rem',
              color: 'var(--text-muted)', fontSize: '0.85rem',
            }}>
              {query ? t('commandPalette.noResults') : t('commandPalette.hint')}
            </div>
          ) : (
            Object.entries(sections).map(([section, sectionItems]) => (
              <div key={section}>
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  padding: '0.5rem 0.5rem 0.25rem',
                }}>
                  {section}
                </div>
                {sectionItems.map(item => {
                  const idx = flatIndex++;
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { item.action(); setOpen(false); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.6rem 0.5rem',
                        border: 'none',
                        borderRadius: '0.5rem',
                        background: isSelected ? 'var(--surface2)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                    >
                      <Icon size={16} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: isSelected ? 500 : 400 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.sublabel}
                        </div>
                      </div>
                      {isSelected && (
                        <ArrowRight size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '0.5rem 1rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <kbd style={{ padding: '0.1rem 0.3rem', borderRadius: '0.2rem', background: 'var(--surface2)', border: '1px solid var(--border)' }}>↑↓</kbd>
            {t('commandPalette.navigate')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <kbd style={{ padding: '0.1rem 0.3rem', borderRadius: '0.2rem', background: 'var(--surface2)', border: '1px solid var(--border)' }}>↵</kbd>
            {t('commandPalette.select')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}>
            <kbd style={{ padding: '0.1rem 0.3rem', borderRadius: '0.2rem', background: 'var(--surface2)', border: '1px solid var(--border)' }}>⌘K</kbd>
            {t('commandPalette.toggle')}
          </span>
        </div>
      </div>
    </>
  );
}
