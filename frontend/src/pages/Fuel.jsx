import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getFuelLogs, getExpenses } from '../services/fuel';
import { getVehicles } from '../services/vehicles';
import { useApi } from '../hooks/useApi';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import { Icon } from '../components/Icons';
import Unauthorized from './Unauthorized';

export default function Fuel() {
  const { role } = useAuth();
  
  const { data: fuelLogs = [], loading: fLoading, error: fErr } = useApi(getFuelLogs);
  const { data: expenses = [], loading: eLoading, error: eErr } = useApi(getExpenses);
  const { data: vehicles = [], loading: vLoading } = useApi(getVehicles);

  const [activeTab, setActiveTab] = useState('fuel');

  const loading = fLoading || eLoading || vLoading;
  const error = fErr || eErr;

  const vehicleById = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const totalFuelCost = fuelLogs.reduce((s, l) => s + l.cost, 0);
  const totalLiters = fuelLogs.reduce((s, l) => s + l.liters, 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (!can(role, 'fuel', 'view')) return <Unauthorized />;

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">Financials</span>
          <h1>Fuel &amp; Expenses</h1>
          <p>Track all fuel consumption and operational expense records.</p>
        </div>
        {can(role, 'fuel', 'full') && (
          <button className="primary-btn" disabled>
            <Icon.Plus className="icon-sm" /> Log Entry
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonLoader rows={4} />
      ) : error ? (
        <EmptyState title="Could not load fuel data" note="Backend may be offline. No data to display." />
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card tone-orange">
              <div className="kpi-top">
                <div className="kpi-icon"><Icon.Fuel className="icon-sm" /></div>
                <span className="kpi-tag">TOTAL LITERS</span>
              </div>
              <div className="kpi-value">{totalLiters.toLocaleString('en-IN')}</div>
              <div className="kpi-label">Fuel Dispensed</div>
              <div className="kpi-sub">Across all logged entries</div>
            </div>
            <div className="kpi-card tone-red">
              <div className="kpi-top">
                <div className="kpi-icon"><Icon.Rupee className="icon-sm" /></div>
                <span className="kpi-tag">FUEL COST</span>
              </div>
              <div className="kpi-value">₹{totalFuelCost.toLocaleString('en-IN')}</div>
              <div className="kpi-label">Total Fuel Spend</div>
              <div className="kpi-sub">Sum of all fuel logs</div>
            </div>
            <div className="kpi-card tone-ink">
              <div className="kpi-top">
                <div className="kpi-icon"><Icon.Receipt className="icon-sm" /></div>
                <span className="kpi-tag">EXPENSES</span>
              </div>
              <div className="kpi-value">₹{totalExpenses.toLocaleString('en-IN')}</div>
              <div className="kpi-label">Other Expenses</div>
              <div className="kpi-sub">Tolls and miscellaneous</div>
            </div>
          </div>

          <div className="filter-bar">
            <button className={`toggle-btn ${activeTab === 'fuel' ? 'is-active' : ''}`} onClick={() => setActiveTab('fuel')}>Fuel Logs</button>
            <button className={`toggle-btn ${activeTab === 'expenses' ? 'is-active' : ''}`} onClick={() => setActiveTab('expenses')}>Expenses</button>
          </div>

          <div className="panel panel-flush">
            {activeTab === 'fuel' ? (
              fuelLogs.length === 0 ? (
                <EmptyState title="No fuel logs" note="No fuel entries have been recorded yet." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Log ID</th><th>Vehicle</th><th>Date</th><th className="num">Liters</th><th className="num">Cost (₹)</th></tr>
                    </thead>
                    <tbody>
                      {fuelLogs.map(l => {
                        const v = vehicleById[l.vehicle_id];
                        return (
                          <tr key={l.id}>
                            <td className="mono">FUL-{l.id}</td>
                            <td>
                              <div className="cell-stack">
                                <span>{v ? v.name : '—'}</span>
                                <span className="cell-sub mono">{v ? v.registration_number : ''}</span>
                              </div>
                            </td>
                            <td className="mono">{l.date ? l.date.split('T')[0] : '—'}</td>
                            <td className="num mono">{l.liters} L</td>
                            <td className="num mono">₹{l.cost.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              expenses.length === 0 ? (
                <EmptyState title="No expenses" note="No expense entries have been recorded yet." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Expense ID</th><th>Vehicle</th><th>Type</th><th>Description</th><th>Amount (₹)</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => {
                        const v = vehicleById[e.vehicle_id];
                        return (
                          <tr key={e.id}>
                            <td className="mono">EXP-{e.id}</td>
                            <td>{v ? v.name : '—'}</td>
                            <td style={{ textTransform: 'capitalize' }}>{e.type}</td>
                            <td>{e.description || '—'}</td>
                            <td className="num mono">₹{e.amount.toLocaleString('en-IN')}</td>
                            <td className="mono">{e.date ? e.date.split('T')[0] : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
