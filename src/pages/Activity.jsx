import { useApi } from '../hooks/useApi';
import { useI18n } from '../context/I18nContext';
import { Activity as ActivityIcon, Clock, MessageCircle, User } from 'lucide-react';

export default function Activity() {
  const { t } = useI18n();
  const { data: sessions, loading: sessionsLoading, error: sessionsError } = useApi('/api/activity/sessions?limit=50');
  const { data: summary, loading: summaryLoading } = useApi('/api/activity/summary');

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

  const getAgentColor = (agent) => {
    // Generate a consistent color from agent name — works for any team setup
    if (agent === 'main') return '#D4A853';
    const palette = [
      '#7EB8DA', '#f97316', '#a855f7', '#22c55e', '#ec4899',
      '#eab308', '#ef4444', '#06b6d4', '#8b5cf6', '#14b8a6',
    ];
    let hash = 0;
    const str = String(agent);
    for (const ch of str) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
    return palette[Math.abs(hash) % palette.length];
  };

  const getDateGroup = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffDays = Math.floor((now - time) / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return 'This Week';
    return 'Older';
  };

  const groupedSessions = (sessions?.sessions || []).reduce((groups, session) => {
    const group = getDateGroup(session.timestamp);
    if (!groups[group]) groups[group] = [];
    groups[group].push(session);
    return groups;
  }, {});

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          {t('activity.title')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('activity.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      {summary && !summaryLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title={t('activity.totalSessions')}
            value={summary.totalSessions || 0}
            icon={MessageCircle}
            color="var(--accent)"
          />
          <SummaryCard
            title={t('activity.last24h')}
            value={summary.recentActivity || 0}
            icon={Clock}
            color="#22c55e"
          />
          <SummaryCard
            title={t('activity.agents')}
            value={(summary.agents || []).length}
            icon={User}
            color="#06b6d4"
          />
        </div>
      )}

      {/* Agent Breakdown — only shown when multiple agents exist */}
      {summary?.agents?.length > 1 && (
        <div className="p-6 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            {t('activity.agents')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summary.agents.map(agent => (
              <div key={agent.name} className="text-center">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${getAgentColor(agent.name)}20` }}
                >
                  <span 
                    className="text-sm font-medium capitalize"
                    style={{ color: getAgentColor(agent.name) }}
                  >
                    {agent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  {agent.sessions}
                </div>
                <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {agent.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions Timeline */}
      <div className="p-6 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
          {t('activity.sessions')}
        </h2>
        
        {sessionsLoading ? (
          <SessionsSkeleton />
        ) : sessionsError ? (
          <div className="text-center py-8">
            <ActivityIcon size={48} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Failed to load sessions: {sessionsError}
            </p>
          </div>
        ) : !sessions?.sessions?.length ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('activity.empty')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([group, groupSessions]) => (
              <div key={group}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
                  {group} · {groupSessions.length}
                </h3>
                <div className="space-y-2">
                  {groupSessions.map((session, index) => (
                    <div 
                      key={session.id || index}
                      className="flex items-center gap-4 p-3 rounded-lg transition-all hover:bg-opacity-50"
                      style={{ background: 'var(--surface2)' }}
                    >
                      {/* Agent Badge */}
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${getAgentColor(session.agent)}20` }}
                      >
                        <span 
                          className="text-xs font-bold capitalize"
                          style={{ color: getAgentColor(session.agent) }}
                        >
                          {session.agent?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>

                      {/* Session Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium capitalize" style={{ color: 'var(--text)' }}>
                            {session.agent || 'unknown'}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatFileSize(session.size)}
                          </span>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        <span>{formatTimeAgo(session.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{ background: `${color}20` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {value.toLocaleString()}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div 
          key={i}
          className="flex items-center gap-4 p-3 rounded-lg animate-pulse"
          style={{ background: 'var(--surface2)' }}
        >
          <div 
            className="w-8 h-8 rounded-full flex-shrink-0"
            style={{ background: 'var(--text-muted)', opacity: 0.3 }}
          />
          <div className="flex-1 space-y-1">
            <div 
              className="w-32 h-4 rounded"
              style={{ background: 'var(--text-muted)', opacity: 0.3 }}
            />
            <div 
              className="w-24 h-3 rounded"
              style={{ background: 'var(--text-muted)', opacity: 0.2 }}
            />
          </div>
          <div 
            className="w-16 h-3 rounded flex-shrink-0"
            style={{ background: 'var(--text-muted)', opacity: 0.3 }}
          />
        </div>
      ))}
    </div>
  );
}