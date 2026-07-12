// frontend/src/pages/Maintenance.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getMaintenanceLogs, createMaintenanceLog, closeMaintenanceLog } from '../services/maintenance';
import { getVehicles } from '../services/vehicles';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import { Icon } from '../components/Icons';
import Unauthorized from './Unauthorized';

const STATUS_LABELS = {
  active: 'In Shop',
  closed: 'Completed'
};

const EMPTY_FORM = {
  vehicle_id: '',
  description: '',
  cost: '',
};

export default function Maintenance() {
  const { role } = useAuth();
  const { showToast } = useToast();

  const { data: logs = [], loading: lLoading, error: lErr, refetch } = useApi(getMaintenanceLogs);
  const { data: vehicles = [], loading: vLoading } = useApi(getVehicles);

  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loading = lLoading || vLoading;
  const vehicleById = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const filtered = useMemo(() =>
    logs.filter(r => !statusFilter || r.status === statusFilter),
    [logs, statusFilter]);

  if (!can(role, 'maintenance', 'view')) return <Unauthorized />;

  const canEdit = can(role, 'maintenance', 'full');
  const eligibleVehicles = vehicles.filter(v => v.status !== 'in_shop' && v.status !== 'retired');

  function updateField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowAdd(true);
  }

  async function handleAddLog(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.vehicle_id || !form.description.trim()) {
      setFormError('Vehicle and description are required.');
      return;
    }
    const cost = form.cost === '' ? 0 : parseFloat(form.cost);
    if (isNaN(cost) || cost < 0) {
      setFormError('Cost must be 0 or more.');
      return;
    }

    setSubmitting(true);
    try {
      await createMaintenanceLog({
        vehicle_id: parseInt(form.vehicle_id, 10),
        description: form.description.trim(),
        cost,
      });
      setShowAdd(false);
      showToast('Maintenance record logged, vehicle moved to In Shop');
      refetch();
    } catch (err) {
      setFormError(err.message || 'Could not log maintenance.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose(log) {
    setBusyId(log.id);
    try {
      await closeMaintenanceLog(log.id);
      showToast(`MNT-${log.id} closed`);
      refetch();
    } catch (err) {
      showToast(err.message || 'Could not close record');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">Workshop</span>
          <h1>Maintenance</h1>
          <p>Track all service records, repairs, and vehicle workshop activity.</p>
        </div>
        {canEdit && (
          <button className="primary-btn" onClick={openAdd}>
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
                  {canEdit && <th>Actions</th>}
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
                      {canEdit && (
                        <td>
                          {r.status === 'active' ? (
                            <button className="np-btn np-btn-primary np-btn-sm" disabled={busyId === r.id} onClick={() => handleClose(r)}>
                              {busyId === r.id ? 'Closing…' : 'Close'}
                            </button>
                          ) : (
                            <span className="cell-sub">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Log Service" onClose={() => setShowAdd(false)}>
          <form className="modal-form" onSubmit={handleAddLog}>
            {formError && <div className="field-error">{formError}</div>}

            <div className="field">
              <span className="field-label">Vehicle</span>
              <select value={form.vehicle_id} onChange={e => updateField('vehicle_id', e.target.value)} required>
                <option value="">Select a vehicle…</option>
                {eligibleVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>
                ))}
              </select>
              {eligibleVehicles.length === 0 && <span className="field-hint">No eligible vehicles (already in shop or retired).</span>}
            </div>

            <div className="field">
              <span className="field-label">Description</span>
              <input type="text" value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="e.g. Oil change, brake inspection" required />
            </div>

            <div className="field">
              <span className="field-label">Estimated Cost (₹)</span>
              <input type="number" min="0" step="1" value={form.cost} onChange={e => updateField('cost', e.target.value)} placeholder="0" />
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Logging…' : 'Log Service'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}