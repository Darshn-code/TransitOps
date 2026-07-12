import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getMaintenanceLogs } from '../services/maintenance';
import { getVehicles } from '../services/vehicles';
import { useApi } from '../hooks/useApi';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import StatusPill from '../components/StatusPill';
import { Icon } from '../components/Icons';
import Unauthorized from './Unauthorized';

const STATUS_LABELS = {
  active: 'In Shop',
  closed: 'Completed'
};

export default function Maintenance() {
  const { role } = useAuth();
  
  const { data: logs = [], loading: lLoading, error: lErr } = useApi(getMaintenanceLogs);
  const { data: vehicles = [], loading: vLoading } = useApi(getVehicles);

  const [statusFilter, setStatusFilter] = useState('');

  const loading = lLoading || vLoading;
  const vehicleById = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const filtered = useMemo(() =>
    logs.filter(r => !statusFilter || r.status === statusFilter),
    [logs, statusFilter]);

  if (!can(role, 'maintenance', 'view')) return <Unauthorized />;

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">Workshop</span>
          <h1>Maintenance</h1>
          <p>Track all service records, repairs, and vehicle workshop activity.</p>
        </div>
        {can(role, 'maintenance', 'full') && (
          <button className="primary-btn" disabled>
            <Icon.Plus className="icon-sm" /> Log Service
          </button>
        )}
      </div>

      <div className="filter-bar">
        <span className="filter-bar-label"><Icon.Filter className="icon-xs" /> Filter by</span>
        <div className="chip-select">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <Icon.Chevron className="chip-chevron icon-xs" />
        </div>
        {!loading && <span className="result-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>}
      </div>

      <div className="panel panel-flush">
        {loading ? (
          <SkeletonLoader rows={6} />
        ) : lErr ? (
          <EmptyState title="Could not load maintenance logs" note="Backend may be offline. No data to display." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No service records" note="No maintenance records match this filter." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Record ID</th><th>Vehicle</th><th>Description</th>
                  <th>Date</th><th className="num">Cost (₹)</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const v = vehicleById[r.vehicle_id];
                  return (
                    <tr key={r.id}>
                      <td className="mono">MNT-{r.id}</td>
                      <td>
                        <div className="cell-stack">
                          <span>{v ? v.name : '—'}</span>
                          <span className="cell-sub mono">{v ? v.registration_number : ''}</span>
                        </div>
                      </td>
                      <td>{r.description}</td>
                      <td className="mono">{r.created_at ? r.created_at.split('T')[0] : '—'}</td>
                      <td className="num mono">₹{r.cost?.toLocaleString('en-IN') || '0'}</td>
                      <td><StatusPill status={STATUS_LABELS[r.status] || r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
