import React from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from './Icons';
import { useAuth } from '../context/AuthContext';

const PATH_TITLES = {
  '/dashboard': 'Dashboard',
  '/fleet': 'Vehicle Registry',
  '/drivers': 'Drivers & Safety',
  '/trips': 'Trip Dispatcher',
  '/maintenance': 'Maintenance',
  '/fuel': 'Fuel & Expenses',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings & RBAC',
  '/unauthorized': 'Unauthorized',
};

export default function Topbar({ onMenu }) {
  const location = useLocation();
  const { email, role } = useAuth();
  const currentTitle = PATH_TITLES[location.pathname] || 'TransitOps';

  const roleName = role ? role.replace(/_/g, ' ') : '';

  return (
    <header className="topbar">
      <button className="icon-btn only-mobile" onClick={onMenu} aria-label="Open navigation">
        <Icon.Menu className="icon-sm" />
      </button>
      <div className="topbar-crumb">
        <Icon.Pin className="icon-xs" />
        <span>Chennai HQ</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{currentTitle}</span>
        {email && (
          <>
            <span className="crumb-sep" style={{ opacity: 0.3 }}>|</span>
            <span className="cell-sub" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-soft)' }}>
              Logged in as: <strong style={{ color: 'var(--text-ink)' }}>{email}</strong>
              {roleName && <span style={{ textTransform: 'capitalize', marginLeft: '6px', opacity: 0.75 }}>({roleName})</span>}
            </span>
          </>
        )}
      </div>
      <div className="topbar-date">
        <span className="marker-tag">Today — Jul 12, 2026</span>
      </div>
    </header>
  );
}
