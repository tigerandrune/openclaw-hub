import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel, destructive = false }) {
  const { t } = useI18n();
  const dialogRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  // Close on outside click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm mx-4 p-5 rounded-xl border shadow-2xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          {destructive && (
            <div className="flex-shrink-0 p-2 rounded-full" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
          >
            {t('confirm.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: destructive ? '#ef4444' : 'var(--accent)',
              color: '#fff',
            }}
            autoFocus
          >
            {confirmLabel || t('confirm.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
