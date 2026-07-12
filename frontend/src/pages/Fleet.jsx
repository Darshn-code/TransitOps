// frontend/src/pages/Fleet.jsx
import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getVehicles, createVehicle, retireVehicle } from '../services/vehicles';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import { Icon } from '../components/Icons';
import StatusPill from '../components/StatusPill';
import Unauthorized from './Unauthorized';

const STATUS_LABELS = {
  available: 'Available',
  on_trip:   'On Trip',
  in_shop:   'In Shop',
  retired:   'Retired',
};

const VEHICLE_TYPES = ['Truck', 'Van', 'Bus', 'Sedan', 'Two-Wheeler'];
const REGIONS = ['Chennai', 'Bengaluru', 'Hyderabad', 'Coimbatore', 'Mumbai'];

const EMPTY_FORM = {
  registration_number: '',
  name: '',
  type: 'Truck',
  max_load_capacity: '',
  acquisition_cost: '',
  region: 'Chennai',
};

export default function Fleet() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [typeFilter,   setTypeFilter]   = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const { data: vehicles = [], loading, error, refetch } = useApi(getVehicles);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [retiringId, setRetiringId] = useState(null);

  if (!can(role, 'fleet', 'view')) return <Unauthorized />;

  const vehicleTypes   = [...new Set(vehicles.map(v => v.type).filter(Boolean))];
  const vehicleRegions = [...new Set(vehicles.map(v => v.region).filter(Boolean))];

  const filtered = useMemo(() =>
    vehicles.filter(v =>
      (!typeFilter   || v.type   === typeFilter) &&
      (!regionFilter || v.region === regionFilter)
    ), [vehicles, typeFilter, regionFilter]);

  const anyFilter = typeFilter || regionFilter;
  const canEdit = can(role, 'fleet', 'full');

  function updateField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowAdd(true);
  }

  async function handleAddVehicle(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.registration_number.trim() || !form.name.trim()) {
      setFormError('Registration number and name are required.');
      return;
    }
    const maxLoad = parseFloat(form.max_load_capacity);
    const cost = parseFloat(form.acquisition_cost);
    if (!maxLoad || maxLoad <= 0) {
      setFormError('Max load capacity must be greater than 0.');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setFormError('Acquisition cost must be 0 or more.');
      return;
    }

    setSubmitting(true);
    try {
      await createVehicle({
        registration_number: form.registration_number.trim(),
        name: form.name.trim(),
        type: form.type,
        max_load_capacity: maxLoad,
        acquisition_cost: cost,
        region: form.region || null,
      });
      setShowAdd(false);
      showToast('Vehicle added to fleet');
      refetch();
    } catch (err) {
      setFormError(err.message || 'Could not add vehicle.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetire(vehicle) {
    if (!window.confirm(`Retire ${vehicle.registration_number}? This cannot be undone.`)) return;
    setRetiringId(vehicle.id);
    try {
      await retireVehicle(vehicle.id);
      showToast(`${vehicle.registration_number} retired`);
      refetch();
    } catch (err) {
      showToast(err.message || 'Could not retire vehicle');
    } finally {
      setRetiringId(null);
    }
  }

  return (
    <div className="content">
      <PageHeader
        eyebrow="Fleet management"
        title="Vehicle registry"
        note="Manage all registered vehicles across regions and types."
        action={canEdit && (
          <button className="primary-btn" onClick={openAdd}>
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
                  {canEdit && <th>Actions</th>}
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
                    {canEdit && (
                      <td>
                        {v.status !== 'retired' ? (
                          <button
                            className="np-btn np-btn-secondary np-btn-sm"
                            disabled={retiringId === v.id}
                            onClick={() => handleRetire(v)}
                          >
                            {retiringId === v.id ? 'Retiring…' : 'Retire'}
                          </button>
                        ) : (
                          <span className="cell-sub">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Vehicle" onClose={() => setShowAdd(false)}>
          <form className="modal-form" onSubmit={handleAddVehicle}>
            {formError && <div className="field-error">{formError}</div>}

            <div className="field">
              <span className="field-label">Registration Number</span>
              <input
                type="text"
                value={form.registration_number}
                onChange={e => updateField('registration_number', e.target.value)}
                placeholder="TN-09-AB-1234"
                required
              />
            </div>

            <div className="field">
              <span className="field-label">Vehicle Name / Model</span>
              <input
                type="text"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Tata Ace"
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <span className="field-label">Type</span>
                <select value={form.type} onChange={e => updateField('type', e.target.value)}>
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <span className="field-label">Region</span>
                <select value={form.region} onChange={e => updateField('region', e.target.value)}>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <span className="field-label">Max Load Capacity (kg)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.max_load_capacity}
                  onChange={e => updateField('max_load_capacity', e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <span className="field-label">Acquisition Cost (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.acquisition_cost}
                  onChange={e => updateField('acquisition_cost', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}