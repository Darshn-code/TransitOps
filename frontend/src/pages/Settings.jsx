import React from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import Unauthorized from './Unauthorized';

const REGIONS = ['Chennai', 'Bengaluru', 'Hyderabad', 'Coimbatore', 'Mumbai'];
const VEHICLE_TYPES = ['Truck', 'Van', 'Bus', 'Sedan', 'Two-Wheeler'];

export default function Settings() {
  const { role } = useAuth();

  if (!can(role, 'settings', 'view')) return <Unauthorized />;

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">System</span>
          <h1>Settings</h1>
          <p>Manage application preferences, regions, and vehicle type configurations.</p>
        </div>
      </div>

      <div className="split-grid">
        <div className="panel">
          <div className="panel-head">
            <div><h3>Regions</h3><p>Active operational regions in the fleet network</p></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Region Name</th></tr></thead>
              <tbody>
                {REGIONS.map((r, i) => (
                  <tr key={r}>
                    <td className="mono" style={{ color: 'var(--ink-faint)', width: 40 }}>{i + 1}</td>
                    <td className="strong">{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>Vehicle Types</h3><p>Registered vehicle categories</p></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Type</th></tr></thead>
              <tbody>
                {VEHICLE_TYPES.map((t, i) => (
                  <tr key={t}>
                    <td className="mono" style={{ color: 'var(--ink-faint)', width: 40 }}>{i + 1}</td>
                    <td className="strong">{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <div><h3>Application Info</h3><p>Build and environment details</p></div>
        </div>
        <div style={{ padding: '8px 0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['App Name', 'Fleetstamp — Fleet Operations Console'],
            ['Current Role', role?.replace(/_/g, ' ')],
            ['Frontend', 'React + Vite'],
          ].map(([key, val]) => (
            <div key={key} style={{ display: 'flex', gap: 16, fontSize: 13.5 }}>
              <span style={{ color: 'var(--ink-soft)', fontWeight: 700, width: 160 }}>{key}</span>
              <span style={{ textTransform: key === 'Current Role' ? 'capitalize' : 'none' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
