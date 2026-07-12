import React, { useEffect } from 'react';
import { Icon } from './Icons';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => {
      onClose();
    }, 3200);
    return () => clearTimeout(t);
  }, [message, onClose]);

  return (
    <div className="toast">
      <Icon.Check className="icon-xs" />
      <span>{message}</span>
    </div>
  );
}
