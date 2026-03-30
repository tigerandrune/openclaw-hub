import { Zap, RefreshCw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useI18n } from '../../context/I18nContext';

function ModelBadge({ model }) {
  if (!model) return null;
  const short = model.split('/').pop()?.replace(/-\d{8}$/, '') ?? model;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-mono"
      style={{ background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 11 }}
    >
      {short}
    </span>
  );
}

export default function GatewayWidget() {
  const { data, loading, error, refetch } = useApi('/api/gateway', 60000);
  const { t } = useI18n();

  const online = data?.online ?? false;

  return (
    <div className="surface p-5 flex flex-col gap-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{ background: online ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)' }}
          >
            <Zap size={14} style={{ color: online ? '#22c55e' : '#ef4444' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('widget.gateway')}</span>
        </div>
        <button
          onClick={refetch}
          className="p-1.5 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
          title={t('common.refresh')}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !data && (
        <div className="h-12 rounded animate-pulse" style={{ background: 'var(--surface2)' }} />
      )}

      {error && !data && (
        <p className="text-xs" style={{ color: '#ef4444' }}>{t('widget.gateway.error')}</p>
      )}

      {data && (
        <div className="flex flex-col gap-3">
          {/* Status row */}
          <div className="flex items-center gap-3">
            <div className={online ? 'dot-online' : 'dot-offline'} />
            <span
              className="text-sm font-medium"
              style={{ color: online ? '#22c55e' : '#ef4444' }}
            >
              {online ? t('widget.gateway.online') : t('widget.gateway.offline')}
            </span>
          </div>

          {/* Model */}
          {data.model && (
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('widget.gateway.model')}</span>
              <ModelBadge model={data.model} />
            </div>
          )}

          {/* Channels */}
          {data.channels?.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('widget.gateway.channels')}</span>
              <div className="flex gap-1.5">
                {data.channels.map(ch => (
                  <span
                    key={ch}
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', fontSize: 11 }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Last seen */}
          {data.lastSeen && (
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Last seen</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {new Date(data.lastSeen).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
