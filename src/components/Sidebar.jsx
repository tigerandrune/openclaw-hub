import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Activity, DollarSign, Server,
  Bell, Settings, ChevronLeft, ChevronRight,
  Terminal,
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useI18n } from '../context/I18nContext';

const navItems = [
  { id: 'home',          labelKey: 'nav.home',     icon: Home,        path: '/' },
  { id: 'activity',      labelKey: 'nav.activity', icon: Activity,    path: '/activity' },
  { id: 'costs',         labelKey: 'nav.costs',    icon: DollarSign,  path: '/costs' },
  { id: 'services',      labelKey: 'nav.services', icon: Server,      path: '/services' },
  { id: 'notifications', labelKey: 'nav.alerts',   icon: Bell,        path: '/notifications' },
];

export default function Sidebar() {
  const { config } = useConfig();
  const { t } = useI18n();
  const location = useLocation();
  const prefersCompact = config?.sidebarStyle === 'compact';
  const [collapsed, setCollapsed] = useState(prefersCompact);

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
              <Icon size={18} className="flex-shrink-0" />
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

        {!collapsed && config?.name && (
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
