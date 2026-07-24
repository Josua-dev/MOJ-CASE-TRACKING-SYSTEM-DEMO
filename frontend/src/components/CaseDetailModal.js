import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import CaseModal from './CaseModal';
import DocumentPanel from './DocumentPanel';
import { useToast } from '../context/ToastContext';

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

  useEffect(() => { load(); }, [caseData.id]);

  // Keyboard trap + Escape
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
      await axios.post(`/api/cases/${caseData.id}/logs`, { note: note.trim() });
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
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return d; }
  }

  function formatDateTime(d) {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('en-NA', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return d; }
  }

  if (editing) {
    return (
      <CaseModal
        existing={detail}
        onClose={() => { setEditing(false); onClose(); }}
        onSaved={() => { setEditing(false); onUpdated(); }}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="modal modal-lg"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Loading case details...
          </div>
        ) : error ? (
          <div className="error-state">
            <svg className="error-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <h3>Error loading case</h3>
            <p>{error}</p>
            <button className="btn btn-ghost" onClick={load}>Try Again</button>
          </div>
        ) : !detail ? (
          <div className="modal-body text-center text-muted">No data found.</div>
        ) : (
          <>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="case-number">{detail.case_number}</span>
                <span className={`badge badge-${detail.status.toLowerCase()}`}>{detail.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} aria-label="Edit case">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
              </div>
            </div>

            <div className="modal-body">
              {/* Tab bar */}
              <div className="detail-tabs" style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-4)' }}>
                <button
                  className={`detail-tab ${tab === 'details' ? 'active' : ''}`}
                  onClick={() => setTab('details')}
                  style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === 'details' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: tab === 'details' ? 600 : 400, color: tab === 'details' ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '0.85rem' }}
                >
                  Details
                </button>
                <button
                  className={`detail-tab ${tab === 'documents' ? 'active' : ''}`}
                  onClick={() => setTab('documents')}
                  style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === 'documents' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: tab === 'documents' ? 600 : 400, color: tab === 'documents' ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '0.85rem' }}
                >
                  Documents
                </button>
              </div>

              <AnimatePresence mode="wait">
                {tab === 'details' ? (
                  <motion.div
                    key="details"
                    className="detail-grid"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    variants={{
                      visible: { transition: { staggerChildren: 0.06 } },
                    }}
              >
                {/* Case info */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>{detail.title}</h4>

                  <div className="detail-section">
                    <div className="detail-section-title">Case Information</div>
                    <div className="detail-row">
                      <span className="detail-label">Type</span>
                      <span className="detail-value"><span className={`badge badge-${detail.case_type.toLowerCase()}`}>{detail.case_type}</span></span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Priority</span>
                      <span className="detail-value">
                        <span className={`priority-dot priority-${detail.priority.toLowerCase()}`} />
                        {detail.priority}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status</span>
                      <span className="detail-value"><span className={`badge badge-${detail.status.toLowerCase()}`}>{detail.status}</span></span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Hearing Date</span>
                      <span className="detail-value">{detail.hearing_date || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Next Action</span>
                      <span className="detail-value">{detail.next_action || '—'}</span>
                    </div>
                    <div className="detail-row" style={{ border: 'none' }}>
                      <span className="detail-label">Description</span>
                      <span className="detail-value" style={{ color: 'var(--text-secondary)' }}>
                        {detail.description || 'No description provided.'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-section-title">Parties</div>
                    <div className="detail-row">
                      <span className="detail-label">Plaintiff</span>
                      <span className="detail-value" style={{ fontWeight: 500 }}>{detail.plaintiff}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Defendant</span>
                      <span className="detail-value" style={{ fontWeight: 500 }}>{detail.defendant}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Presiding Officer</span>
                      <span className="detail-value">{detail.presiding_officer || '—'}</span>
                    </div>
                    <div className="detail-row" style={{ border: 'none' }}>
                      <span className="detail-label">Filed On</span>
                      <span className="detail-value">{formatDate(detail.created_at)}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Audit log + Note form */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.2, delay: 0.1, ease: 'easeOut' }}
                >
                  <div className="detail-section">
                    <div className="detail-section-title">Audit Log</div>
                    <motion.div
                      className="audit-log"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.04 } },
                      }}
                    >
                      {detail.logs && detail.logs.length > 0 ? (
                        detail.logs.map((log) => (
                          <motion.div
                            className="log-entry"
                            key={log.id}
                            variants={{
                              hidden: { opacity: 0, x: -8 },
                              visible: { opacity: 1, x: 0 },
                            }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                          >
                            <div className="log-marker" />
                            <div className="log-content">
                              <div className="log-action">{log.action}</div>
                              {log.note && <div className="log-note">{log.note}</div>}
                              <div className="log-meta">{log.user_name || 'System'} · {formatDateTime(log.performed_at)}</div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', padding: '24px 0', textAlign: 'center' }}>
                          No audit records yet.
                        </p>
                      )}
                    </motion.div>
                  </div>

                  <div className="detail-section" style={{ marginBottom: 0 }}>
                    <div className="detail-section-title">Add Note</div>
                    <form onSubmit={submitNote}>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <textarea
                          className="form-textarea"
                          rows={3}
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder="Enter a case note..."
                          aria-label="Case note"
                          style={{ minHeight: 70 }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={addingNote || !note.trim()}>
                          {addingNote ? <><span className="spinner spinner-sm" /> Saving...</> : 'Add Note'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="documents"
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

        <div className="modal-footer">
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
