import { NavLink, useLocation } from 'react-router-dom';
import { Home, Activity, Layout, Server, Settings } from 'lucide-react';

const items = [
  { label: 'Home',     icon: Home,     path: '/' },
  { label: 'Activity', icon: Activity, path: '/activity' },
  { label: 'Tasks',    icon: Layout,   path: '/kanban' },
  { label: 'Services', icon: Server,   path: '/services' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {items.map(({ label, icon: Icon, path }) => {
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
            <span style={{ fontSize: 10 }}>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
