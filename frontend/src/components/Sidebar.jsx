import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { key: "dashboard", path: "/dashboard", label: "Dashboard", icon: Icon.Dash, module: "dashboard" },
      { key: "registry", path: "/fleet", label: "Vehicle Registry", icon: Icon.Truck, module: "fleet" },
      { key: "drivers", path: "/drivers", label: "Drivers & Safety", icon: Icon.IdCard, module: "drivers" },
    ]
  },
  {
    label: "Management",
    items: [
      { key: "dispatcher", path: "/trips", label: "Trip Dispatcher", icon: Icon.Route, module: "trips" },
      { key: "maintenance", path: "/maintenance", label: "Maintenance", icon: Icon.Wrench, module: "maintenance" },
      { key: "fuel", path: "/fuel", label: "Fuel & Expenses", icon: Icon.Gauge, module: "fuel" },
    ]
  },
  {
    label: "Analytics",
    items: [
      { key: "reports", path: "/reports", label: "Reports & Analytics", icon: Icon.Gauge, module: "reports" },
      { key: "settings", path: "/settings", label: "Settings & RBAC", icon: Icon.Shield, module: "settings" },
    ]
  }
];

export default function Sidebar({ open, onCloseMobile }) {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderGroup = (group) => {
    // Filter items in the group based on user role permissions
    const visibleItems = group.items.filter(item => can(role, item.module, 'view'));

    if (visibleItems.length === 0) return null;

    return (
      <React.Fragment key={group.label}>
        <div 
          className="nav-group-label" 
          style={{ 
            color: 'rgba(240,228,211,0.4)', 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.1em', 
            textTransform: 'uppercase', 
            margin: group.label === "Operations" ? '14px 6px 6px' : '20px 6px 6px' 
          }}
        >
          {group.label}
        </div>
        <nav className="nav">
          {visibleItems.map(item => {
            const IconComp = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) => "nav-item" + (isActive ? " is-active" : "")}
                onClick={onCloseMobile}
              >
                <IconComp className="icon-sm" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      {open && <div className="sidebar-veil" onClick={onCloseMobile} />}
      <aside className={"sidebar" + (open ? " is-open" : "")}>
        <div className="brand">
          <span className="brand-mark">FL</span>
          <div className="brand-text">
            <span className="brand-name">Fleetstamp</span>
            <span className="brand-sub">Operations console</span>
          </div>
        </div>
        
        {NAV_GROUPS.map(renderGroup)}
        
        <div className="sidebar-foot" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {role && (
            <button 
              className="nav-item" 
              onClick={handleLogout} 
              style={{ background: 'rgba(238,58,46,0.1)', color: '#FF6B6B', border: '1.5px solid rgba(238,58,46,0.2)' }}
            >
              <Icon.X className="icon-sm" />
              <span>Sign Out</span>
            </button>
          )}
          <div className="sidebar-stamp">
            <Icon.Shield className="icon-sm" />
            <div>
              <p>Safety first</p>
              <span>Compliance gate active on every dispatch</span>
            </div>
          </div>
        </div>
      </aside>
    </React.Fragment>
  );
}
