import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Activity, DollarSign, Server,
  Bell, Settings, ChevronLeft, ChevronRight,
  Terminal, ChevronDown, Plus, Users,
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useI18n } from '../context/I18nContext';
import { useApi } from '../hooks/useApi';

const navItems = [
  { id: 'home',          labelKey: 'nav.home',     icon: Home,        path: '/' },
  { id: 'activity',      labelKey: 'nav.activity', icon: Activity,    path: '/activity' },
  { id: 'costs',         labelKey: 'nav.costs',    icon: DollarSign,  path: '/costs' },
  { id: 'services',      labelKey: 'nav.services', icon: Server,      path: '/services' },
  { id: 'notifications', labelKey: 'nav.alerts',   icon: Bell,        path: '/notifications' },
];

export default function Sidebar() {
  const { config, activeProfile, switchProfile } = useConfig();
  const { t } = useI18n();
  const location = useLocation();
  const { data: alertData } = useApi('/api/alerts', 60000);
  const alertSeverity = alertData?.summary?.critical > 0 ? 'critical' : alertData?.summary?.warning > 0 ? 'warning' : null;
  const prefersCompact = config?.sidebarStyle === 'compact';
  const [collapsed, setCollapsed] = useState(prefersCompact);
  const [profiles, setProfiles] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileMenuOpen]);

  useEffect(() => {
    fetch('/api/profiles')
      .then(r => r.json())
      .then(data => setProfiles(data.profiles || []))
      .catch(() => {});
  }, [activeProfile]);

  const enabledPages = config?.enabledPages ?? navItems.map(n => n.id);
  const visible = navItems.filter(n => enabledPages.includes(n.id));

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? 60 : 220,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        minHeight: '100vh',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-3 py-4 border-b"
        style={{ borderColor: 'var(--border)', minHeight: 64 }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0 rounded-lg"
          style={{ width: 36, height: 36, background: 'rgba(var(--accent-rgb), 0.15)' }}
        >
          <Terminal size={18} style={{ color: 'var(--accent)' }} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text)' }}>
              OpenClaw
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Hub</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-1 overflow-y-auto">
        {visible.map(({ id, labelKey, icon: Icon, path }) => {
          const label = t(labelKey);
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          return (
            <NavLink
              key={id}
              to={path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
              style={collapsed ? { justifyContent: 'center', padding: '8px 0' } : {}}
            >
              <span className="relative flex-shrink-0">
                <Icon size={18} />
                {id === 'notifications' && alertSeverity && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
                    style={{
                      background: alertSeverity === 'critical' ? '#ef4444' : '#f59e0b',
                      borderColor: 'var(--surface)',
                    }}
                  />
                )}
              </span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-2 py-3 border-t flex flex-col gap-1"
        style={{ borderColor: 'var(--border)' }}
      >
        <NavLink
          to="/settings"
          className={`sidebar-item ${location.pathname === '/settings' ? 'active' : ''}`}
          title={collapsed ? t('nav.settings') : undefined}
          style={collapsed ? { justifyContent: 'center', padding: '8px 0' } : {}}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>{t('nav.settings')}</span>}
        </NavLink>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="sidebar-item w-full border-0 bg-transparent cursor-pointer"
          style={collapsed ? { justifyContent: 'center', padding: '8px 0' } : {}}
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <><ChevronLeft size={16} /><span className="text-xs">{t('sidebar.collapse')}</span></>
          }
        </button>

        {/* Profile switcher — only when 2+ profiles exist */}
        {profiles.length > 1 && (
          <div className="relative mt-1" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(o => !o)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
              style={{ background: profileMenuOpen ? 'var(--surface2)' : 'transparent' }}
              title={collapsed ? (config?.name || t('profiles.switch')) : undefined}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                {(config?.name || 'U')[0].toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <span className="text-xs font-medium truncate flex-1 text-left" style={{ color: 'var(--text)' }}>
                    {config?.name || activeProfile}
                  </span>
                  <ChevronDown size={12} style={{
                    color: 'var(--text-muted)',
                    transform: profileMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }} />
                </>
              )}
            </button>

            {profileMenuOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border overflow-hidden shadow-lg z-50"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { switchProfile(p.id); setProfileMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left border-0 cursor-pointer transition-colors"
                    style={{
                      background: p.id === activeProfile ? 'var(--surface2)' : 'transparent',
                      color: 'var(--text)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = p.id === activeProfile ? 'var(--surface2)' : 'transparent'}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: p.id === activeProfile ? 'var(--accent)' : 'var(--border)',
                        color: p.id === activeProfile ? '#000' : 'var(--text-muted)',
                      }}
                    >
                      {p.avatar || p.name[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-medium truncate">{p.name}</span>
                    {p.id === activeProfile && (
                      <span className="ml-auto text-xs" style={{ color: 'var(--accent)' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Single-user avatar (no switcher needed) */}
        {profiles.length <= 1 && !collapsed && config?.name && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mt-1"
            style={{ background: 'var(--surface2)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              {config.name[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
              {config.name}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
