import { useApi } from '../../hooks/useApi';
import { useI18n } from '../../context/I18nContext';
import { Radio, MessageSquare, Send, Hash, Phone, Wifi } from 'lucide-react';

const CHANNEL_ICONS = {
  discord: Hash,
  telegram: Send,
  whatsapp: Phone,
  signal: Wifi,
};

export default function ChannelsWidget() {
  const { t } = useI18n();
  const { data, loading } = useApi('/api/discover', { refreshInterval: 30000 });

  const channels = data?.channels || [];

  return (
    <div className="widget-card p-4 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Radio size={16} style={{ color: 'var(--accent)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {t('channels.title')}
        </h3>
      </div>

      {loading && !data ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'var(--surface2)' }} />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <p className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
          {t('channels.none')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {channels.map(ch => {
            const Icon = CHANNEL_ICONS[ch.id] || MessageSquare;
            return (
              <div
                key={ch.id}
                className="flex items-center gap-2.5 p-2 rounded-lg"
                style={{ background: 'var(--background)' }}
              >
                <Icon size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-medium flex-1" style={{ color: 'var(--text)' }}>
                  {ch.name}
                </span>
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: ch.enabled ? '#22c55e' : 'var(--text-muted)' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: ch.enabled ? '#22c55e' : 'var(--text-muted)' }}
                  />
                  {ch.enabled ? t('channels.connected') : t('channels.disabled')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
