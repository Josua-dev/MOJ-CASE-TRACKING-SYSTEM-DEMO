import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ROLES = ['admin', 'manager', 'clerk'];

// ── Inline style tokens ─────────────────────────────────────
const glassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 'var(--radius-lg, 16px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
  overflow: 'hidden',
};

const pageContainer = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px',
};

// ── Role badge colors ──────────────────────────────────────
const ROLE_STYLES = {
  admin:   { bg: 'rgba(239,68,68,0.15)',   text: 'var(--danger, #ef4444)',   label: 'Admin' },
  manager: { bg: 'rgba(59,130,246,0.15)',  text: 'var(--info, #3b82f6)',    label: 'Manager' },
  clerk:   { bg: 'rgba(34,197,94,0.15)',   text: 'var(--success, #22c55e)', label: 'Clerk' },
};

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.clerk;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: s.bg,
        color: s.text,
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.text, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ── Animation variants ─────────────────────────────────────
const tableRowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.2, ease: 'easeOut' },
  }),
};

// ── User Modal ─────────────────────────────────────────────
function UserModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(existing ? { name: existing.name, email: existing.email, role: existing.role, password: '' } : { name: '', email: '', password: '', role: 'clerk' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    if (!existing && !form.password) { setError('Password is required.'); return; }
    setSaving(true); setError('');
    onSaved(form);
  }

  return (
    <motion.div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.2 }}>
        <div className="modal-header">
          <h3>{existing ? 'Edit User' : 'New User'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="login-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>{error}</div>}
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Role</label>
                <select className="form-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{existing ? 'New Password (leave blank to keep current)' : 'Password'}</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} minLength={6} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : existing ? 'Save Changes' : 'Create User'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Main Users Page ────────────────────────────────────────
export default function Users() {
  const { user: currentUser } = useAuth();
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.get('/api/users');
      setUsers(data.data || []);
    } catch { setError('Failed to load users.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleSave(form) {
    try {
      if (editing) {
        await axios.put(`/api/users/${editing.id}`, form);
        success('User updated.');
      } else {
        await axios.post('/api/users', form);
        success('User created.');
      }
      setShowModal(false); setEditing(null);
      fetchUsers();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to save user.');
    }
  }

  async function handleToggleActive(u) {
    try {
      await axios.put(`/api/users/${u.id}`, { active: !u.active });
      success(u.active ? 'User disabled.' : 'User enabled.');
      fetchUsers();
    } catch { toastError('Failed to update user status.'); }
  }

  async function handleDelete(u) {
    if (u.id === currentUser?.id) { toastError('You cannot delete yourself.'); return; }
    if (!window.confirm(`Delete user "${u.name}"?`)) return;
    try {
      await axios.delete(`/api/users/${u.id}`);
      success('User deleted.');
      fetchUsers();
    } catch { toastError('Failed to delete user.'); }
  }

  return (
    <motion.div
      style={pageContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* ── Page header ─────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              User Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 15 }}>
              Manage system users and roles
            </p>
          </div>
          <motion.button
            className="btn btn-primary"
            onClick={() => { setEditing(null); setShowModal(true); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New User
          </motion.button>
        </div>
      </div>

      {/* ── Glass card ──────────────────────────────────── */}
      <motion.div
        style={glassCard}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06, ease: 'easeOut' }}
      >
        <div
          style={{
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Users</h3>
          {!loading && !error && (
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              {users.length} registered
            </span>
          )}
        </div>
        <div className="card-body compact" style={{ padding: 0 }}>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-tertiary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  /* ── Loading skeleton ──────────────────── */
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {[0, 1, 2, 3, 4, 5].map(c => (
                        <td key={c} style={{ padding: '12px 16px' }}>
                          <div
                            className="skeleton"
                            style={{
                              height: 14,
                              width: c === 1 ? '70%' : c === 5 ? '40%' : '55%',
                              borderRadius: 4,
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  /* ── Error state ───────────────────────── */
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5" width="40" height="40" style={{ marginBottom: 12, opacity: 0.6 }}>
                          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px' }}>{error}</p>
                        <motion.button
                          className="btn btn-ghost"
                          onClick={fetchUsers}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Retry
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  /* ── Empty state ───────────────────────── */
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" width="48" height="48" style={{ marginBottom: 16, opacity: 0.4 }}>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <h3 style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 17 }}>No users yet</h3>
                        <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px', fontSize: 14 }}>
                          Click "New User" to add the first system user.
                        </p>
                        <motion.button
                          className="btn btn-primary"
                          onClick={() => { setEditing(null); setShowModal(true); }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          New User
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* ── User rows ─────────────────────────── */
                  users.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      custom={i}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      style={{
                        opacity: u.active ? 1 : 0.5,
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'; }}
                    >
                      <td style={{ padding: '10px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>{u.name}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <RoleBadge role={u.role} />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '2px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500,
                            background: u.active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                            color: u.active ? 'var(--success)' : 'var(--text-tertiary)',
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: u.active ? 'var(--success)' : 'var(--text-tertiary)' }} />
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-tertiary)', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {u.created_at?.slice(0, 10)}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <motion.button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setEditing(u); setShowModal(true); }}
                            title="Edit"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{ borderRadius: 6, padding: '4px 8px', fontSize: 14, lineHeight: 1 }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </motion.button>
                          <motion.button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleToggleActive(u)}
                            title={u.active ? 'Disable' : 'Enable'}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{ borderRadius: 6, padding: '4px 8px', fontSize: 14, lineHeight: 1 }}
                          >
                            {u.active ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                              </svg>
                            )}
                          </motion.button>
                          <motion.button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(u)}
                            title="Delete"
                            disabled={u.id === currentUser?.id}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: 14,
                              lineHeight: 1,
                              color: u.id === currentUser?.id ? 'var(--text-tertiary)' : 'var(--danger)',
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ── User modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <UserModal
            existing={editing}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSaved={handleSave}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
