import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import CommandPalette from './CommandPalette';
import { useI18n } from '../context/I18nContext';

export default function Layout({ children }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      <main className="flex-1 overflow-x-hidden flex flex-col min-w-0">
        {/* Top bar (mobile only) */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-50"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              OpenClaw Hub
            </span>
          </div>
          <button
            onClick={() => setCmdOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
            title={t('layout.search')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </header>

        <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </div>
      </main>

      <BottomNav />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
