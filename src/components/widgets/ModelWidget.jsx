import { useApi } from '../../hooks/useApi';
import { useI18n } from '../../context/I18nContext';
import { Cpu, ArrowRight } from 'lucide-react';

function formatModelName(model) {
  if (!model) return '—';
  // "anthropic/claude-sonnet-4-20250514" → "Claude Sonnet 4"
  const name = model.split('/').pop() || model;
  return name
    .replace(/-\d{8,}$/, '') // remove date suffix
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function ModelWidget() {
  const { t } = useI18n();
  const { data, loading } = useApi('/api/discover', { refreshInterval: 30000 });

  const modelInfo = data?.modelInfo || {};
  const primary = modelInfo.primary;
  const fallbacks = modelInfo.fallbacks || [];

  return (
    <div className="widget-card p-4 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={16} style={{ color: 'var(--accent)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {t('model.title')}
        </h3>
      </div>

      {loading && !data ? (
        <div className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--surface2)' }} />
      ) : !primary ? (
        <p className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
          {t('model.none')}
        </p>
      ) : (
        <div className="space-y-3">
          {/* Primary model */}
          <div className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              {t('model.primary')}
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              {formatModelName(primary)}
            </div>
            <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
              {primary}
            </div>
          </div>

          {/* Fallbacks */}
          {fallbacks.length > 0 && (
            <div>
              <div className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {t('model.fallbacks')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {fallbacks.map((fb, i) => (
                  <span
                    key={fb}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                    style={{ background: 'var(--background)', color: 'var(--text-muted)' }}
                  >
                    {i > 0 && <ArrowRight size={10} style={{ color: 'var(--border)' }} />}
                    {formatModelName(fb)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
