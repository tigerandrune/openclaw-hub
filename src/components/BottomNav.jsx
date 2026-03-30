import { NavLink, useLocation } from 'react-router-dom';
import { Home, Activity, DollarSign, Server, Settings } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const items = [
  { labelKey: 'nav.home',     icon: Home,       path: '/' },
  { labelKey: 'nav.activity', icon: Activity,   path: '/activity' },
  { labelKey: 'nav.costs',    icon: DollarSign, path: '/costs' },
  { labelKey: 'nav.services', icon: Server,     path: '/services' },
  { labelKey: 'nav.settings', icon: Settings,   path: '/settings' },
];

export default function BottomNav() {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {items.map(({ labelKey, icon: Icon, path }) => {
        const isActive = path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(path);
        return (
          <NavLink
            key={path}
            to={path}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
            style={{
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              textDecoration: 'none',
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: 10 }}>{t(labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
