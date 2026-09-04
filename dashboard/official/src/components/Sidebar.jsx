import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, AlertCircle, Settings } from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Applications Queue', path: '/applications', icon: FileText },
    { name: 'Grievances', path: '/grievances', icon: AlertCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div>
        <h1 className="text-2xl" style={{ color: 'var(--color-accent)', marginBottom: '0.5rem', fontWeight: 700 }}>
          MahaSetu
        </h1>
        <div className="text-sm text-muted">Official Command Center</div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '2rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <div className="text-sm text-muted">Logged in as</div>
        <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>Official Delegate</div>
      </div>
    </aside>
  );
};
