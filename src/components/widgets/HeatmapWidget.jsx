import { useApi } from '../../hooks/useApi';
import { useI18n } from '../../context/I18nContext';
import { Flame } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getIntensity(count, max) {
  if (!count || !max) return 0;
  return Math.ceil((count / max) * 4); // 0-4 levels
}

export default function HeatmapWidget() {
  const { t } = useI18n();
  const { data, loading } = useApi('/api/activity/heatmap?weeks=4');

  const grid = data?.grid || Array.from({ length: 7 }, () => Array(24).fill(0));
  const max = Math.max(1, ...grid.flat());

  const dayKeys = [
    'heatmap.sun', 'heatmap.mon', 'heatmap.tue', 'heatmap.wed',
    'heatmap.thu', 'heatmap.fri', 'heatmap.sat',
  ];

  return (
    <div className="widget-card p-4 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {t('heatmap.title')}
          </h3>
        </div>
        {data?.total != null && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {data.total} {t('heatmap.sessions')}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(24, 1fr)', gap: 2, minWidth: 400 }}>
            {/* Hour labels */}
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={`h-${h}`}
                className="text-center"
                style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: '14px' }}
              >
                {h % 6 === 0 ? `${h}` : ''}
              </div>
            ))}

            {/* Grid rows */}
            {grid.map((hours, dayIdx) => (
              <div key={dayIdx} style={{ display: 'contents' }}>
                <div
                  className="flex items-center pr-1"
                  style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                >
                  {t(dayKeys[dayIdx])}
                </div>
                {hours.map((count, hourIdx) => {
                  const level = getIntensity(count, max);
                  return (
                    <div
                      key={hourIdx}
                      className="rounded-sm heatmap-cell"
                      data-level={level}
                      title={`${t(dayKeys[dayIdx])} ${hourIdx}:00 — ${count} ${t('heatmap.sessions')}`}
                      style={{
                        aspectRatio: '1',
                        minWidth: 10,
                        minHeight: 10,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-2">
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{t('heatmap.less')}</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="rounded-sm heatmap-cell"
                data-level={level}
                style={{ width: 10, height: 10 }}
              />
            ))}
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{t('heatmap.more')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
