// frontend/src/pages/Trips.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from '../services/trips';
import { getVehicles } from '../services/vehicles';
import { getDrivers } from '../services/drivers';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
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

const EMPTY_TRIP_FORM = {
  source: '',
  destination: '',
  vehicle_id: '',
  driver_id: '',
  cargo_weight: '',
  planned_distance: '',
};

const EMPTY_COMPLETE_FORM = {
  final_odometer: '',
  fuel_consumed: '',
  fuel_cost: '',
  revenue: '',
};

export default function Trips() {
  const { role } = useAuth();
  const { showToast } = useToast();

  const { data: trips = [], loading: tLoading, error: tErr, refetch } = useApi(getTrips);
  const { data: vehicles = [], loading: vLoading } = useApi(getVehicles);
  const { data: drivers = [], loading: dLoading } = useApi(getDrivers);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_TRIP_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [completeTripId, setCompleteTripId] = useState(null);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE_FORM);
  const [completeError, setCompleteError] = useState(null);

  const [busyId, setBusyId] = useState(null);

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

  const canEdit = can(role, 'trips', 'full');
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const availableDrivers = drivers.filter(d => d.status === 'available');

  function updateField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_TRIP_FORM);
    setFormError(null);
    setShowAdd(true);
  }

  async function handleCreateTrip(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.source.trim() || !form.destination.trim() || !form.vehicle_id || !form.driver_id) {
      setFormError('Source, destination, vehicle, and driver are all required.');
      return;
    }
    const cargo = parseFloat(form.cargo_weight);
    const distance = parseFloat(form.planned_distance);
    if (!cargo || cargo <= 0) {
      setFormError('Cargo weight must be greater than 0.');
      return;
    }
    if (!distance || distance <= 0) {
      setFormError('Planned distance must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await createTrip({
        source: form.source.trim(),
        destination: form.destination.trim(),
        vehicle_id: parseInt(form.vehicle_id, 10),
        driver_id: parseInt(form.driver_id, 10),
        cargo_weight: cargo,
        planned_distance: distance,
      });
      setShowAdd(false);
      showToast('Trip created as Draft');
      refetch();
    } catch (err) {
      setFormError(err.message || 'Could not create trip.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDispatch(trip) {
    setBusyId(trip.id);
    try {
      await dispatchTrip(trip.id);
      showToast(`Trip TRP-${trip.id} dispatched`);
      refetch();
    } catch (err) {
      showToast(err.message || 'Could not dispatch trip');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(trip) {
    const reason = window.prompt('Cancellation reason (optional):', '') || undefined;
    setBusyId(trip.id);
    try {
      await cancelTrip(trip.id, { reason });
      showToast(`Trip TRP-${trip.id} cancelled`);
      refetch();
    } catch (err) {
      showToast(err.message || 'Could not cancel trip');
    } finally {
      setBusyId(null);
    }
  }

  function openComplete(trip) {
    setCompleteTripId(trip.id);
    setCompleteForm(EMPTY_COMPLETE_FORM);
    setCompleteError(null);
  }

  async function handleComplete(e) {
    e.preventDefault();
    setCompleteError(null);

    const finalOdo = parseFloat(completeForm.final_odometer);
    const fuelConsumed = parseFloat(completeForm.fuel_consumed);
    const fuelCost = parseFloat(completeForm.fuel_cost);
    const revenue = parseFloat(completeForm.revenue);

    if (!finalOdo || finalOdo <= 0) { setCompleteError('Final odometer must be greater than 0.'); return; }
    if (!fuelConsumed || fuelConsumed <= 0) { setCompleteError('Fuel consumed must be greater than 0.'); return; }
    if (isNaN(fuelCost) || fuelCost < 0) { setCompleteError('Fuel cost must be 0 or more.'); return; }
    if (isNaN(revenue) || revenue < 0) { setCompleteError('Revenue must be 0 or more.'); return; }

    setSubmitting(true);
    try {
      await completeTrip(completeTripId, {
        final_odometer: finalOdo,
        fuel_consumed: fuelConsumed,
        fuel_cost: fuelCost,
        revenue,
      });
      showToast(`Trip TRP-${completeTripId} completed`);
      setCompleteTripId(null);
      refetch();
    } catch (err) {
      setCompleteError(err.message || 'Could not complete trip.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">Trip dispatcher</span>
          <h1>Trips</h1>
          <p>View and manage all trip dispatches across the fleet.</p>
        </div>
        {canEdit && (
          <button className="primary-btn" onClick={openAdd}>
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
                <tr>
                  <th>Trip ID</th><th>Vehicle</th><th>Driver</th><th>Route</th><th>Cargo Weight</th><th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
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
                      {canEdit && (
                        <td>
                          <div className="np-row-actions">
                            {t.status === 'draft' && (
                              <>
                                <button className="np-btn np-btn-primary np-btn-sm" disabled={busyId === t.id} onClick={() => handleDispatch(t)}>
                                  Dispatch
                                </button>
                                <button className="np-btn np-btn-secondary np-btn-sm" disabled={busyId === t.id} onClick={() => handleCancel(t)}>
                                  Cancel
                                </button>
                              </>
                            )}
                            {t.status === 'dispatched' && (
                              <>
                                <button className="np-btn np-btn-primary np-btn-sm" disabled={busyId === t.id} onClick={() => openComplete(t)}>
                                  Complete
                                </button>
                                <button className="np-btn np-btn-secondary np-btn-sm" disabled={busyId === t.id} onClick={() => handleCancel(t)}>
                                  Cancel
                                </button>
                              </>
                            )}
                            {(t.status === 'completed' || t.status === 'cancelled') && <span className="cell-sub">—</span>}
                          </div>
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
        <Modal title="New Trip" onClose={() => setShowAdd(false)}>
          <form className="modal-form" onSubmit={handleCreateTrip}>
            {formError && <div className="field-error">{formError}</div>}

            <div className="field-row">
              <div className="field">
                <span className="field-label">Source</span>
                <input type="text" value={form.source} onChange={e => updateField('source', e.target.value)} required />
              </div>
              <div className="field">
                <span className="field-label">Destination</span>
                <input type="text" value={form.destination} onChange={e => updateField('destination', e.target.value)} required />
              </div>
            </div>

            <div className="field">
              <span className="field-label">Vehicle</span>
              <select value={form.vehicle_id} onChange={e => updateField('vehicle_id', e.target.value)} required>
                <option value="">Select an available vehicle…</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_number} — {v.name} ({v.max_load_capacity}kg)</option>
                ))}
              </select>
              {availableVehicles.length === 0 && <span className="field-hint">No vehicles currently available.</span>}
            </div>

            <div className="field">
              <span className="field-label">Driver</span>
              <select value={form.driver_id} onChange={e => updateField('driver_id', e.target.value)} required>
                <option value="">Select an available driver…</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.license_number}</option>
                ))}
              </select>
              {availableDrivers.length === 0 && <span className="field-hint">No drivers currently available.</span>}
            </div>

            <div className="field-row">
              <div className="field">
                <span className="field-label">Cargo Weight (kg)</span>
                <input type="number" min="1" value={form.cargo_weight} onChange={e => updateField('cargo_weight', e.target.value)} required />
              </div>
              <div className="field">
                <span className="field-label">Planned Distance (km)</span>
                <input type="number" min="1" value={form.planned_distance} onChange={e => updateField('planned_distance', e.target.value)} required />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Trip'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {completeTripId && (
        <Modal title={`Complete Trip TRP-${completeTripId}`} onClose={() => setCompleteTripId(null)}>
          <form className="modal-form" onSubmit={handleComplete}>
            {completeError && <div className="field-error">{completeError}</div>}

            <div className="field">
              <span className="field-label">Final Odometer (km)</span>
              <input
                type="number" min="1"
                value={completeForm.final_odometer}
                onChange={e => setCompleteForm(f => ({ ...f, final_odometer: e.target.value }))}
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <span className="field-label">Fuel Consumed (L)</span>
                <input
                  type="number" min="0.1" step="0.1"
                  value={completeForm.fuel_consumed}
                  onChange={e => setCompleteForm(f => ({ ...f, fuel_consumed: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <span className="field-label">Fuel Cost (₹)</span>
                <input
                  type="number" min="0" step="1"
                  value={completeForm.fuel_cost}
                  onChange={e => setCompleteForm(f => ({ ...f, fuel_cost: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="field">
              <span className="field-label">Trip Revenue (₹)</span>
              <input
                type="number" min="0" step="1"
                value={completeForm.revenue}
                onChange={e => setCompleteForm(f => ({ ...f, revenue: e.target.value }))}
                required
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setCompleteTripId(null)}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Saving…' : 'Complete Trip'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}