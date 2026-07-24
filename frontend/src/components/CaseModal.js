import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';

const EMPTY = {
  title: '', case_type: 'Criminal', status: 'Open', priority: 'Medium',
  plaintiff: '', defendant: '', presiding_officer: '', hearing_date: '',
  next_action: '', description: '',
};

const CASE_TYPES = ['Criminal', 'Civil', 'Family', 'Commercial', 'Labour'];
const STATUSES = ['Open', 'Active', 'Pending', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function CaseModal({ onClose, onSaved, existing }) {
  const [form, setForm] = useState(existing ? { ...existing } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Trap focus inside modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const focusable = document.querySelectorAll('.modal input, .modal select, .modal textarea, .modal button:not([disabled])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function set(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(prev => ({ ...prev, [k]: undefined }));
    if (error) setError('');
  }

  function validate() {
    const errs = {};
    if (!form.title?.trim()) errs.title = 'Case title is required.';
    if (!form.plaintiff?.trim()) errs.plaintiff = 'Plaintiff name is required.';
    if (!form.defendant?.trim()) errs.defendant = 'Defendant name is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError('');
    try {
      if (existing) {
        await axios.put(`/api/cases/${existing.id}`, form);
      } else {
        await axios.post('/api/cases', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save case.');
    } finally {
      setSaving(false);
    }
  }

  const Field = ({ name, label, type = 'text', required, options, placeholder }) => {
    const hasError = !!fieldErrors[name];
    if (options) {
      return (
        <div className="form-group">
          <label className="form-label" htmlFor={`field-${name}`}>
            {label}{required && <span className="required">*</span>}
          </label>
          <select
            id={`field-${name}`}
            className={`form-select ${hasError ? 'error' : ''}`}
            value={form[name]}
            onChange={e => set(name, e.target.value)}
          >
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
          {hasError && <p className="form-error">{fieldErrors[name]}</p>}
        </div>
      );
    }
    if (type === 'textarea') {
      return (
        <div className="form-group">
          <label className="form-label" htmlFor={`field-${name}`}>
            {label}{required && <span className="required">*</span>}
          </label>
          <textarea
            id={`field-${name}`}
            className={`form-textarea ${hasError ? 'error' : ''}`}
            value={form[name]}
            onChange={e => set(name, e.target.value)}
            rows={3}
            placeholder={placeholder}
          />
          {hasError && <p className="form-error">{fieldErrors[name]}</p>}
        </div>
      );
    }
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={`field-${name}`}>
          {label}{required && <span className="required">*</span>}
        </label>
        <input
          id={`field-${name}`}
          ref={name === 'title' ? titleRef : undefined}
          type={type}
          className={`form-input ${hasError ? 'error' : ''}`}
          value={form[name]}
          onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
          required={required}
        />
        {hasError && <p className="form-error">{fieldErrors[name]}</p>}
      </div>
    );
  };

  return (
    <motion.div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={existing ? 'Edit case' : 'Open new case'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="modal-header">
          <h3>{existing ? 'Edit Case' : 'Open New Case'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="login-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            <Field name="title" label="Case Title" required placeholder="e.g. State v. Accused Person" />

            <div className="form-row">
              <Field name="case_type" label="Case Type" options={CASE_TYPES} />
              <Field name="status" label="Status" options={STATUSES} />
            </div>

            <div className="form-row">
              <Field name="plaintiff" label="Plaintiff" required placeholder="e.g. State of Namibia" />
              <Field name="defendant" label="Defendant" required placeholder="e.g. Accused Person" />
            </div>

            <div className="form-row">
              <Field name="presiding_officer" label="Presiding Officer" placeholder="e.g. Magistrate Shikongo" />
              <Field name="priority" label="Priority" options={PRIORITIES} />
            </div>

            <div className="form-row">
              <Field name="hearing_date" label="Hearing Date" type="date" />
              <Field name="next_action" label="Next Action" placeholder="e.g. Evidence hearing" />
            </div>

            <Field name="description" label="Description / Notes" type="textarea" placeholder="Enter case details, background information, or special instructions..." />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>
              {saving ? (
                <><span className="spinner spinner-sm" /> Saving...</>
              ) : existing ? 'Save Changes' : 'Open Case'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
