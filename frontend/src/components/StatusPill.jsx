import React from 'react';

const STATUS_COLORS = {
  "available": { fg: "#215B3C", bg: "#DCEBE0" },
  "Available": { fg: "#215B3C", bg: "#DCEBE0" },
  
  "on_trip": { fg: "#8A4B00", bg: "#FBE4BC" },
  "On Trip": { fg: "#8A4B00", bg: "#FBE4BC" },
  "Active": { fg: "#8A4B00", bg: "#FBE4BC" },
  "active": { fg: "#8A4B00", bg: "#FBE4BC" },
  
  "in_shop": { fg: "#9C1E16", bg: "#FAD9D6" },
  "In Shop": { fg: "#9C1E16", bg: "#FAD9D6" },
  
  "retired": { fg: "#5C5346", bg: "#E4DACB" },
  "Retired": { fg: "#5C5346", bg: "#E4DACB" },
  "off_duty": { fg: "#5C5346", bg: "#E4DACB" },
  "Off Duty": { fg: "#5C5346", bg: "#E4DACB" },
  
  "suspended": { fg: "#9C1E16", bg: "#FAD9D6" },
  "Suspended": { fg: "#9C1E16", bg: "#FAD9D6" },
  
  "pending": { fg: "#8A4B00", bg: "#FBE4BC" },
  "Pending": { fg: "#8A4B00", bg: "#FBE4BC" },
  "Delayed": { fg: "#9C1E16", bg: "#FAD9D6" },
  "delayed": { fg: "#9C1E16", bg: "#FAD9D6" },
  
  "completed": { fg: "#215B3C", bg: "#DCEBE0" },
  "Completed": { fg: "#215B3C", bg: "#DCEBE0" },
  
  "cancelled": { fg: "#9C1E16", bg: "#FAD9D6" },
  "Cancelled": { fg: "#9C1E16", bg: "#FAD9D6" },
  
  "closed": { fg: "#215B3C", bg: "#DCEBE0" },
  "Closed": { fg: "#215B3C", bg: "#DCEBE0" },
  
  "paid": { fg: "#215B3C", bg: "#DCEBE0" },
  "Paid": { fg: "#215B3C", bg: "#DCEBE0" },
};

export default function StatusPill({ status }) {
  const displayStatus = status
    ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
    : '—';
    
  const c = STATUS_COLORS[status] || { fg: "#5C5346", bg: "#E4DACB" };
  return (
    <span className="pill" style={{ color: c.fg, background: c.bg }}>
      <span className="pill-dot" style={{ background: c.fg }} />
      {displayStatus}
    </span>
  );
}
export { STATUS_COLORS };
