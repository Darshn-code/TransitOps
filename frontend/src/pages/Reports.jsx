import React from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { 
  getFuelEfficiency, 
  getFleetUtilization, 
  getOperationalCost, 
  getVehicleROI, 
  getMonthlyRevenue, 
  getTopCostliestVehicles 
} from '../services/reports';
import { useApi } from '../hooks/useApi';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import { Icon } from '../components/Icons';
import Unauthorized from './Unauthorized';

export default function Reports() {
  const { role } = useAuth();

  const { data, loading, error } = useApi(
    () => Promise.all([
      getFuelEfficiency(),
      getFleetUtilization(),
      getOperationalCost(),
      getVehicleROI(),
      getMonthlyRevenue(),
      getTopCostliestVehicles(5)
    ]).then(([efficiencies, utilizations, costs, rois, monthlyRevenue, costliest]) => ({
      efficiencies,
      utilizations,
      costs,
      rois,
      monthlyRevenue,
      costliest
    })),
    []
  );

  if (!can(role, 'reports', 'view')) return <Unauthorized />;

  if (loading) return (
    <div className="content">
      <PageHeader eyebrow="Analytics" title="Reports" note="Loading analytics report data..." />
      <SkeletonLoader rows={8} />
    </div>
  );

  if (error || !data) return (
    <div className="content">
      <PageHeader eyebrow="Analytics" title="Reports" note="Fleet-wide operational analytics and performance summaries." />
      <EmptyState title="Could not load reports data" note="Backend may be offline or database is empty." />
    </div>
  );

  const { efficiencies, utilizations, costs, rois, monthlyRevenue, costliest } = data;

  // Compute summary stats from reports
  const totalCompletedTrips = utilizations.reduce((sum, item) => sum + (item.completed_trips || 0), 0);
  const totalFuelCost = costs.reduce((sum, item) => sum + (item.fuel_cost || 0), 0);
  const totalMaintenanceCost = costs.reduce((sum, item) => sum + (item.maintenance_cost || 0), 0);
  
  // Calculate average utilization
  const activeUtils = utilizations.filter(u => u.utilization_pct !== null);
  const avgUtilization = activeUtils.length 
    ? Math.round(activeUtils.reduce((sum, item) => sum + item.utilization_pct, 0) / activeUtils.length)
    : 0;

  // Chart data: costliest vehicles
  const maxCost = Math.max(...costliest.map(c => c.operational_cost || 1), 1);

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">Analytics</span>
          <h1>Reports</h1>
          <p>Fleet-wide operational analytics and performance summaries.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card tone-red">
          <div className="kpi-top">
            <div className="kpi-icon"><Icon.Gauge className="icon-sm" /></div>
            <span className="kpi-tag">UTILIZATION</span>
          </div>
          <div className="kpi-value">{avgUtilization}%</div>
          <div className="kpi-label">Avg Vehicle Utilization</div>
          <div className="kpi-sub">Trip distribution index</div>
        </div>
        <div className="kpi-card tone-orange">
          <div className="kpi-top">
            <div className="kpi-icon"><Icon.Fuel className="icon-sm" /></div>
            <span className="kpi-tag">FUEL COST</span>
          </div>
          <div className="kpi-value">₹{(totalFuelCost / 1000).toFixed(1)}k</div>
          <div className="kpi-label">Total Fuel Spend</div>
          <div className="kpi-sub">Sum of all fuel logs</div>
        </div>
        <div className="kpi-card tone-ink">
          <div className="kpi-top">
            <div className="kpi-icon"><Icon.Wrench className="icon-sm" /></div>
            <span className="kpi-tag">MAINTENANCE</span>
          </div>
          <div className="kpi-value">₹{(totalMaintenanceCost / 1000).toFixed(1)}k</div>
          <div className="kpi-label">Maintenance Cost</div>
          <div className="kpi-sub">Total workshop spend</div>
        </div>
        <div className="kpi-card tone-green">
          <div className="kpi-top">
            <div className="kpi-icon"><Icon.Check className="icon-sm" /></div>
            <span className="kpi-tag">TRIPS</span>
          </div>
          <div className="kpi-value">{totalCompletedTrips}</div>
          <div className="kpi-label">Completed Trips</div>
          <div className="kpi-sub">Successfully delivered</div>
        </div>
      </div>

      <div className="split-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Costliest vehicles</h3>
              <p>Top vehicles by total operational cost (maintenance + fuel)</p>
            </div>
          </div>
          {costliest.length === 0 ? (
            <EmptyState title="No cost data" note="Add fuel or maintenance logs to see calculations." />
          ) : (
            <div className="chart-wrap">
              {costliest.map(c => (
                <div className="chart-row" key={c.vehicle_id}>
                  <span className="chart-label mono" style={{ width: 140 }}>{c.registration_number}</span>
                  <div className="chart-track">
                    <div className="chart-fill" style={{ 
                      width: `${(c.operational_cost / maxCost) * 100}%`, 
                      background: 'var(--brand-red)' 
                    }} />
                  </div>
                  <span className="chart-count">₹{c.operational_cost.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Vehicle ROI rankings</h3>
              <p>Profit efficiency score per vehicle</p>
            </div>
          </div>
          {rois.length === 0 ? (
            <EmptyState title="No ROI data" note="No ROI metrics are available." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Vehicle</th><th>Revenue</th><th>Costs</th><th>ROI</th></tr>
                </thead>
                <tbody>
                  {rois.slice(0, 5).map(r => (
                    <tr key={r.vehicle_id}>
                      <td className="strong">{r.registration_number}</td>
                      <td className="mono">₹{r.revenue.toLocaleString('en-IN')}</td>
                      <td className="mono">₹{(r.maintenance_cost + r.fuel_cost).toLocaleString('en-IN')}</td>
                      <td className="mono strong" style={{ color: r.roi >= 0 ? 'var(--green)' : 'var(--brand-red)' }}>
                        {r.roi !== null ? `${(r.roi * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, note }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {note && <p>{note}</p>}
      </div>
    </div>
  );
}
