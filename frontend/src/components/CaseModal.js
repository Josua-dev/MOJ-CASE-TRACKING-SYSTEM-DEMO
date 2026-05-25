import React, { useState } from 'react';
import axios from 'axios';

const EMPTY = { title: '', description: '', case_type: 'Criminal', status: 'Open', priority: 'Medium', plaintiff: '', defendant: '', presiding_officer: '', hearing_date: '', next_action: '' };

export default function CaseModal({ onClose, onSaved, existing }) {
  const [form, setForm] = useState(existing || EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.plaintiff || !form.defendant) { setError('Title, plaintiff and defendant are required.'); return; }
    setSaving(true); setError('');
    try {
      if (existing) await axios.put(`/api/cases/${existing.id}`, form);
      else await axios.post('/api/cases', form);
      onSaved();
    } catch (e) { setError(e.response?.data?.error || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{existing ? 'Edit Case' : 'Open New Case'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Case Title *</label>
            <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. State v. Surname" />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Case Type *</label>
              <select className="form-control" value={form.case_type} onChange={e => set('case_type', e.target.value)}>
                <option>Criminal</option><option>Civil</option><option>Family</option><option>Commercial</option><option>Labour</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Open</option><option>Active</option><option>Pending</option><option>Closed</option>
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Plaintiff / Complainant *</label>
              <input className="form-control" value={form.plaintiff} onChange={e => set('plaintiff', e.target.value)} placeholder="Full name or entity" />
            </div>
            <div className="form-group">
              <label className="form-label">Defendant / Respondent *</label>
              <input className="form-control" value={form.defendant} onChange={e => set('defendant', e.target.value)} placeholder="Full name or entity" />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Presiding Officer</label>
              <input className="form-control" value={form.presiding_officer} onChange={e => set('presiding_officer', e.target.value)} placeholder="Magistrate name" />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Hearing Date</label>
              <input className="form-control" type="date" value={form.hearing_date} onChange={e => set('hearing_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Next Action</label>
              <input className="form-control" value={form.next_action} onChange={e => set('next_action', e.target.value)} placeholder="e.g. Witness testimony" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description / Notes</label>
            <textarea className="form-control" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief summary of the case..." />
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : existing ? 'Save Changes' : 'Open Case'}
          </button>
        </div>
      </div>
    </div>
  );
}
