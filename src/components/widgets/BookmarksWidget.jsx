import { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { useI18n } from '../../context/I18nContext';
import { useApi } from '../../hooks/useApi';
import {
  Bookmark, Plus, X, ExternalLink, Zap,
  RotateCcw, FileText, Activity, Loader2, Check,
} from 'lucide-react';

const ACTION_ICONS = {
  'restart-gateway': RotateCcw,
  'check-logs': FileText,
  'gateway-status': Activity,
};

export default function BookmarksWidget() {
  const { config, saveConfig } = useConfig();
  const { t } = useI18n();
  const { data: availableActions } = useApi('/api/actions');
  const [adding, setAdding] = useState(false);
  const [addType, setAddType] = useState('url'); // 'url' | 'action'
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [actionStates, setActionStates] = useState({}); // loading/success per action

  const bookmarks = config?.bookmarks || [];

  // Split bookmarks by type
  const urlBookmarks = bookmarks.filter(b => b.type !== 'action');
  const actionBookmarks = bookmarks.filter(b => b.type === 'action');

  // Actions not yet bookmarked
  const actions = Array.isArray(availableActions) ? availableActions : availableActions?.actions || [];
  const unbookmarkedActions = actions.filter(
    a => !actionBookmarks.some(b => b.actionId === a.id)
  );

  const addUrlBookmark = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const updated = [...bookmarks, { name: newName.trim(), url, id: Date.now().toString(), type: 'url' }];
    saveConfig({ bookmarks: updated });
    resetForm();
  };

  const addActionBookmark = (action) => {
    const updated = [...bookmarks, {
      name: action.label,
      actionId: action.id,
      id: Date.now().toString(),
      type: 'action',
    }];
    saveConfig({ bookmarks: updated });
  };

  const removeBookmark = (id) => {
    saveConfig({ bookmarks: bookmarks.filter(b => b.id !== id) });
  };

  const executeAction = async (actionId) => {
    setActionStates(prev => ({ ...prev, [actionId]: 'loading' }));
    try {
      const res = await fetch(`/api/actions/${actionId}/execute`, { method: 'POST' });
      if (res.ok) {
        setActionStates(prev => ({ ...prev, [actionId]: 'success' }));
        setTimeout(() => setActionStates(prev => ({ ...prev, [actionId]: null })), 2000);
      } else {
        setActionStates(prev => ({ ...prev, [actionId]: 'error' }));
        setTimeout(() => setActionStates(prev => ({ ...prev, [actionId]: null })), 3000);
      }
    } catch {
      setActionStates(prev => ({ ...prev, [actionId]: 'error' }));
      setTimeout(() => setActionStates(prev => ({ ...prev, [actionId]: null })), 3000);
    }
  };

  const resetForm = () => {
    setAdding(false);
    setAddType('url');
    setNewName('');
    setNewUrl('');
  };

  const getDomainLetter = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain[0].toUpperCase();
    } catch {
      return '?';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addUrlBookmark();
    if (e.key === 'Escape') resetForm();
  };

  return (
    <div className="widget-card p-4 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark size={16} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {t('bookmarks.title')}
          </h3>
        </div>
        <button
          onClick={() => adding ? resetForm() : setAdding(true)}
          className="p-1 rounded-md transition-all hover:scale-110"
          style={{ color: 'var(--text-muted)' }}
          title={t('bookmarks.add')}
        >
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-3 p-3 rounded-lg space-y-2" style={{ background: 'var(--background)' }}>
          {/* Type toggle */}
          <div className="flex gap-1 p-0.5 rounded-md" style={{ background: 'var(--surface)' }}>
            <button
              onClick={() => setAddType('url')}
              className="flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all"
              style={{
                background: addType === 'url' ? 'var(--accent)' : 'transparent',
                color: addType === 'url' ? '#000' : 'var(--text-muted)',
              }}
            >
              <ExternalLink size={12} className="inline mr-1" style={{ verticalAlign: -2 }} />
              {t('bookmarks.typeUrl')}
            </button>
            <button
              onClick={() => setAddType('action')}
              className="flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all"
              style={{
                background: addType === 'action' ? 'var(--accent)' : 'transparent',
                color: addType === 'action' ? '#000' : 'var(--text-muted)',
              }}
            >
              <Zap size={12} className="inline mr-1" style={{ verticalAlign: -2 }} />
              {t('bookmarks.typeAction')}
            </button>
          </div>

          {addType === 'url' ? (
            <>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('bookmarks.namePlaceholder')}
                className="w-full px-2.5 py-1.5 rounded-md text-sm bg-transparent border outline-none"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                autoFocus
              />
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('bookmarks.urlPlaceholder')}
                className="w-full px-2.5 py-1.5 rounded-md text-sm bg-transparent border outline-none"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              <button
                onClick={addUrlBookmark}
                disabled={!newName.trim() || !newUrl.trim()}
                className="w-full py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                {t('bookmarks.add')}
              </button>
            </>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {unbookmarkedActions.length > 0 ? unbookmarkedActions.map(action => {
                const Icon = ACTION_ICONS[action.id] || Zap;
                return (
                  <button
                    key={action.id}
                    onClick={() => addActionBookmark(action)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-md text-left transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--surface)' }}
                  >
                    <Icon size={14} style={{ color: 'var(--accent)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{action.label}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{action.description}</div>
                    </div>
                    <Plus size={12} style={{ color: 'var(--text-muted)' }} />
                  </button>
                );
              }) : (
                <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                  {t('bookmarks.allActionsPinned')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action bookmarks */}
      {actionBookmarks.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {actionBookmarks.map((bm) => {
            const Icon = ACTION_ICONS[bm.actionId] || Zap;
            const state = actionStates[bm.actionId];
            return (
              <div
                key={bm.id}
                className="group flex items-center gap-2.5 p-2.5 rounded-lg transition-all"
                style={{ background: 'var(--background)' }}
              >
                <button
                  onClick={() => executeAction(bm.actionId)}
                  disabled={state === 'loading'}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  {state === 'loading' ? (
                    <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  ) : state === 'success' ? (
                    <Check size={14} className="flex-shrink-0" style={{ color: '#22c55e' }} />
                  ) : (
                    <Icon size={14} className="flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  )}
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                    {bm.name}
                  </span>
                </button>
                <button
                  onClick={() => removeBookmark(bm.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* URL bookmarks */}
      {urlBookmarks.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {urlBookmarks.map((bm) => {
            const letter = getDomainLetter(bm.url);
            return (
              <a
                key={bm.id}
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 p-2.5 rounded-lg transition-all hover:scale-[1.02]"
                style={{ background: 'var(--background)', textDecoration: 'none' }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--accent)', color: '#000', fontSize: 10 }}
                >
                  {letter}
                </div>
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                  {bm.name}
                </span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeBookmark(bm.id); }}
                  className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={12} />
                </button>
              </a>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {bookmarks.length === 0 && !adding && (
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('bookmarks.empty')}
          </p>
        </div>
      )}
    </div>
  );
}
