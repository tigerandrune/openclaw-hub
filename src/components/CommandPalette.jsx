import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Activity, DollarSign, Layout, Server, Bell, Settings, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const ACTIONS = [
  { id: 'nav-home',          label: 'Go to Home',          icon: Home,        action: 'nav', path: '/', group: 'Navigate' },
  { id: 'nav-activity',      label: 'Go to Activity',      icon: Activity,    action: 'nav', path: '/activity', group: 'Navigate' },
  { id: 'nav-costs',         label: 'Go to Costs',         icon: DollarSign,  action: 'nav', path: '/costs', group: 'Navigate' },
  { id: 'nav-kanban',        label: 'Go to Tasks',         icon: Layout,      action: 'nav', path: '/kanban', group: 'Navigate' },
  { id: 'nav-services',      label: 'Go to Services',      icon: Server,      action: 'nav', path: '/services', group: 'Navigate' },
  { id: 'nav-notifications', label: 'Go to Alerts',        icon: Bell,        action: 'nav', path: '/notifications', group: 'Navigate' },
  { id: 'nav-settings',      label: 'Open Settings',       icon: Settings,    action: 'nav', path: '/settings', group: 'Navigate' },
];

function fuzzyMatch(query, str) {
  if (!query) return true;
  const q = query.toLowerCase();
  return str.toLowerCase().includes(q);
}

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useI18n();

  const results = ACTIONS.filter(a => fuzzyMatch(query, a.label));

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const execute = (action) => {
    if (action.action === 'nav') {
      navigate(action.path);
    }
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    }
    if (e.key === 'Enter' && results[selected]) {
      execute(results[selected]);
    }
  };

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-box" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t('commandPalette.placeholder')}
            className="flex-1 bg-transparent border-0 outline-none text-sm"
            style={{ color: 'var(--text)', caretColor: 'var(--accent)' }}
          />
          <button onClick={onClose} className="p-1 rounded opacity-40 hover:opacity-100 transition-opacity">
            <X size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Results */}
        <div className="py-2 max-h-80 overflow-y-auto">
          {results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('commandPalette.noResults')} &ldquo;{query}&rdquo;
            </div>
          )}
          {results.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{
                  background: i === selected ? 'var(--surface2)' : 'transparent',
                  color: i === selected ? 'var(--text)' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setSelected(i)}
                onClick={() => execute(action)}
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="text-sm">{action.label}</span>
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 11 }}
                >
                  {action.group}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-4 py-2.5 border-t text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <span><kbd style={{ fontFamily: 'inherit' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ fontFamily: 'inherit' }}>↵</kbd> select</span>
          <span><kbd style={{ fontFamily: 'inherit' }}>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
