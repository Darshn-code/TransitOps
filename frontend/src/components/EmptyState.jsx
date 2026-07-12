import React from 'react';
import { Icon } from './Icons';

export default function EmptyState({ title, note }) {
  return (
    <div className="empty-state">
      <div className="empty-glyph">
        <Icon.Route className="icon-lg" />
      </div>
      <p className="empty-title">{title}</p>
      <p className="empty-note">{note}</p>
    </div>
  );
}
