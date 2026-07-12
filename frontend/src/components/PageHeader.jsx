import React from 'react';

export default function PageHeader({ eyebrow, title, note, action }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {note && <p>{note}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
