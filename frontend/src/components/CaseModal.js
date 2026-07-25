import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';

const EMPTY = {
  title: '',
  case_type: 'Criminal',
  status: 'Open',
  priority: 'Medium',
  plaintiff: '',
  defendant: '',
  presiding_officer: '',
  hearing_date: '',
  next_action: '',
  description: '',
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
        const focusable = document.querySelectorAll(
          '.modal input, .modal select, .modal textarea, .modal button:not([disabled])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function set(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (fieldErrors[k])
      setFieldErrors((prev) => ({ ...prev, [k]: undefined }));
    if (error) setError('');
  }

  function validate() {
    const errs = {};
    if (!form.title?.trim()) errs.title = 'Case title is required.';
    if (!form.plaintiff?.trim())
      errs.plaintiff = 'Plaintiff name is required.';
    if (!form.defendant?.trim())
      errs.defendant = 'Defendant name is required.';
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
    const id = `case-field-${name}`;
    const sharedInputStyle = {
      width: '100%',
      padding: '10px 12px',
      fontSize: '0.85rem',
      fontFamily: 'inherit',
      border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
      borderRadius: 8,
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      outline: 'none',
    };

    if (options) {
      return (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label
            htmlFor={id}
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: 4,
            }}
          >
            {label}
            {required && (
              <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>
            )}
          </label>
          <select
            id={id}
            value={form[name]}
            onChange={(e) => set(name, e.target.value)}
            style={{
              ...sharedInputStyle,
              cursor: 'pointer',
              appearance: 'auto',
              paddingRight: 8,
            }}
            aria-label={label}
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {hasError && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--danger)',
                marginTop: 4,
              }}
            >
              {fieldErrors[name]}
            </p>
          )}
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label
            htmlFor={id}
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: 4,
            }}
          >
            {label}
            {required && (
              <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>
            )}
          </label>
          <textarea
            id={id}
            value={form[name]}
            onChange={(e) => set(name, e.target.value)}
            rows={3}
            placeholder={placeholder}
            style={{
              ...sharedInputStyle,
              resize: 'vertical',
              minHeight: 72,
            }}
            aria-label={label}
          />
          {hasError && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--danger)',
                marginTop: 4,
              }}
            >
              {fieldErrors[name]}
            </p>
          )}
        </div>
      );
    }

    return (
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: 4,
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>
          )}
        </label>
        <input
          id={id}
          ref={name === 'title' ? titleRef : undefined}
          type={type}
          value={form[name]}
          onChange={(e) => set(name, e.target.value)}
          placeholder={placeholder}
          style={{
            ...sharedInputStyle,
          }}
          aria-label={label}
        />
        {hasError && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--danger)',
              marginTop: 4,
            }}
          >
            {fieldErrors[name]}
          </p>
        )}
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
      style={{
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="modal"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.06)',
        }}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{
          type: 'spring',
          duration: 0.35,
          bounce: 0.15,
          ease: 'easeOut',
        }}
      >
        <div
          className="modal-header"
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
            {existing ? 'Edit Case' : 'Open New Case'}
          </h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '1.3rem',
              color: 'var(--text-tertiary)',
              transition: 'all 0.12s',
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="modal-body"
            style={{
              padding: 'var(--space-5)',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  background: 'var(--danger-light)',
                  border: '1px solid rgba(185,28,28,0.25)',
                  borderRadius: 8,
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Section: Basic Info */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h4
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Basic Information
              </h4>
              <Field
                name="title"
                label="Case Title"
                required
                placeholder="e.g. State v. Accused Person"
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-3)',
                }}
              >
                <Field
                  name="case_type"
                  label="Case Type"
                  options={CASE_TYPES}
                />
                <Field name="status" label="Status" options={STATUSES} />
              </div>
            </div>

            {/* Section: Parties */}
            <div
              style={{
                marginBottom: 'var(--space-3)',
                paddingTop: 'var(--space-2)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <h4
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Parties
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-3)',
                }}
              >
                <Field
                  name="plaintiff"
                  label="Plaintiff"
                  required
                  placeholder="e.g. State of Namibia"
                />
                <Field
                  name="defendant"
                  label="Defendant"
                  required
                  placeholder="e.g. Accused Person"
                />
              </div>
            </div>

            {/* Section: Court Details */}
            <div
              style={{
                marginBottom: 'var(--space-3)',
                paddingTop: 'var(--space-2)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <h4
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Court Details
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-3)',
                }}
              >
                <Field
                  name="presiding_officer"
                  label="Presiding Officer"
                  placeholder="e.g. Magistrate Shikongo"
                />
                <Field name="priority" label="Priority" options={PRIORITIES} />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-3)',
                }}
              >
                <Field
                  name="hearing_date"
                  label="Hearing Date"
                  type="date"
                />
                <Field
                  name="next_action"
                  label="Next Action"
                  placeholder="e.g. Evidence hearing"
                />
              </div>
            </div>

            {/* Section: Notes */}
            <div
              style={{
                paddingTop: 'var(--space-2)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <h4
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Notes
              </h4>
              <Field
                name="description"
                label="Description / Notes"
                type="textarea"
                placeholder="Enter case details, background information, or special instructions..."
              />
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-5)',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
              gap: 'var(--space-2)',
            }}
          >
            <div />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-accent"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  borderRadius: 6,
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  background: '#003580',
                  color: '#fff',
                  opacity: saving ? 0.6 : 1,
                  transition: 'all 0.12s',
                }}
              >
                {saving ? (
                  <>
                    <span
                      className="spinner spinner-sm"
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                      }}
                    />
                    Saving...
                  </>
                ) : existing ? (
                  'Save Changes'
                ) : (
                  'Open Case'
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
