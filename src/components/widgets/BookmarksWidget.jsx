import { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { useI18n } from '../../context/I18nContext';
import { Bookmark, Plus, X, ExternalLink, GripVertical } from 'lucide-react';

export default function BookmarksWidget() {
  const { config, saveConfig } = useConfig();
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const bookmarks = config?.bookmarks || [];

  const addBookmark = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const updated = [...bookmarks, { name: newName.trim(), url, id: Date.now().toString() }];
    saveConfig({ bookmarks: updated });
    setNewName('');
    setNewUrl('');
    setAdding(false);
  };

  const removeBookmark = (id) => {
    const updated = bookmarks.filter(b => b.id !== id);
    saveConfig({ bookmarks: updated });
  };

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addBookmark();
    if (e.key === 'Escape') { setAdding(false); setNewName(''); setNewUrl(''); }
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
          onClick={() => setAdding(!adding)}
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
            onClick={addBookmark}
            disabled={!newName.trim() || !newUrl.trim()}
            className="w-full py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            {t('bookmarks.add')}
          </button>
        </div>
      )}

      {/* Bookmark grid */}
      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {bookmarks.map((bm) => {
            const favicon = getFavicon(bm.url);
            return (
              <a
                key={bm.id}
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 p-2.5 rounded-lg transition-all hover:scale-[1.02]"
                style={{ background: 'var(--background)', textDecoration: 'none' }}
              >
                {favicon ? (
                  <img src={favicon} alt="" width={16} height={16} className="rounded-sm flex-shrink-0" />
                ) : (
                  <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
                )}
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
      ) : !adding ? (
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('bookmarks.empty')}
          </p>
        </div>
      ) : null}
    </div>
  );
}
