import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Activity, DollarSign, Server, Bell, Settings, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const getActions = (t) => [
  { id: 'nav-home',          label: `${t('cmd.goTo')} ${t('nav.home')}`,     icon: Home,        action: 'nav', path: '/', group: t('cmd.navigate') },
  { id: 'nav-activity',      label: `${t('cmd.goTo')} ${t('nav.activity')}`, icon: Activity,    action: 'nav', path: '/activity', group: t('cmd.navigate') },
  { id: 'nav-costs',         label: `${t('cmd.goTo')} ${t('nav.costs')}`,    icon: DollarSign,  action: 'nav', path: '/costs', group: t('cmd.navigate') },
  { id: 'nav-services',      label: `${t('cmd.goTo')} ${t('nav.services')}`, icon: Server,      action: 'nav', path: '/services', group: t('cmd.navigate') },
  { id: 'nav-notifications', label: `${t('cmd.goTo')} ${t('nav.alerts')}`,   icon: Bell,        action: 'nav', path: '/notifications', group: t('cmd.navigate') },
  { id: 'nav-settings',      label: `${t('cmd.open')} ${t('nav.settings')}`, icon: Settings,    action: 'nav', path: '/settings', group: t('cmd.navigate') },
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

  const actions = getActions(t);
  const results = actions.filter(a => fuzzyMatch(query, a.label));

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
