import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../context/I18nContext';
import { DollarSign, TrendingUp, Cpu, Clock, BarChart3, Zap } from 'lucide-react';

export default function Costs() {
  const { t } = useI18n();
  const { data: summary, loading: summaryLoading } = useApi('/api/costs/summary');
  const { data: daily, loading: dailyLoading } = useApi('/api/costs/daily?days=14');
  const { data: byAgent } = useApi('/api/costs/by-agent');
  const { data: byModel } = useApi('/api/costs/by-model');
  const [activeTab, setActiveTab] = useState('agents');

  const formatTokens = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const formatCost = (n) => {
    if (!n) return '$0.00';
    if (n < 0.01) return `$${n.toFixed(4)}`;
    return `$${n.toFixed(2)}`;
  };

  const maxDaily = daily?.length
    ? Math.max(...daily.map(d => (d.input || 0) + (d.output || 0)), 1)
    : 1;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          {t('costs.title')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('costs.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <SummaryCardsSkeleton />
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title={t('costs.today')}
            tokens={formatTokens(summary.today?.tokens)}
            cost={formatCost(summary.today?.cost)}
            sessions={summary.today?.sessions || 0}
            icon={Clock}
            color="var(--accent)"
            t={t}
          />
          <SummaryCard
            title={t('costs.thisWeek')}
            tokens={formatTokens(summary.thisWeek?.tokens)}
            cost={formatCost(summary.thisWeek?.cost)}
            sessions={summary.thisWeek?.sessions || 0}
            icon={TrendingUp}
            color="#22c55e"
            t={t}
          />
          <SummaryCard
            title={t('costs.thisMonth')}
            tokens={formatTokens(summary.thisMonth?.tokens)}
            cost={formatCost(summary.thisMonth?.cost)}
            sessions={summary.thisMonth?.sessions || 0}
            icon={DollarSign}
            color="#a855f7"
            t={t}
          />
          <SummaryCard
            title={t('costs.mostActive')}
            tokens={summary.mostActiveModel || '—'}
            icon={Cpu}
            color="#06b6d4"
            isModel
            t={t}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <DollarSign size={48} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>{t('costs.noData')}</p>
        </div>
      )}

      {/* Daily Usage Chart */}
      {daily?.length > 0 && (
        <div className="p-6 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            {t('costs.daily')}
          </h2>
          <div className="flex items-end gap-1.5" style={{ height: '180px' }}>
            {daily.map((day, i) => {
              const inputH = ((day.input || 0) / maxDaily) * 100;
              const outputH = ((day.output || 0) / maxDaily) * 100;
              const date = new Date(day.date);
              const label = `${date.getDate()}/${date.getMonth() + 1}`;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative" style={{ minWidth: 0 }}>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg" style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                      <div className="font-medium mb-1">{day.date}</div>
                      <div>{t('costs.inputTokens')}: {formatTokens(day.input)}</div>
                      <div>{t('costs.outputTokens')}: {formatTokens(day.output)}</div>
                      {day.cost > 0 && <div>{t('costs.cost')}: {formatCost(day.cost)}</div>}
                    </div>
                  </div>
                  {/* Bars */}
                  <div className="w-full flex flex-col gap-0.5" style={{ height: '150px', justifyContent: 'flex-end' }}>
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{ height: `${outputH}%`, background: 'var(--accent)', opacity: 0.9, minHeight: outputH > 0 ? '2px' : 0 }}
                    />
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{ height: `${inputH}%`, background: 'var(--accent)', opacity: 0.4, minHeight: inputH > 0 ? '2px' : 0 }}
                    />
                  </div>
                  <span className="text-[10px] mt-1 truncate w-full text-center" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'var(--accent)', opacity: 0.9 }} />
              {t('costs.outputTokens')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'var(--accent)', opacity: 0.4 }} />
              {t('costs.inputTokens')}
            </span>
          </div>
        </div>
      )}

      {/* Breakdown Tabs */}
      {(byAgent?.length > 0 || byModel?.length > 0) && (
        <div className="p-6 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex gap-4 mb-4">
            <TabButton active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} icon={Zap}>
              {t('costs.byAgent')}
            </TabButton>
            <TabButton active={activeTab === 'models'} onClick={() => setActiveTab('models')} icon={Cpu}>
              {t('costs.byModel')}
            </TabButton>
          </div>

          {activeTab === 'agents' && byAgent?.length > 0 && (
            <BreakdownTable
              rows={byAgent}
              columns={[
                { key: 'agent', label: 'Agent', render: (v) => <span className="capitalize font-medium">{v}</span> },
                { key: 'tokens', label: t('costs.totalTokens'), render: formatTokens },
                { key: 'cost', label: t('costs.cost'), render: formatCost },
                { key: 'sessions', label: t('costs.sessions'), render: (v) => v },
              ]}
            />
          )}

          {activeTab === 'models' && byModel?.length > 0 && (
            <BreakdownTable
              rows={byModel}
              columns={[
                { key: 'model', label: 'Model', render: (v) => <span className="font-mono text-xs">{v}</span> },
                { key: 'tokens', label: t('costs.totalTokens'), render: formatTokens },
                { key: 'cost', label: t('costs.cost'), render: formatCost },
                { key: 'percentage', label: t('costs.percentage'), render: (v) => `${v}%` },
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, tokens, cost, sessions, icon: Icon, color, isModel, t }) {
  return (
    <div className="p-4 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{title}</span>
      </div>
      {isModel ? (
        <div className="text-lg font-mono font-bold truncate" style={{ color: 'var(--text)' }}>
          {tokens}
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {tokens} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{t('costs.tokens')}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{cost}</span>
            <span>•</span>
            <span>{sessions} {t('costs.sessions').toLowerCase()}</span>
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#000' : 'var(--text-muted)',
      }}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

function BreakdownTable({ rows, columns }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="text-left py-2 px-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
              {columns.map(col => (
                <td key={col.key} className="py-2.5 px-3" style={{ color: 'var(--text)' }}>
                  {col.render(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-4 rounded-xl border animate-pulse" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg" style={{ background: 'var(--text-muted)', opacity: 0.2 }} />
            <div className="w-20 h-3 rounded" style={{ background: 'var(--text-muted)', opacity: 0.2 }} />
          </div>
          <div className="w-24 h-6 rounded" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
          <div className="w-16 h-3 rounded mt-2" style={{ background: 'var(--text-muted)', opacity: 0.2 }} />
        </div>
      ))}
    </div>
  );
}
