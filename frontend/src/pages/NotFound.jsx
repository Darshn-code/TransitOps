import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="empty-state" style={{ minHeight: '60dvh', justifyContent: 'center' }}>
      <div className="empty-glyph" style={{ borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)' }}>
        <Icon.Alert className="icon-lg" />
      </div>
      <p className="empty-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Page Not Found</p>
      <p className="empty-note" style={{ maxWidth: '40ch', marginBottom: '24px', fontSize: '15px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <button className="primary-btn" onClick={() => navigate('/dashboard')}>
        <Icon.Dash className="icon-xs" />
        Dashboard Home
      </button>
    </div>
  );
}
