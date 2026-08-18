import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Zap, Users, BarChart2, Settings, Camera, Globe, Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { motion } from 'framer-motion';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Overview',    end: true },
  { to: '/content',    icon: Zap,             label: 'Top Content', end: false },
  { to: '/followers',  icon: Users,           label: 'Followers',   end: false },
  { to: '/demographics', icon: Globe,         label: 'Demographics',end: false },
  { to: '/engagement', icon: BarChart2,       label: 'Engagement',  end: false },
  { to: '/caption',    icon: Sparkles,        label: 'AI Caption',  end: false },
];

export default function Sidebar() {
  const profile = useAppStore(s => s.profile);
  const avatar  = profile?.profile_picture_url;
  const displayName = profile?.name || 'Dashboard';

  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="sidebar"
    >
      <div className="sidebar-brand">
        {avatar ? (
          <img src={avatar} alt="Profile" className="profile-avatar" />
        ) : (
          <div className="icon-avatar">
            <Camera size={22} color="var(--accent-color)" />
          </div>
        )}
        <div className="sidebar-brand-text">{displayName}</div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <Settings />
          Settings
        </NavLink>
      </div>
    </motion.aside>
  );
}
