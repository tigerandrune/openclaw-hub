import { useApi } from '../hooks/useApi';
import { useI18n } from '../context/I18nContext';
import {
  AlertTriangle, CheckCircle, XCircle, Info,
  Shield, Cpu, HardDrive, MemoryStick, Radio, RefreshCw,
} from 'lucide-react';

export default function Alerts() {
  const { t } = useI18n();
  const { data, loading, error, refetch } = useApi('/api/alerts');

  const severityConfig = {
    critical: { color: '#ef4444', bg: '#ef444420', icon: XCircle, label: t('alerts.critical') },
    warning:  { color: '#f59e0b', bg: '#f59e0b20', icon: AlertTriangle, label: t('alerts.warning') },
    info:     { color: '#3b82f6', bg: '#3b82f620', icon: Info, label: t('alerts.info') },
    healthy:  { color: '#22c55e', bg: '#22c55e20', icon: CheckCircle, label: t('alerts.healthy') },
  };

  const getCheckIcon = (name) => {
    const lower = name?.toLowerCase() || '';
    if (lower.includes('cpu')) return Cpu;
    if (lower.includes('memory') || lower.includes('ram')) return MemoryStick;
    if (lower.includes('disk')) return HardDrive;
    if (lower.includes('gateway')) return Radio;
    return Shield;
  };

  const hasAlerts = data?.alerts?.length > 0;
  const hasCritical = data?.summary?.critical > 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            {t('alerts.title')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('alerts.subtitle')}
          </p>
        </div>
        <button
          onClick={refetch}
          className="p-2 rounded-lg transition-all hover:scale-105"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          title="Refresh"
        >
          <RefreshCw size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {loading ? (
        <AlertsSkeleton />
      ) : error ? (
        <div className="p-6 rounded-xl border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <XCircle size={48} className="mx-auto mb-3 opacity-50" style={{ color: '#ef4444' }} />
          <p style={{ color: 'var(--text-muted)' }}>Failed to load alerts: {error}</p>
        </div>
      ) : (
        <>
          {/* Status Banner */}
          <div
            className="p-5 rounded-xl border flex items-center gap-4"
            style={{
              background: hasAlerts
                ? hasCritical ? '#ef444410' : '#f59e0b10'
                : '#22c55e10',
              borderColor: hasAlerts
                ? hasCritical ? '#ef444440' : '#f59e0b40'
                : '#22c55e40',
            }}
          >
            {hasAlerts ? (
              hasCritical ? (
                <XCircle size={32} style={{ color: '#ef4444' }} />
              ) : (
                <AlertTriangle size={32} style={{ color: '#f59e0b' }} />
              )
            ) : (
              <CheckCircle size={32} style={{ color: '#22c55e' }} />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {hasAlerts
                  ? t('alerts.count', { count: data.alerts.length })
                  : t('alerts.allClear')
                }
              </h2>
              {!hasAlerts && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {t('alerts.allClearDesc')}
                </p>
              )}
            </div>
            {/* Summary badges */}
            {data?.summary && (
              <div className="flex gap-2">
                {data.summary.critical > 0 && (
                  <Badge color="#ef4444" count={data.summary.critical} label={t('alerts.critical')} />
                )}
                {data.summary.warning > 0 && (
                  <Badge color="#f59e0b" count={data.summary.warning} label={t('alerts.warning')} />
                )}
                <Badge color="#22c55e" count={data.summary.healthy} label={t('alerts.healthy')} />
              </div>
            )}
          </div>

          {/* Active Alerts */}
          {hasAlerts && (
            <div className="p-6 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                {t('alerts.activeAlerts')}
              </h2>
              <div className="space-y-3">
                {data.alerts.map((alert, i) => {
                  const sev = severityConfig[alert.severity] || severityConfig.info;
                  const SevIcon = sev.icon;
                  return (
                    <div
                      key={alert.id || i}
                      className="flex items-start gap-4 p-4 rounded-lg"
                      style={{ background: sev.bg }}
                    >
                      <SevIcon size={20} style={{ color: sev.color, flexShrink: 0, marginTop: 2 }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium" style={{ color: 'var(--text)' }}>
                            {t(alert.title)}
                          </span>
                          <span
                            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                            style={{ background: sev.color, color: '#fff' }}
                          >
                            {sev.label}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {alert.description || (alert.component && alert.value != null
                            ? alert.category === 'services'
                              ? t('alerts.processInfo', { component: alert.component, value: alert.value })
                              : t('alerts.usageAt', { component: alert.component.toUpperCase(), value: alert.value })
                            : alert.component
                              ? t('alerts.componentIssue', { component: alert.component })
                              : ''
                          )}
                        </p>
                      </div>
                      {alert.value !== undefined && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold" style={{ color: sev.color }}>
                            {typeof alert.value === 'number'
                              ? alert.category === 'services' ? alert.value : `${alert.value}%`
                              : alert.value}
                          </div>
                          {alert.threshold && (
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {t('alerts.threshold')}: {alert.threshold}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* System Overview Grid */}
          {data?.checks?.length > 0 && (
            <div className="p-6 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                {t('alerts.systemOverview')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {data.checks.map((check, i) => {
                  const sev = severityConfig[check.status] || severityConfig.healthy;
                  const CheckIcon = getCheckIcon(check.name);
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-lg border text-center transition-all"
                      style={{ background: sev.bg, borderColor: `${sev.color}30` }}
                    >
                      <CheckIcon size={20} className="mx-auto mb-2" style={{ color: sev.color }} />
                      <div className="text-xs font-medium truncate mb-1" style={{ color: 'var(--text)' }}>
                        {check.name}
                      </div>
                      <div className="text-sm font-bold" style={{ color: sev.color }}>
                        {check.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Badge({ color, count, label }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: `${color}20`, color }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {count} {label}
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl border animate-pulse" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.2 }} />
          <div className="flex-1 space-y-2">
            <div className="w-48 h-5 rounded" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
            <div className="w-64 h-3 rounded" style={{ background: 'var(--text-muted)', opacity: 0.2 }} />
          </div>
        </div>
      </div>
      <div className="p-6 rounded-xl border animate-pulse" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="w-32 h-5 rounded mb-4" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
              <div className="w-5 h-5 rounded-full mx-auto mb-2" style={{ background: 'var(--text-muted)', opacity: 0.2 }} />
              <div className="w-12 h-3 rounded mx-auto mb-1" style={{ background: 'var(--text-muted)', opacity: 0.2 }} />
              <div className="w-8 h-4 rounded mx-auto" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
