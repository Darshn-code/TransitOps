import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getTrips } from '../services/trips';
import { getVehicles } from '../services/vehicles';
import { getDrivers } from '../services/drivers';
import { useApi } from '../hooks/useApi';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import StatusPill from '../components/StatusPill';
import Avatar from '../components/Avatar';
import { Icon } from '../components/Icons';
import Unauthorized from './Unauthorized';

const STATUS_LABELS = {
  draft: 'Pending',
  dispatched: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function Trips() {
  const { role } = useAuth();
  
  const { data: trips = [], loading: tLoading, error: tErr } = useApi(getTrips);
  const { data: vehicles = [], loading: vLoading } = useApi(getVehicles);
  const { data: drivers = [], loading: dLoading } = useApi(getDrivers);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loading = tLoading || vLoading || dLoading;

  const vehicleById = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const driverById = Object.fromEntries(drivers.map(d => [d.id, d]));

  const filtered = useMemo(() =>
    trips.filter(t => {
      const matchStatus = !statusFilter || t.status === statusFilter;
      const v = vehicleById[t.vehicle_id];
      const matchSearch = !search || 
        t.id.toString().includes(search) ||
        (v?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        t.source.toLowerCase().includes(search.toLowerCase()) ||
        t.destination.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    }), [trips, statusFilter, search, vehicleById]);

  if (!can(role, 'trips', 'view')) return <Unauthorized />;

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">Trip dispatcher</span>
          <h1>Trips</h1>
          <p>View and manage all trip dispatches across the fleet.</p>
        </div>
        {can(role, 'trips', 'full') && (
          <button className="primary-btn" disabled>
            <Icon.Plus className="icon-sm" /> New Trip
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
        <div className="search-box">
          <Icon.Search className="icon-sm" />
          <input type="text" placeholder="Search trips…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {!loading && <span className="result-count">{filtered.length} trip{filtered.length !== 1 ? 's' : ''}</span>}
      </div>

      <div className="panel panel-flush">
        {loading ? (
          <SkeletonLoader rows={6} />
        ) : tErr ? (
          <EmptyState title="Could not load trips" note="Backend may be offline. No data to display." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No trips found" note="Try adjusting your filters or search query." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Trip ID</th><th>Vehicle</th><th>Driver</th><th>Route</th><th>Cargo Weight</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const v = vehicleById[t.vehicle_id];
                  const d = driverById[t.driver_id];
                  return (
                    <tr key={t.id}>
                      <td className="mono">TRP-{t.id}</td>
                      <td>
                        <div className="cell-stack">
                          <span>{v ? v.name : '—'}</span>
                          <span className="cell-sub mono">{v ? v.registration_number : ''}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-driver">
                          <Avatar name={d ? d.name : '?'} />
                          <span>{d ? d.name : 'Unassigned'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-stack">
                          <span>{t.source}</span>
                          <span className="cell-sub">→ {t.destination}</span>
                        </div>
                      </td>
                      <td className="mono">{t.cargo_weight} kg</td>
                      <td><StatusPill status={STATUS_LABELS[t.status] || t.status} /></td>
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
