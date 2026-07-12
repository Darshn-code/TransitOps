// frontend/src/pages/Fuel.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getFuelLogs, getExpenses, createFuelLog, createExpense } from '../services/fuel';
import { getVehicles } from '../services/vehicles';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import { Icon } from '../components/Icons';
import Unauthorized from './Unauthorized';

const EMPTY_FUEL_FORM = { vehicle_id: '', liters: '', cost: '' };
const EMPTY_EXPENSE_FORM = { vehicle_id: '', type: 'toll', amount: '', description: '' };

export default function Fuel() {
  const { role } = useAuth();
  const { showToast } = useToast();

  const { data: fuelLogs = [], loading: fLoading, error: fErr, refetch: refetchFuel } = useApi(getFuelLogs);
  const { data: expenses = [], loading: eLoading, error: eErr, refetch: refetchExpenses } = useApi(getExpenses);
  const { data: vehicles = [], loading: vLoading } = useApi(getVehicles);

  const [activeTab, setActiveTab] = useState('fuel');
  const [showAdd, setShowAdd] = useState(false);
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL_FORM);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loading = fLoading || eLoading || vLoading;
  const error = fErr || eErr;

  const vehicleById = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const totalFuelCost = fuelLogs.reduce((s, l) => s + l.cost, 0);
  const totalLiters = fuelLogs.reduce((s, l) => s + l.liters, 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (!can(role, 'fuel', 'view')) return <Unauthorized />;

  const canEdit = can(role, 'fuel', 'full');

  function openAdd() {
    setFuelForm(EMPTY_FUEL_FORM);
    setExpenseForm(EMPTY_EXPENSE_FORM);
    setFormError(null);
    setShowAdd(true);
  }

  async function handleAddFuel(e) {
    e.preventDefault();
    setFormError(null);

    const liters = parseFloat(fuelForm.liters);
    const cost = parseFloat(fuelForm.cost);
    if (!fuelForm.vehicle_id) { setFormError('Select a vehicle.'); return; }
    if (!liters || liters <= 0) { setFormError('Liters must be greater than 0.'); return; }
    if (isNaN(cost) || cost < 0) { setFormError('Cost must be 0 or more.'); return; }

    setSubmitting(true);
    try {
      await createFuelLog({
        vehicle_id: parseInt(fuelForm.vehicle_id, 10),
        liters,
        cost,
      });
      setShowAdd(false);
      showToast('Fuel entry logged');
      refetchFuel();
    } catch (err) {
      setFormError(err.message || 'Could not log fuel entry.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    setFormError(null);

    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.vehicle_id) { setFormError('Select a vehicle.'); return; }
    if (!amount || amount <= 0) { setFormError('Amount must be greater than 0.'); return; }

    setSubmitting(true);
    try {
      await createExpense({
        vehicle_id: parseInt(expenseForm.vehicle_id, 10),
        type: expenseForm.type,
        amount,
        description: expenseForm.description.trim() || null,
      });
      setShowAdd(false);
      showToast('Expense entry logged');
      refetchExpenses();
    } catch (err) {
      setFormError(err.message || 'Could not log expense.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">Financials</span>
          <h1>Fuel &amp; Expenses</h1>
          <p>Track all fuel consumption and operational expense records.</p>
        </div>
        {canEdit && (
          <button className="primary-btn" onClick={openAdd}>
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

      {showAdd && (
        <Modal title={activeTab === 'fuel' ? 'Log Fuel Entry' : 'Log Expense'} onClose={() => setShowAdd(false)}>
          <div className="filter-bar" style={{ marginBottom: 16 }}>
            <button type="button" className={`toggle-btn ${activeTab === 'fuel' ? 'is-active' : ''}`} onClick={() => { setActiveTab('fuel'); setFormError(null); }}>Fuel</button>
            <button type="button" className={`toggle-btn ${activeTab === 'expenses' ? 'is-active' : ''}`} onClick={() => { setActiveTab('expenses'); setFormError(null); }}>Expense</button>
          </div>

          {activeTab === 'fuel' ? (
            <form className="modal-form" onSubmit={handleAddFuel}>
              {formError && <div className="field-error">{formError}</div>}

              <div className="field">
                <span className="field-label">Vehicle</span>
                <select value={fuelForm.vehicle_id} onChange={e => setFuelForm(f => ({ ...f, vehicle_id: e.target.value }))} required>
                  <option value="">Select a vehicle…</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>
                  ))}
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <span className="field-label">Liters</span>
                  <input type="number" min="0.1" step="0.1" value={fuelForm.liters} onChange={e => setFuelForm(f => ({ ...f, liters: e.target.value }))} required />
                </div>
                <div className="field">
                  <span className="field-label">Cost (₹)</span>
                  <input type="number" min="0" step="1" value={fuelForm.cost} onChange={e => setFuelForm(f => ({ ...f, cost: e.target.value }))} required />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? 'Logging…' : 'Log Fuel Entry'}
                </button>
              </div>
            </form>
          ) : (
            <form className="modal-form" onSubmit={handleAddExpense}>
              {formError && <div className="field-error">{formError}</div>}

              <div className="field">
                <span className="field-label">Vehicle</span>
                <select value={expenseForm.vehicle_id} onChange={e => setExpenseForm(f => ({ ...f, vehicle_id: e.target.value }))} required>
                  <option value="">Select a vehicle…</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>
                  ))}
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <span className="field-label">Type</span>
                  <select value={expenseForm.type} onChange={e => setExpenseForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="toll">Toll</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <span className="field-label">Amount (₹)</span>
                  <input type="number" min="0" step="1" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
              </div>

              <div className="field">
                <span className="field-label">Description</span>
                <input type="text" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
              </div>

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? 'Logging…' : 'Log Expense'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}