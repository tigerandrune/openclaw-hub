import { Activity, Clock, User } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useApi } from '../../hooks/useApi';

export default function RecentActivityWidget() {
  const { t } = useI18n();
  const { data, loading, error } = useApi('/api/activity/sessions?limit=5');

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) {
      return `${days}d ${t('activity.ago')}`;
    } else if (hours > 0) {
      return `${hours}h ${t('activity.ago')}`;
    } else if (minutes > 0) {
      return `${minutes}m ${t('activity.ago')}`;
    } else {
      return `Just now`;
    }
  };

  const getChannelBadgeColor = (channel) => {
    // Known brand colors for common channels, hash-based for anything else
    const known = { discord: '#5865F2', telegram: '#0088cc', whatsapp: '#25D366', signal: '#3A76F0' };
    if (known[channel]) return known[channel];
    const palette = ['#6b7280', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899'];
    let hash = 0;
    const str = String(channel);
    for (const ch of str) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
    return palette[Math.abs(hash) % palette.length];
  };

  return (
    <div className="widget-card surface p-5 flex flex-col gap-4 animate-slide-up">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(var(--accent-rgb), 0.12)' }}>
          <Activity size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('widget.recentActivity')}</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div 
                className="w-6 h-6 rounded-full"
                style={{ background: 'var(--text-muted)', opacity: 0.3 }}
              />
              <div className="flex-1">
                <div 
                  className="w-20 h-3 rounded mb-1"
                  style={{ background: 'var(--text-muted)', opacity: 0.3 }}
                />
                <div 
                  className="w-16 h-2 rounded"
                  style={{ background: 'var(--text-muted)', opacity: 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <Clock size={18} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Failed to load activity
          </p>
        </div>
      ) : !data?.sessions?.length ? (
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
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.sessions.map((session, index) => (
            <div key={session.id || index} className="flex items-center gap-3">
              {/* Channel Badge */}
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${getChannelBadgeColor(session.channel)}20` }}
              >
                <span 
                  className="text-xs font-medium"
                  style={{ color: getChannelBadgeColor(session.channel) }}
                >
                  {session.channel?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>

              {/* Session Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                    {session.agent || 'Unknown'}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatTimeAgo(session.timestamp || session.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
