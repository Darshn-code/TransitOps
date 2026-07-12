import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getDashboardSummary } from '../services/dashboard';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import EmptyState from '../components/EmptyState';
import VehicleStatusChart from '../components/VehicleStatusChart';
import SkeletonLoader from '../components/SkeletonLoader';
import { Icon } from '../components/Icons';
import Avatar from '../components/Avatar';
import StatusPill from '../components/StatusPill';
import Unauthorized from './Unauthorized';

const STATUS_LABELS = {
  available: 'Available',
  on_trip: 'On Trip',
  in_shop: 'In Shop',
  retired: 'Retired'
};

const REGIONS = ['Chennai', 'Bengaluru', 'Hyderabad', 'Coimbatore', 'Mumbai'];
const VEHICLE_TYPES = ['Truck', 'Van', 'Bus', 'Sedan', 'Two-Wheeler'];

export default function Dashboard() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const { data: summary, loading, error } = useApi(
    () => getDashboardSummary({
      vehicle_type: typeFilter || undefined,
      status: statusFilter || undefined,
      region: regionFilter || undefined
    }),
    [typeFilter, statusFilter, regionFilter]
  );

  if (!can(role, 'dashboard', 'view')) return <Unauthorized />;

  const anyFilter = typeFilter || statusFilter || regionFilter;

  // Format status chart data
  const statusCounts = summary?.vehicle_status_breakdown || {
    available: 0,
    on_trip: 0,
    in_shop: 0,
    retired: 0
  };

  const formattedVehiclesForChart = Object.entries(statusCounts).flatMap(([statusKey, count]) => 
    Array.from({ length: count }, () => ({ status: STATUS_LABELS[statusKey] || statusKey }))
  );

  return (
    <div className="content">
      <PageHeader
        eyebrow="Command centre"
        title="Live fleet snapshot"
        note="Live operational overview across every region and vehicle class."
      />

      <div className="filter-bar">
        <span className="filter-bar-label"><Icon.Filter className="icon-xs" /> Filter by</span>

        <div className="chip-select">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All vehicle types</option>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Icon.Chevron className="chip-chevron icon-xs" />
        </div>

        <div className="chip-select">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <Icon.Chevron className="chip-chevron icon-xs" />
        </div>

        <div className="chip-select">
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="">All regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <Icon.Chevron className="chip-chevron icon-xs" />
        </div>

        {anyFilter && (
          <button className="ghost-btn" onClick={() => { setTypeFilter(''); setStatusFilter(''); setRegionFilter(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : error ? (
        <EmptyState title="Could not load dashboard data" note="Backend may be offline. No data to display." />
      ) : (
        <>
          <div className="kpi-grid">
            <KpiCard tone="red" icon={<Icon.Truck className="icon-sm" />} label="Active Vehicles" value={summary.kpis.active_vehicles} sub="Currently on trip" />
            <KpiCard tone="green" icon={<Icon.Check className="icon-sm" />} label="Available Vehicles" value={summary.kpis.available_vehicles} sub="Ready to dispatch" />
            <KpiCard tone="orange" icon={<Icon.Wrench className="icon-sm" />} label="In Maintenance" value={summary.kpis.vehicles_in_maintenance} sub="At the workshop" />
            <KpiCard tone="ink" icon={<Icon.Route className="icon-sm" />} label="Active Trips" value={summary.kpis.active_trips} sub="On the road now" />
            <KpiCard tone="red" icon={<Icon.Users className="icon-sm" />} label="Drivers on Duty" value={summary.kpis.drivers_on_duty} sub="Available or on trip" />
            <KpiCard tone="orange" icon={<Icon.Gauge className="icon-sm" />} label="Fleet Utilization" value={summary.kpis.fleet_utilization_pct !== null ? `${Math.round(summary.kpis.fleet_utilization_pct)}%` : '—'} sub="On-trip share of active fleet" />
          </div>

          <div className="split-grid">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Recent trips</h3>
                  <p>Latest dispatch activity for the current filter</p>
                </div>
                <button className="link-btn" onClick={() => navigate('/trips')}>
                  View trips <Icon.Chevron className="icon-xs rot-neg90" />
                </button>
              </div>
              {(!summary.recent_trips || summary.recent_trips.length === 0) ? (
                <EmptyState title="No recent trips" note="No trip dispatch activity has been logged." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Trip</th><th>Vehicle</th><th>Driver</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {summary.recent_trips.map(t => (
                        <tr key={t.trip}>
                          <td className="mono">{t.trip}</td>
                          <td className="mono">{t.vehicle}</td>
                          <td>
                            <div className="cell-driver">
                              <Avatar name={t.driver} />
                              <span>{t.driver}</span>
                            </div>
                          </td>
                          <td><StatusPill status={STATUS_LABELS[t.status] || t.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Vehicle status</h3>
                  <p>Where every registered vehicle stands right now</p>
                </div>
              </div>
              <VehicleStatusChart vehicles={formattedVehiclesForChart} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
