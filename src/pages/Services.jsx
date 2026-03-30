import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../context/I18nContext';
import { 
  Server, 
  Play, 
  Square, 
  RotateCcw, 
  Cpu,
  Clock,
  Hash,
  AlertCircle,
  Package,
  Zap,
  CheckCircle,
  XCircle,
  Database,
  Brain,
  HardDrive
} from 'lucide-react';

const TABS = [
  { id: 'pm2', labelKey: 'services.pm2', icon: Server },
  { id: 'plugins', labelKey: 'services.plugins', icon: Package },
  { id: 'skills', labelKey: 'services.skills', icon: Zap },
  { id: 'memory', labelKey: 'services.memory', icon: Database },
];

export default function Services() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('pm2');

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          {t('services.title')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Monitor and manage your system services
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 border-b-2 transition-all"
              style={{
                borderColor: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              <Icon size={16} />
              <span className="font-medium">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'pm2' && <PM2Tab />}
        {activeTab === 'plugins' && <PluginsTab />}
        {activeTab === 'skills' && <SkillsTab />}
        {activeTab === 'memory' && <MemoryTab />}
      </div>
    </div>
  );
}

function PM2Tab() {
  const { t } = useI18n();
  const { data, loading, error, refetch } = useApi('/api/services/pm2', 30000); // Auto-refresh every 30s
  const [actionStates, setActionStates] = useState({});

  const handleAction = async (processName, action) => {
    const key = `${processName}-${action}`;
    setActionStates(prev => ({ ...prev, [key]: true }));
    
    try {
      const response = await fetch(`/api/services/pm2/${processName}/${action}`, {
        method: 'POST'
      });
      
      if (response.status === 429) {
        alert('Please wait before performing another action');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Refresh data after action
      setTimeout(refetch, 1000);
    } catch (err) {
      console.error('Action failed:', err);
      alert(`Failed to ${action} ${processName}: ${err.message}`);
    } finally {
      setActionStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const formatMemory = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatUptime = (uptimeMs) => {
    if (!uptimeMs) return '0s';
    // PM2 returns start timestamp in ms, not duration
    const elapsed = uptimeMs > 1e12 ? Date.now() - uptimeMs : uptimeMs;
    const seconds = Math.floor(Math.abs(elapsed) / 1000);
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#22c55e';
      case 'stopped': return '#ef4444';
      case 'errored': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <CheckCircle size={16} />;
      case 'stopped': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Failed to load PM2 processes: {error}
        </p>
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="text-center py-8">
        <Server size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
          {t('services.pm2Unavailable')}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('services.pm2InstallHint')}
        </p>
      </div>
    );
  }

  if (!data.processes?.length) {
    return (
      <div className="text-center py-8">
        <Server size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('services.noProcesses')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.processes.map(process => {
        const isActionPending = actionStates[`${process.name}-start`] || 
                               actionStates[`${process.name}-stop`] || 
                               actionStates[`${process.name}-restart`];
        
        return (
          <div 
            key={process.name} 
            className="p-4 rounded-lg border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <div style={{ color: getStatusColor(process.status) }}>
                    {getStatusIcon(process.status)}
                  </div>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    {process.name}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex items-center gap-1">
                    <Cpu size={12} />
                    <span>{process.cpu}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{t('services.mem')}</span>
                    <span>{formatMemory(process.memory)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{formatUptime(process.uptime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RotateCcw size={12} />
                    <span>{process.restarts || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash size={12} />
                    <span>{process.pid || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {process.status === 'stopped' ? (
                  <button
                    onClick={() => handleAction(process.name, 'start')}
                    disabled={isActionPending}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all hover:bg-opacity-80"
                    style={{ 
                      background: '#22c55e', 
                      color: '#fff',
                      opacity: isActionPending ? 0.6 : 1
                    }}
                  >
                    {actionStates[`${process.name}-start`] ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        {t('services.starting')}
                      </>
                    ) : (
                      <>
                        <Play size={12} />
                        {t('services.start')}
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleAction(process.name, 'restart')}
                      disabled={isActionPending}
                      className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all hover:bg-opacity-80"
                      style={{ 
                        background: '#f97316', 
                        color: '#fff',
                        opacity: isActionPending ? 0.6 : 1
                      }}
                    >
                      {actionStates[`${process.name}-restart`] ? (
                        <>
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          {t('services.restarting')}
                        </>
                      ) : (
                        <>
                          <RotateCcw size={12} />
                          {t('services.restart')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(process.name, 'stop')}
                      disabled={isActionPending}
                      className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all hover:bg-opacity-80"
                      style={{ 
                        background: '#ef4444', 
                        color: '#fff',
                        opacity: isActionPending ? 0.6 : 1
                      }}
                    >
                      {actionStates[`${process.name}-stop`] ? (
                        <>
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          {t('services.stopping')}
                        </>
                      ) : (
                        <>
                          <Square size={12} />
                          {t('services.stop')}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PluginsTab() {
  const { t } = useI18n();
  const { data, loading, error } = useApi('/api/services/plugins');

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Failed to load plugins: {error}
        </p>
      </div>
    );
  }

  const plugins = Array.isArray(data) ? data : data?.plugins || [];
  if (!plugins.length) {
    return (
      <div className="text-center py-8">
        <Package size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('services.noPlugins')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plugins.map(plugin => (
        <div 
          key={plugin.name}
          className="p-4 rounded-lg border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium" style={{ color: 'var(--text)' }}>
              {plugin.name}
            </h3>
            <span 
              className="text-xs px-2 py-1 rounded-full"
              style={{ 
                background: plugin.enabled ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: plugin.enabled ? '#22c55e' : '#ef4444'
              }}
            >
              {plugin.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {plugin.description && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {plugin.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function SkillsTab() {
  const { t } = useI18n();
  const { data, loading, error } = useApi('/api/services/skills');

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Failed to load skills: {error}
        </p>
      </div>
    );
  }

  const skills = Array.isArray(data) ? data : data?.skills || [];
  if (!skills.length) {
    return (
      <div className="text-center py-8">
        <Zap size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('services.noSkills')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {skills.map(skill => (
        <div 
          key={skill.name}
          className="p-4 rounded-lg border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="font-medium mb-2" style={{ color: 'var(--text)' }}>
            {skill.name}
          </h3>
          {skill.description && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {skill.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div 
          key={i}
          className="p-4 rounded-lg border animate-pulse"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ background: 'var(--text-muted)', opacity: 0.3 }}
              />
              <div 
                className="w-24 h-4 rounded"
                style={{ background: 'var(--text-muted)', opacity: 0.3 }}
              />
            </div>
            <div className="flex gap-2">
              <div 
                className="w-16 h-6 rounded"
                style={{ background: 'var(--text-muted)', opacity: 0.3 }}
              />
              <div 
                className="w-16 h-6 rounded"
                style={{ background: 'var(--text-muted)', opacity: 0.3 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
function MemoryTab() {
  const { t } = useI18n();
  const { data, loading } = useApi('/api/discover');

  if (loading && !data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
        ))}
      </div>
    );
  }

  const mem = data?.memoryStatus || {};
  const services = mem.services || [];
  const iconMap = { backend: Brain, plugin: Database, knowledge: Brain };

  return (
    <div className="space-y-3">
      <div
        className="p-4 rounded-xl border flex items-center gap-3"
        style={{
          background: mem.active ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          borderColor: mem.active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
        }}
      >
        <Database size={20} style={{ color: mem.active ? '#22c55e' : '#ef4444' }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {mem.active ? t('memory.active') : t('memory.inactive')}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {mem.active ? t('memory.activeDesc') : t('memory.inactiveDesc')}
          </div>
        </div>
      </div>

      {services.length === 0 && (
        <div className="p-4 rounded-xl border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('memory.noServices')}</p>
        </div>
      )}

      {services.map((svc, i) => {
        const Icon = iconMap[svc.type] || Database;
        const active = svc.status === 'active';
        return (
          <div
            key={i}
            className="p-3 rounded-xl border flex items-center gap-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <Icon size={16} style={{ color: active ? '#22c55e' : 'var(--text-muted)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{svc.name}</div>
              <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{svc.type}</div>
            </div>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: active ? '#22c55e' : 'var(--text-muted)' }}
            />
          </div>
        );
      })}
    </div>
  );
}
