import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ICONS = {
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  success: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  warning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  danger:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
};

const COLOURS = {
  info:    { bg: 'var(--info-light)', text: 'var(--info)', dot: 'var(--info)' },
  success: { bg: 'var(--success-light)', text: 'var(--success)', dot: 'var(--success)' },
  warning: { bg: 'var(--warning-light)', text: 'var(--warning)', dot: 'var(--warning)' },
  danger:  { bg: 'var(--danger-light)', text: 'var(--danger)', dot: 'var(--danger)' },
};

function formatTime(dateStr) {
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-NA', { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/notifications', { params: { limit: 15 } });
      setNotifications(data.data || []);
      setUnread(data.meta?.unread || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // Fetch unread count (lightweight polling)
  const fetchUnread = useCallback(async () => {
    if (open) return; // Don't update count while panel is open
    try {
      const { data } = await axios.get('/api/notifications/unread-count');
      setUnread(data.data?.count || 0);
    } catch { /* ignore */ }
  }, [open]);

  // Poll for new notifications every 45s
  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, 45000);
    return () => clearInterval(t);
  }, [fetchUnread]);

  // Full fetch when panel opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target) &&
          panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function markRead(id) {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      setUnread(0);
    } catch { /* ignore */ }
  }

  if (!user) return null;

  return (
    <div className="notif-bell-container" ref={bellRef}>
      <motion.button
        className={`notif-bell ${unread > 0 ? 'has-unread' : ''}`}
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.12 }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <motion.span
            className="notif-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            {unread > 99 ? '99+' : unread}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            className="notif-panel"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <div className="notif-panel-header">
              <h4>Notifications</h4>
              {unread > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
              )}
            </div>

            <div className="notif-panel-body">
              {loading ? (
                <div className="notif-loading">
                  <div className="spinner spinner-sm" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((n, i) => {
                  const c = COLOURS[n.type] || COLOURS.info;
                  return (
                    <motion.div
                      key={n.id}
                      className={`notif-item ${n.read ? 'read' : ''}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.12 }}
                      onClick={() => !n.read && markRead(n.id)}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (!n.read && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          markRead(n.id);
                        }
                      }}
                    >
                      <div className="notif-icon" style={{ background: c.bg, color: c.text }}>
                        {ICONS[n.type] || ICONS.info}
                      </div>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        {n.message && <div className="notif-message">{n.message}</div>}
                        <div className="notif-time">{formatTime(n.created_at)}</div>
                      </div>
                      {!n.read && <span className="notif-unread-dot" style={{ background: c.dot }} />}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
