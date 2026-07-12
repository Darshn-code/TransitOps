import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="empty-state" style={{ minHeight: '60dvh', justifyContent: 'center' }}>
      <div className="empty-glyph" style={{ borderColor: 'var(--brand-red)', color: 'var(--brand-red)' }}>
        <Icon.Shield className="icon-lg" />
      </div>
      <p className="empty-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Access Denied</p>
      <p className="empty-note" style={{ maxWidth: '40ch', marginBottom: '24px', fontSize: '15px' }}>
        You do not have the required permissions to access this page. Please contact your system administrator if you think this is a mistake.
      </p>
      <button className="primary-btn" onClick={() => navigate(-1)}>
        <Icon.Chevron className="icon-xs" style={{ transform: 'rotate(90deg)' }} />
        Go Back
      </button>
    </div>
  );
}
