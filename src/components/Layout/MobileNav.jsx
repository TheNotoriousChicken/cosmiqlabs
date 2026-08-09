import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Users, Settings } from 'lucide-react';

export default function MobileNav() {
  const navItems = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard, path: '/' },
    { id: 'engagement', label: 'Engage', icon: Activity, path: '/engagement' },
    { id: 'demographics', label: 'Audience', icon: Users, path: '/demographics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} strokeWidth={2.5} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
