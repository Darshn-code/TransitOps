import React, { useEffect, useState } from 'react';

const STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];
const COLORS = {
  Available: 'var(--green)',
  'On Trip': 'var(--brand-red)',
  'In Shop': 'var(--accent-orange)',
  Retired: 'var(--ink-faint)',
};

export default function VehicleStatusChart({ vehicles = [] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const counts = STATUSES.map(s => vehicles.filter(v => v.status === s).length);
  const max = Math.max(...counts, 1);

  return (
    <div className="chart-wrap">
      {STATUSES.map((label, i) => (
        <div className="chart-row" key={label}>
          <span className="chart-label">{label}</span>
          <div className="chart-track">
            <div
              className="chart-fill"
              style={{
                width: mounted ? (counts[i] / max) * 100 + '%' : '0%',
                background: COLORS[label],
                transitionDelay: i * 70 + 'ms',
              }}
            />
          </div>
          <span className="chart-count">{counts[i]}</span>
        </div>
      ))}
    </div>
  );
}
