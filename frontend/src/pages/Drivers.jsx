// frontend/src/pages/Drivers.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../permissions/permissions';
import { getDrivers, createDriver, updateDriverStatus, updateSafetyScore } from '../services/drivers';
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
  available: 'Available',
  on_trip: 'On Trip',
  off_duty: 'Off Duty',
  suspended: 'Suspended'
};

const LICENSE_CATEGORIES = ['LMV', 'HMV', 'MCWG', 'Transport'];

const EMPTY_FORM = {
  name: '',
  license_number: '',
  license_category: 'LMV',
  license_expiry_date: '',
  contact_number: '',
};

export default function Drivers() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const { data: drivers = [], loading, error, refetch } = useApi(getDrivers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [scoreDraft, setScoreDraft] = useState({});

  const filtered = useMemo(() =>
    drivers.filter(d => {
      const matchStatus = !statusFilter || d.status === statusFilter;
      const matchSearch = !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.license_number.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    }), [drivers, statusFilter, search]);

  if (!can(role, 'drivers', 'view')) return <Unauthorized />;

  const canEdit = can(role, 'drivers', 'full');

  function safetyTone(score) {
    if (score >= 85) return 'tone-green';
    if (score >= 70) return 'tone-orange';
    return 'tone-red';
  }

  function updateField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowAdd(true);
  }

  async function handleAddDriver(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.license_number.trim() || !form.license_expiry_date) {
      setFormError('Name, license number, and expiry date are required.');
      return;
    }

    setSubmitting(true);
    try {
      await createDriver({
        name: form.name.trim(),
        license_number: form.license_number.trim(),
        license_category: form.license_category,
        license_expiry_date: new Date(form.license_expiry_date).toISOString(),
        contact_number: form.contact_number.trim() || null,
      });
      setShowAdd(false);
      showToast('Driver added');
      refetch();
    } catch (err) {
      setFormError(err.message || 'Could not add driver.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(driver, newStatus) {
    if (newStatus === driver.status) return;
    setBusyId(driver.id);
    try {
      await updateDriverStatus(driver.id, newStatus);
      showToast(`${driver.name} marked ${STATUS_LABELS[newStatus] || newStatus}`);
      refetch();
    } catch (err) {
      showToast(err.message || 'Could not update status');
    } finally {
      setBusyId(null);
    }
  }

  async function handleScoreSave(driver) {
    const raw = scoreDraft[driver.id];
    const value = parseFloat(raw);
    if (raw === undefined || isNaN(value) || value < 0 || value > 100) {
      showToast('Safety score must be between 0 and 100');
      return;
    }
    setBusyId(driver.id);
    try {
      await updateSafetyScore(driver.id, value);
      showToast(`${driver.name}'s safety score updated`);
      setScoreDraft(d => { const next = { ...d }; delete next[driver.id]; return next; });
      refetch();
    } catch (err) {
      showToast(err.message || 'Could not update safety score');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">Drivers &amp; safety</span>
          <h1>Drivers</h1>
          <p>Monitor driver statuses, license validity, and safety scores.</p>
        </div>
        {canEdit && (
          <button className="primary-btn" onClick={openAdd}>
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
                <tr>
                  <th>Driver</th><th>License No.</th><th>Category</th><th>Expiry</th><th>Safety</th><th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
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
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
                          <select
                            value={d.status}
                            disabled={busyId === d.id}
                            onChange={e => handleStatusChange(d, e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--text-ink)', fontSize: 12 }}
                          >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder={Math.round(d.safety_score)}
                              value={scoreDraft[d.id] ?? ''}
                              onChange={e => setScoreDraft(s => ({ ...s, [d.id]: e.target.value }))}
                              style={{ width: 60, padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--text-ink)', fontSize: 12 }}
                            />
                            <button
                              className="np-btn np-btn-secondary np-btn-sm"
                              disabled={busyId === d.id || scoreDraft[d.id] === undefined}
                              onClick={() => handleScoreSave(d)}
                            >
                              Save
                            </button>
                          </div>
                        </div>
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
        <Modal title="Add Driver" onClose={() => setShowAdd(false)}>
          <form className="modal-form" onSubmit={handleAddDriver}>
            {formError && <div className="field-error">{formError}</div>}

            <div className="field">
              <span className="field-label">Full Name</span>
              <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} required />
            </div>

            <div className="field">
              <span className="field-label">License Number</span>
              <input type="text" value={form.license_number} onChange={e => updateField('license_number', e.target.value)} required />
            </div>

            <div className="field-row">
              <div className="field">
                <span className="field-label">License Category</span>
                <select value={form.license_category} onChange={e => updateField('license_category', e.target.value)}>
                  {LICENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <span className="field-label">License Expiry</span>
                <input type="date" value={form.license_expiry_date} onChange={e => updateField('license_expiry_date', e.target.value)} required />
              </div>
            </div>

            <div className="field">
              <span className="field-label">Contact Number</span>
              <input type="text" value={form.contact_number} onChange={e => updateField('contact_number', e.target.value)} placeholder="Optional" />
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Driver'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}