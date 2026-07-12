import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getVehicles } from '../services/vehicles';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import { Icon } from '../components/Icons';
import StatusPill from '../components/StatusPill';
import Unauthorized from './Unauthorized';

const STATUS_LABELS = {
  available: 'Available',
  on_trip:   'On Trip',
  in_shop:   'In Shop',
  retired:   'Retired',
};

export default function Fleet() {
  const { role } = useAuth();
  const [typeFilter,   setTypeFilter]   = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const { data: vehicles = [], loading, error } = useApi(getVehicles);

  if (!can(role, 'fleet', 'view')) return <Unauthorized />;

  const vehicleTypes   = [...new Set(vehicles.map(v => v.type).filter(Boolean))];
  const vehicleRegions = [...new Set(vehicles.map(v => v.region).filter(Boolean))];

  const filtered = useMemo(() =>
    vehicles.filter(v =>
      (!typeFilter   || v.type   === typeFilter) &&
      (!regionFilter || v.region === regionFilter)
    ), [vehicles, typeFilter, regionFilter]);

  const anyFilter = typeFilter || regionFilter;

  return (
    <div className="content">
      <PageHeader
        eyebrow="Fleet management"
        title="Vehicle registry"
        note="Manage all registered vehicles across regions and types."
        action={can(role, 'fleet', 'full') && (
          <button className="primary-btn" disabled>
            <Icon.Plus className="icon-sm" /> Add Vehicle
          </button>
        )}
      />

      <div className="filter-bar">
        <span className="filter-bar-label"><Icon.Filter className="icon-xs" /> Filter by</span>
        <div className="chip-select">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {vehicleTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          <Icon.Chevron className="chip-chevron icon-xs" />
        </div>
        <div className="chip-select">
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="">All regions</option>
            {vehicleRegions.map(r => <option key={r}>{r}</option>)}
          </select>
          <Icon.Chevron className="chip-chevron icon-xs" />
        </div>
        {anyFilter && (
          <button className="ghost-btn" onClick={() => { setTypeFilter(''); setRegionFilter(''); }}>
            Clear filters
          </button>
        )}
        {!loading && <span className="result-count">{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</span>}
      </div>

      <div className="panel panel-flush">
        {loading ? <SkeletonLoader rows={6} /> : error ? (
          <EmptyState title="Could not load vehicles" note="Backend may be offline. No data to display." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No vehicles" note={anyFilter ? "Try widening your filters." : "No vehicles registered yet."} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reg No.</th><th>Name</th><th>Type</th>
                  <th className="num">Max Load (kg)</th><th>Region</th>
                  <th className="num">Odometer</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td className="mono">{v.registration_number}</td>
                    <td className="strong">{v.name}</td>
                    <td>{v.type}</td>
                    <td className="num mono">{v.max_load_capacity?.toLocaleString('en-IN')}</td>
                    <td>{v.region || '—'}</td>
                    <td className="num mono">{v.odometer?.toLocaleString('en-IN')} km</td>
                    <td><StatusPill status={STATUS_LABELS[v.status] || v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
