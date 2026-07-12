import React from 'react';

export default function KpiCard({ icon, label, value, sub, tone }) {
  return (
    <div className={"kpi-card tone-" + tone}>
      <div className="kpi-top">
        <span className="kpi-icon">{icon}</span>
        <span className="kpi-tag">FLEET</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  );
}
