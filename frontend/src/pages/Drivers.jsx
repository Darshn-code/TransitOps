import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getDrivers } from '../services/drivers';
import { useApi } from '../hooks/useApi';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import StatusPill from '../components/StatusPill';
import Avatar from '../components/Avatar';
import { Icon } from '../components/Icons';
import Unauthorized from './Unauthorized';

const STATUS_LABELS = {
  available: 'Available',
  on_trip: 'On Trip',
  off_duty: 'Off Duty',
  suspended: 'Suspended'
};

export default function Drivers() {
  const { role } = useAuth();
  const { data: drivers = [], loading, error } = useApi(getDrivers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() =>
    drivers.filter(d => {
      const matchStatus = !statusFilter || d.status === statusFilter;
      const matchSearch = !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.license_number.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    }), [drivers, statusFilter, search]);

  if (!can(role, 'drivers', 'view')) return <Unauthorized />;

  function safetyTone(score) {
    if (score >= 85) return 'tone-green';
    if (score >= 70) return 'tone-orange';
    return 'tone-red';
  }

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">Drivers &amp; safety</span>
          <h1>Drivers</h1>
          <p>Monitor driver statuses, license validity, and safety scores.</p>
        </div>
        {can(role, 'drivers', 'full') && (
          <button className="primary-btn" disabled>
            <Icon.Plus className="icon-sm" /> Add Driver
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
          <input type="text" placeholder="Search drivers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {!loading && <span className="result-count">{filtered.length} driver{filtered.length !== 1 ? 's' : ''}</span>}
      </div>

      <div className="panel panel-flush">
        {loading ? (
          <SkeletonLoader rows={6} />
        ) : error ? (
          <EmptyState title="Could not load drivers" note="Backend may be offline. No data to display." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No drivers found" note="Try adjusting your filters or search query." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Driver</th><th>License No.</th><th>Category</th><th>Expiry</th><th>Safety</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="cell-driver">
                        <Avatar name={d.name} />
                        <div className="cell-stack">
                          <span className="strong">{d.name}</span>
                          <span className="cell-sub">{d.contact_number || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{d.license_number}</td>
                    <td>{d.license_category}</td>
                    <td className="mono">{d.license_expiry_date ? d.license_expiry_date.split('T')[0] : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`safety-badge ${safetyTone(d.safety_score)}`}>{Math.round(d.safety_score)}</span>
                        <div className="mini-bar-wrap">
                          <div className="mini-bar-track">
                            <div className="mini-bar-fill" style={{ width: d.safety_score + '%' }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><StatusPill status={STATUS_LABELS[d.status] || d.status} /></td>
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
