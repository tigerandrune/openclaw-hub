import { Activity, Clock } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

// Phase 1 stub — real data comes from session files in Phase 2
export default function RecentActivityWidget() {
  const { t } = useI18n();

  return (
    <div className="surface p-5 flex flex-col gap-4 animate-slide-up">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(var(--accent-rgb), 0.12)' }}>
          <Activity size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('widget.recentActivity')}</span>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 py-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'var(--surface2)' }}
        >
          <Clock size={18} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {t('widget.recentActivity.empty')}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            {t('widget.recentActivity.phase')}
          </p>
        </div>
      </div>
    </div>
  );
}
