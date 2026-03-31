import { NavLink, useLocation } from 'react-router-dom';
import { Home, Activity, Server, Bell, Settings } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useApi } from '../hooks/useApi';

const items = [
  { id: 'home',     labelKey: 'nav.home',     icon: Home,     path: '/' },
  { id: 'activity', labelKey: 'nav.activity', icon: Activity, path: '/activity' },
  { id: 'services', labelKey: 'nav.services', icon: Server,   path: '/services' },
  { id: 'alerts',   labelKey: 'nav.alerts',   icon: Bell,     path: '/notifications' },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings, path: '/settings' },
];

export default function BottomNav() {
  const { t } = useI18n();
  const location = useLocation();
  const { data: alertData } = useApi('/api/alerts', 60000);
  const alertSeverity = alertData?.summary?.critical > 0 ? 'critical'
    : alertData?.summary?.warning > 0 ? 'warning' : null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {items.map(({ id, labelKey, icon: Icon, path }) => {
        const isActive = path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(path);

        return (
          <NavLink
            key={id}
            to={path}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
            style={{
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              textDecoration: 'none',
              opacity: isActive ? 1 : 0.6,
            }}
          >
            <span className="relative">
              <Icon size={20} />
              {id === 'alerts' && alertSeverity && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{
                    background: alertSeverity === 'critical' ? '#ef4444' : '#f59e0b',
                  }}
                />
              )}
            </span>
            <span className="text-[10px] leading-tight">{t(labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
