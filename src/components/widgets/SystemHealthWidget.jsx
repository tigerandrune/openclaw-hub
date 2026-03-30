import { Cpu, MemoryStick, HardDrive, RefreshCw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useI18n } from '../../context/I18nContext';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}

function BarRow({ icon: Icon, label, value, total, percentage, color }) {
  const pct = percentage ?? (total > 0 ? (value / total) * 100 : 0);
  const warn = pct > 80;
  const barColor = warn ? '#ef4444' : color ?? 'var(--accent)';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: warn ? '#ef4444' : 'var(--text)' }}>
            {pct.toFixed(1)}%
          </span>
          {total != null && (
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {formatBytes(value)} / {formatBytes(total)}
            </span>
          )}
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

export default function SystemHealthWidget() {
  const { data, loading, error, refetch } = useApi('/api/system', 30000);
  const { t } = useI18n();

  return (
    <div className="surface p-5 flex flex-col gap-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(var(--accent-rgb), 0.12)' }}>
            <Cpu size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('widget.systemHealth')}</span>
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

      {error && (
        <p className="text-xs" style={{ color: '#ef4444' }}>
          {t('widget.systemHealth.failed')}
        </p>
      )}

      {loading && !data && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 rounded animate-pulse" style={{ background: 'var(--surface2)' }} />
          ))}
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-4">
          <BarRow
            icon={Cpu}
            label={t('widget.systemHealth.cpu')}
            percentage={data.cpu.usage}
            color="var(--accent)"
          />
          <BarRow
            icon={MemoryStick}
            label={t('widget.systemHealth.memory')}
            value={data.memory.used}
            total={data.memory.total}
            percentage={data.memory.percentage}
            color="var(--frost)"
          />
          <BarRow
            icon={HardDrive}
            label={t('widget.systemHealth.disk')}
            value={data.disk.used}
            total={data.disk.total}
            percentage={data.disk.percentage}
            color="#a78bfa"
          />
          {data.cpu.model && (
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {data.cpu.model} · {data.cpu.cores} {t('widget.systemHealth.cores')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
