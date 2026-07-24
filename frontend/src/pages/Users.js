import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ROLES = ['admin', 'manager', 'clerk'];

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
    <div>
      <div className="dashboard-header">
        <div className="dashboard-header-row">
          <div>
            <h1>User Management</h1>
            <p>Manage system users and roles</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New User
          </button>
        </div>
      </div>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="card-header">
          <h3>Users</h3>
          {!loading && <span className="text-xs text-muted">{users.length} registered</span>}
        </div>
        <div className="card-body compact">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}><div style={{ padding: 24 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 14, marginBottom: 12, width: `${40 + i * 20}%` }} />)}</div></td></tr>
                ) : error ? (
                  <tr><td colSpan={6}><div className="error-state" style={{ padding: 32 }}><p>{error}</p><button className="btn btn-ghost" onClick={fetchUsers}>Retry</button></div></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state" style={{ padding: 32 }}><p>No users yet.</p></div></td></tr>
                ) : (
                  users.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.025, duration: 0.15 }}
                      style={{ opacity: u.active ? 1 : 0.5 }}
                    >
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td className="cell-muted">{u.email}</td>
                      <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                      <td>
                        <span className={`badge ${u.active ? 'badge-active' : 'badge-closed'}`} style={{ background: u.active ? 'var(--success-light)' : 'var(--surface-secondary)', color: u.active ? 'var(--success)' : 'var(--text-tertiary)' }}>
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="cell-muted">{u.created_at?.slice(0, 10)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(u); setShowModal(true); }} title="Edit">✎</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(u)} title={u.active ? 'Disable' : 'Enable'}>{u.active ? '⏸' : '▶'}</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(u)} title="Delete" disabled={u.id === currentUser?.id} style={{ color: u.id === currentUser?.id ? 'var(--text-tertiary)' : 'var(--danger)' }}>✕</button>
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

      <AnimatePresence>
        {showModal && (
          <UserModal
            existing={editing}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSaved={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

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
