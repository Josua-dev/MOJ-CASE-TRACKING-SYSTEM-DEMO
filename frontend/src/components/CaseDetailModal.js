import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import CaseModal from './CaseModal';
import DocumentPanel from './DocumentPanel';
import { useToast } from '../context/ToastContext';

/* ── Colour-coded status badge ─────────────────────────── */
function StatusBadge({ status }) {
  const colorMap = {
    open: 'var(--success)',
    active: 'var(--info)',
    pending: 'var(--warning)',
    closed: 'var(--text-tertiary)',
  };
  const bgMap = {
    open: 'var(--success-light)',
    active: 'var(--info-light)',
    pending: 'var(--warning-light)',
    closed: 'var(--surface-active)',
  };
  const cls = status?.toLowerCase() || '';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px 3px 8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 12,
        backgroundColor: bgMap[cls] || 'var(--surface-active)',
        color: colorMap[cls] || 'var(--text-tertiary)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

export default function CaseDetailModal({ caseData, onClose, onUpdated }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('details');
  const { success, error: toastError } = useToast();
  const modalRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/cases/${caseData.id}`);
      setDetail(data.data);
      setError('');
    } catch {
      setDetail(null);
      setError('Failed to load case details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [caseData.id]);

  // Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function submitNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      await axios.post(`/api/cases/${caseData.id}/logs`, {
        note: note.trim(),
      });
      setNote('');
      success('Note added successfully.');
      load();
    } catch {
      toastError('Failed to add note.');
    } finally {
      setAddingNote(false);
    }
  }

  function formatDate(d) {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-NA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  }

  function formatDateTime(d) {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('en-NA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d;
    }
  }

  /* ── Detail row helper ───────────────────────────────── */
  function DetailRow({ label, value, highlight }) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '8px 0',
          borderBottom: '1px solid var(--border)',
          gap: 'var(--space-3)',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
            flexShrink: 0,
            minWidth: 110,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '0.85rem',
            textAlign: 'right',
            wordBreak: 'break-word',
            fontWeight: highlight ? 500 : 400,
            color: highlight
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
          }}
        >
          {value}
        </span>
      </div>
    );
  }

  if (editing) {
    return (
      <CaseModal
        existing={detail}
        onClose={() => {
          setEditing(false);
          onClose();
        }}
        onSaved={() => {
          setEditing(false);
          onUpdated();
        }}
      />
    );
  }

  return (
    <motion.div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Case ${caseData.case_number}`}
      ref={modalRef}
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
        className="modal modal-lg"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--glass-border)',
          boxShadow:
            '0 32px 64px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.06)',
          maxWidth: 780,
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
        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
              color: 'var(--text-tertiary)',
            }}
          >
            <div
              className="spinner"
              style={{ margin: '0 auto 16px' }}
            />
            <span style={{ fontSize: '0.85rem' }}>
              Loading case details...
            </span>
          </div>
        ) : error ? (
          <div
            className="error-state"
            style={{ padding: 'var(--space-10)' }}
          >
            <svg
              className="error-state-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="40"
              height="40"
              style={{ color: 'var(--danger)', marginBottom: 8 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3>Error loading case</h3>
            <p>{error}</p>
            <button
              className="btn btn-ghost"
              onClick={load}
              style={{ marginTop: 12 }}
            >
              Try Again
            </button>
          </div>
        ) : !detail ? (
          <div
            style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            No data found.
          </div>
        ) : (
          <>
            {/* ── Header ────────────────────────────────── */}
            <div
              className="modal-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  className="case-number"
                  style={{
                    fontFamily: "'SF Mono','Consolas','Monaco',monospace",
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                  }}
                >
                  {detail.case_number}
                </span>
                <StatusBadge status={detail.status} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditing(true)}
                  aria-label="Edit case"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="14"
                    height="14"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
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
            </div>

            {/* ── Body ──────────────────────────────────── */}
            <div
              className="modal-body"
              style={{
                padding: 'var(--space-5)',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* Tab bar */}
              <div
                role="tablist"
                aria-label="Case detail tabs"
                style={{
                  display: 'flex',
                  gap: 0,
                  borderBottom: '1px solid var(--border)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {['details', 'documents'].map((t) => (
                  <button
                    key={t}
                    role="tab"
                    id={`tab-${t}`}
                    aria-selected={tab === t}
                    aria-controls={`tabpanel-${t}`}
                    onClick={() => setTab(t)}
                    style={{
                      padding: '8px 18px',
                      background: 'none',
                      border: 'none',
                      borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
                      cursor: 'pointer',
                      fontWeight: tab === t ? 600 : 400,
                      color:
                        tab === t
                          ? 'var(--primary)'
                          : 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                  >
                    {t === 'details' ? 'Details' : 'Documents'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === 'details' ? (
                  <motion.div
                    key="details"
                    role="tabpanel"
                    id="tabpanel-details"
                    aria-labelledby="tab-details"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-5)',
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* ── Left column: case info ────────── */}
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                    >
                      <h4
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          marginBottom: 'var(--space-3)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {detail.title}
                      </h4>

                      {/* Case Information */}
                      <div
                        style={{
                          marginBottom: 'var(--space-4)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border)',
                            background: 'var(--surface-hover)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          Case Information
                        </div>
                        <div style={{ padding: '2px 14px 8px' }}>
                          <DetailRow
                            label="Type"
                            value={
                              <span
                                className={`badge badge-${detail.case_type.toLowerCase()}`}
                                style={{
                                  display: 'inline-flex',
                                  padding: '2px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  borderRadius: 10,
                                }}
                              >
                                {detail.case_type}
                              </span>
                            }
                          />
                          <DetailRow
                            label="Priority"
                            value={
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                              >
                                <span
                                  className={`priority-dot priority-${detail.priority.toLowerCase()}`}
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                  }}
                                />
                                {detail.priority}
                              </span>
                            }
                          />
                          <DetailRow label="Status" value={<StatusBadge status={detail.status} />} />
                          <DetailRow
                            label="Hearing Date"
                            value={detail.hearing_date || '—'}
                          />
                          <DetailRow
                            label="Next Action"
                            value={detail.next_action || '—'}
                          />
                          <DetailRow
                            label="Description"
                            value={
                              detail.description || 'No description provided.'
                            }
                          />
                        </div>
                      </div>

                      {/* Parties */}
                      <div
                        style={{
                          marginBottom: 'var(--space-4)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border)',
                            background: 'var(--surface-hover)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          Parties
                        </div>
                        <div style={{ padding: '2px 14px 8px' }}>
                          <DetailRow
                            label="Plaintiff"
                            value={detail.plaintiff}
                            highlight
                          />
                          <DetailRow
                            label="Defendant"
                            value={detail.defendant}
                            highlight
                          />
                          <DetailRow
                            label="Presiding Officer"
                            value={detail.presiding_officer || '—'}
                          />
                          <DetailRow
                            label="Filed On"
                            value={formatDate(detail.created_at)}
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* ── Right column: audit & notes ────── */}
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.2,
                        delay: 0.1,
                      }}
                    >
                      {/* Audit Log Timeline */}
                      <div
                        style={{
                          marginBottom: 'var(--space-4)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border)',
                            background: 'var(--surface-hover)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          Audit Log
                        </div>
                        <div style={{ padding: '4px 0' }}>
                          {detail.logs && detail.logs.length > 0 ? (
                            <div
                              style={{
                                position: 'relative',
                                paddingLeft: 28,
                              }}
                            >
                              {/* Vertical timeline line */}
                              <div
                                style={{
                                  position: 'absolute',
                                  left: 12,
                                  top: 12,
                                  bottom: 12,
                                  width: 2,
                                  background: 'var(--border)',
                                  borderRadius: 1,
                                }}
                              />
                              {detail.logs.map((log, idx) => (
                                <motion.div
                                  key={log.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.15,
                                    delay: idx * 0.04,
                                  }}
                                  style={{
                                    position: 'relative',
                                    padding: '10px 14px 10px 4px',
                                    borderBottom:
                                      idx < detail.logs.length - 1
                                        ? 'none'
                                        : 'none',
                                  }}
                                >
                                  {/* Timeline dot */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: -16,
                                      top: 14,
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      background: 'var(--primary)',
                                      border: '2px solid var(--surface)',
                                      zIndex: 1,
                                    }}
                                  />
                                  <div
                                    style={{
                                      fontSize: '0.85rem',
                                      fontWeight: 600,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    {log.action}
                                  </div>
                                  {log.note && (
                                    <div
                                      style={{
                                        fontSize: '0.82rem',
                                        color: 'var(--text-secondary)',
                                        marginTop: 3,
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {log.note}
                                    </div>
                                  )}
                                  <div
                                    style={{
                                      fontSize: '0.72rem',
                                      color: 'var(--text-tertiary)',
                                      marginTop: 4,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        background: 'var(--text-tertiary)',
                                      }}
                                    />
                                    {log.user_name || 'System'}
                                    <span
                                      style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        background: 'var(--text-tertiary)',
                                      }}
                                    />
                                    {formatDateTime(log.performed_at)}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p
                              style={{
                                color: 'var(--text-tertiary)',
                                fontSize: '0.85rem',
                                padding: '28px 14px',
                                textAlign: 'center',
                              }}
                            >
                              No audit records yet.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Add Note Form */}
                      <div
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          overflow: 'hidden',
                          marginBottom: 0,
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border)',
                            background: 'var(--surface-hover)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          Add Note
                        </div>
                        <div style={{ padding: 14 }}>
                          <form onSubmit={submitNote}>
                            <textarea
                              className="form-textarea"
                              rows={3}
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="Enter a case note..."
                              aria-label="Case note"
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '0.85rem',
                                fontFamily: 'inherit',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                background: 'var(--surface)',
                                color: 'var(--text-primary)',
                                resize: 'vertical',
                                minHeight: 70,
                                outline: 'none',
                                transition:
                                  'border-color 0.15s, box-shadow 0.15s',
                                marginBottom: 10,
                              }}
                            />
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}
                            >
                              <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={addingNote || !note.trim()}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '7px 16px',
                                  fontSize: '0.82rem',
                                  fontWeight: 500,
                                  borderRadius: 6,
                                  border: 'none',
                                  background: 'var(--primary)',
                                  color: 'var(--text-inverse)',
                                  cursor:
                                    addingNote || !note.trim()
                                      ? 'not-allowed'
                                      : 'pointer',
                                  opacity:
                                    addingNote || !note.trim() ? 0.55 : 1,
                                  transition: 'all 0.12s',
                                }}
                              >
                                {addingNote ? (
                                  <>
                                    <span
                                      style={{
                                        width: 14,
                                        height: 14,
                                        border:
                                          '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        animation:
                                          'spin 0.6s linear infinite',
                                        display: 'inline-block',
                                      }}
                                    />
                                    Saving...
                                  </>
                                ) : (
                                  'Add Note'
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="documents"
                    role="tabpanel"
                    id="tabpanel-documents"
                    aria-labelledby="tab-documents"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <DocumentPanel caseId={detail.id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ────────────────────────────────── */}
            <div
              className="modal-footer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-5)',
                borderTop: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <div />
              <button className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
