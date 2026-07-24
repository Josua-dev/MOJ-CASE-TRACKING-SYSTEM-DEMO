import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const SESSION_COLORS = {
  'Hearing':     { bg: 'var(--info-light)', text: 'var(--info)', border: 'var(--info)' },
  'Trial':       { bg: 'var(--danger-light)', text: 'var(--danger)', border: 'var(--danger)' },
  'Bail':        { bg: 'var(--warning-light)', text: 'var(--warning)', border: 'var(--warning)' },
  'Pre-Trial':   { bg: 'var(--success-light)', text: 'var(--success)', border: 'var(--success)' },
  'Judgement':   { bg: 'var(--primary-light)', text: 'var(--primary)', border: 'var(--primary)' },
  'Conference':  { bg: 'var(--accent-light)', text: 'var(--accent)', border: 'var(--accent)' },
};

const DEFAULT_COLOR = { bg: 'var(--surface-active)', text: 'var(--text-secondary)', border: 'var(--border)' };
const STATUS_COLORS = { Scheduled: 'var(--info)', Completed: 'var(--success)', Cancelled: 'var(--danger)', Adjourned: 'var(--warning)' };

function getSessionColor(type) {
  return SESSION_COLORS[type] || DEFAULT_COLOR;
}

function SessionModal({ session, courtrooms, cases, onClose, onSaved, onDeleted }) {
  const isNew = !session?.id;
  const [form, setForm] = useState({
    case_id: session?.case_id || '',
    courtroom_id: session?.courtroom_id || '',
    magistrate: session?.magistrate || '',
    session_date: session?.session_date || '',
    start_time: session?.start_time || '',
    end_time: session?.end_time || '',
    session_type: session?.session_type || 'Hearing',
    notes: session?.notes || '',
    status: session?.status || 'Scheduled',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { success, error: toastError } = useToast();

  const handleChange = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    if (!form.case_id || !form.session_date || !form.start_time) {
      toastError('Case, date, and start time are required.');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await axios.post('/api/scheduling/sessions', form);
        success('Session created.');
      } else {
        await axios.put(`/api/scheduling/sessions/${session.id}`, form);
        success('Session updated.');
      }
      onSaved();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to save session.');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this court session?')) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/scheduling/sessions/${session.id}`);
      success('Session deleted.');
      onDeleted();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to delete.');
    } finally { setDeleting(false); }
  }

  return (
    <motion.div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="modal modal-sm"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="modal-header">
          <h3>{isNew ? 'New Session' : 'Edit Session'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Case *</label>
              <select className="form-select" value={form.case_id} onChange={handleChange('case_id')} required>
                <option value="">— Select Case —</option>
                {(cases || []).map(c => (
                  <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.session_date} onChange={handleChange('session_date')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Start *</label>
                <input className="form-input" type="time" value={form.start_time} onChange={handleChange('start_time')} required />
              </div>
              <div className="form-group">
                <label className="form-label">End</label>
                <input className="form-input" type="time" value={form.end_time} onChange={handleChange('end_time')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Courtroom</label>
                <select className="form-select" value={form.courtroom_id} onChange={handleChange('courtroom_id')}>
                  <option value="">— None —</option>
                  {(courtrooms || []).map(cr => (
                    <option key={cr.id} value={cr.id}>{cr.name}{cr.location ? ` (${cr.location})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.session_type} onChange={handleChange('session_type')}>
                  {Object.keys(SESSION_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Magistrate</label>
              <input className="form-input" value={form.magistrate} onChange={handleChange('magistrate')} placeholder="Magistrate name" />
            </div>
            {!isNew && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={handleChange('status')}>
                  {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={3} value={form.notes} onChange={handleChange('notes')} placeholder="Session notes..." />
            </div>
          </div>
          <div className="modal-footer">
            <div>
              {!isNew && (
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
            <div className="modal-footer-right">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving...' : isNew ? 'Create Session' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function SessionDetailModal({ session, onClose }) {
  if (!session) return null;
  const color = getSessionColor(session.session_type);
  return (
    <motion.div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="modal modal-sm"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="modal-header">
          <h3>Session Details</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-section-title">Session</div>
            <div className="detail-row">
              <span className="detail-label">Type</span>
              <span className="detail-value"><span className="session-type-badge" style={{ background: color.bg, color: color.text, borderColor: color.border }}>{session.session_type}</span></span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{session.session_date}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Time</span>
              <span className="detail-value">{session.start_time}{session.end_time ? ` — ${session.end_time}` : ''}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span style={{ color: STATUS_COLORS[session.status] || 'inherit', fontWeight: 500 }}>{session.status}</span>
              </span>
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-section-title">Case</div>
            <div className="detail-row">
              <span className="detail-label">Number</span>
              <span className="detail-value">{session.case_number || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Title</span>
              <span className="detail-value">{session.case_title || '—'}</span>
            </div>
          </div>
          <div className="detail-section" style={{ marginBottom: 0 }}>
            <div className="detail-section-title">Courtroom & Magistrate</div>
            <div className="detail-row">
              <span className="detail-label">Courtroom</span>
              <span className="detail-value">{session.courtroom_name || '—'}</span>
            </div>
            <div className="detail-row" style={{ border: 'none' }}>
              <span className="detail-label">Magistrate</span>
              <span className="detail-value">{session.magistrate || '—'}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CalendarCell({ day, dateStr, sessions, today, currentMonth, onDayClick, onSessionClick }) {
  const isToday = dateStr === today;
  const isCurrentMonth = day !== null;
  const daySessions = sessions || [];
  const maxVisible = 2;

  return (
    <motion.div
      className={`calendar-cell ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
      onClick={() => isCurrentMonth && onDayClick(dateStr)}
      whileHover={isCurrentMonth ? { backgroundColor: 'var(--surface-hover)' } : {}}
      transition={{ duration: 0.12 }}
    >
      <div className="calendar-cell-header">
        <span className={`calendar-cell-day ${isToday ? 'today-badge' : ''}`}>
          {day !== null ? day : ''}
        </span>
        {daySessions.length > 0 && <span className="calendar-cell-count">{daySessions.length}</span>}
      </div>
      <div className="calendar-cell-sessions">
        {daySessions.slice(0, maxVisible).map(s => {
          const c = getSessionColor(s.session_type);
          return (
            <button
              key={s.id}
              className="calendar-session-chip"
              style={{ background: c.bg, color: c.text, borderLeftColor: c.border }}
              onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
              title={`${s.session_type} — ${s.start_time}${s.case_number ? ` (${s.case_number})` : ''}`}
            >
              <span className="chip-time">{s.start_time}</span>
              <span className="chip-title">{s.case_number || s.session_type}</span>
            </button>
          );
        })}
        {daySessions.length > maxVisible && (
          <span className="calendar-more">+{daySessions.length - maxVisible} more</span>
        )}
      </div>
    </motion.div>
  );
}

export default function Calendar() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [sessions, setSessions] = useState([]);
  const [courtrooms, setCourtrooms] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courtroomFilter, setCourtroomFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const { success, error: toastError } = useToast();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Load reference data (courtrooms, cases) ──────────────────
  useEffect(() => {
    Promise.all([
      axios.get('/api/scheduling/courtrooms').then(r => r.data.data || []).catch(() => []),
      axios.get('/api/cases').then(r => r.data.data || []).catch(() => []),
    ]).then(([rooms, cases]) => {
      setCourtrooms(rooms);
      setCases(cases);
    });
  }, []);

  // ── Build date range for current month ────────────────────
  const monthRange = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Pad to start from Sunday
    const padStart = firstDay.getDay();
    const padEnd = 6 - lastDay.getDay();
    const fromDate = new Date(year, month, 1 - padStart);
    const toDate = new Date(year, month + 1, 0 + padEnd);
    return {
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
    };
  }, [year, month]);

  // ── Fetch sessions ────────────────────────────────────────
  async function fetchSessions() {
    setLoading(true);
    setError('');
    try {
      const params = { from: monthRange.from, to: monthRange.to };
      if (courtroomFilter) params.courtroom_id = courtroomFilter;
      const { data } = await axios.get('/api/scheduling/sessions/range', { params });
      setSessions(data.data || []);
    } catch {
      setError('Failed to load sessions.');
      setSessions([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchSessions(); }, [monthRange.from, monthRange.to, courtroomFilter]);

  // ── Calendar grid ─────────────────────────────────────────
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const padStart = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const grid = [];
    let day = 1;
    let nextMonthDay = 1;
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        if (w === 0 && d < padStart) {
          // Previous month
          const dStr = `${year}-${String(month).padStart(2, '0')}-${String(prevMonthDays - padStart + d + 1).padStart(2, '0')}`;
          week.push({ display: null, dateStr: null, sessions: [] });
        } else if (day > daysInMonth) {
          // Next month
          week.push({ display: null, dateStr: null, sessions: [] });
          nextMonthDay++;
        } else {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const daySessions = sessions.filter(s => s.session_date === dateStr);
          week.push({ display: day, dateStr, sessions: daySessions });
          day++;
        }
      }
      grid.push(week);
      if (day > daysInMonth && w >= 3) break;
    }
    return grid;
  }, [year, month, sessions]);

  // ── Navigation ────────────────────────────────────────────
  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));

  // ── Event handlers ────────────────────────────────────────
  const handleDayClick = useCallback((dateStr) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    setEditingSession(null);
    setShowModal(true);
  }, []);

  const handleSessionClick = useCallback((session) => {
    setViewingSession(session);
  }, []);

  const handleNewSession = () => {
    setEditingSession(null);
    setSelectedDate('');
    setShowModal(true);
  };

  const handleModalSaved = () => {
    setShowModal(false);
    setEditingSession(null);
    fetchSessions();
  };

  const handleModalDeleted = () => {
    setShowModal(false);
    setEditingSession(null);
    setViewingSession(null);
    fetchSessions();
  };

  const handleEditFromView = () => {
    setEditingSession(viewingSession);
    setViewingSession(null);
    setShowModal(true);
  };

  const sessionCount = sessions.length;
  const summary = useMemo(() => {
    const counts = {};
    sessions.forEach(s => { counts[s.session_type] = (counts[s.session_type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  return (
    <motion.div
      className="calendar-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <motion.button className="btn btn-ghost btn-sm" onClick={prevMonth} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label="Previous month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </motion.button>
          <h3 className="calendar-title">{MONTHS[month]} {year}</h3>
          <motion.button className="btn btn-ghost btn-sm" onClick={nextMonth} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label="Next month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </motion.button>
          <motion.button className="btn btn-ghost btn-sm" onClick={goToday} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Today</motion.button>
        </div>
        <div className="calendar-actions">
          <select
            className="form-select"
            value={courtroomFilter}
            onChange={e => setCourtroomFilter(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="">All Courtrooms</option>
            {courtrooms.map(cr => <option key={cr.id} value={cr.id}>{cr.name}</option>)}
          </select>
          <motion.button className="btn btn-primary btn-sm" onClick={handleNewSession} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Session
          </motion.button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="calendar-summary">
        <span className="calendar-summary-item">
          <strong>{sessionCount}</strong> session{sessionCount !== 1 ? 's' : ''} this month
        </span>
        {summary.slice(0, 4).map(([type, count]) => {
          const color = getSessionColor(type);
          return (
            <span key={type} className="calendar-summary-item">
              <span className="summary-dot" style={{ background: color.border }} />
              {type}: {count}
            </span>
          );
        })}
      </div>

      {/* Loading / Error */}
      {error && (
        <div className="error-state" style={{ marginBottom: 16 }}>
          <p>{error}</p>
          <button className="btn btn-ghost btn-sm" onClick={fetchSessions}>Retry</button>
        </div>
      )}

      {/* Calendar Grid */}
      {loading ? (
        <div className="calendar-grid-skeleton">
          {Array.from({ length: 5 }).map((_, w) => (
            <div key={w} className="calendar-week-skeleton">
              {Array.from({ length: 7 }).map((_, d) => (
                <div key={d} className="skeleton" style={{ height: 100, borderRadius: 8 }} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {DAYS.map(d => <div key={d} className="calendar-weekday">{d}</div>)}
          </div>
          {calendarGrid.map((week, wi) => (
            <div key={wi} className="calendar-week">
              {week.map((cell, di) => (
                <CalendarCell
                  key={di}
                  day={cell.display}
                  dateStr={cell.dateStr}
                  sessions={cell.sessions}
                  today={todayStr}
                  currentMonth={cell.dateStr !== null}
                  onDayClick={handleDayClick}
                  onSessionClick={handleSessionClick}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && sessions.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h3>No sessions scheduled</h3>
          <p>Click "New Session" to schedule a court session for this month.</p>
        </div>
      )}

      {/* Session create/edit modal */}
      <AnimatePresence>
        {showModal && (
          <SessionModal
            session={editingSession ? { ...editingSession, session_date: editingSession.session_date || selectedDate } : { session_date: selectedDate }}
            courtrooms={courtrooms}
            cases={cases}
            onClose={() => { setShowModal(false); setEditingSession(null); }}
            onSaved={handleModalSaved}
            onDeleted={handleModalDeleted}
          />
        )}
      </AnimatePresence>

      {/* Session detail modal */}
      <AnimatePresence>
        {viewingSession && (
          <SessionDetailModal
            session={viewingSession}
            onClose={() => setViewingSession(null)}
          />
        )}
      </AnimatePresence>

      {/* Session detail → edit */}
      {viewingSession && (
        <motion.button
          className="btn btn-primary btn-sm"
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, boxShadow: 'var(--shadow-lg)' }}
          onClick={handleEditFromView}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Edit Session
        </motion.button>
      )}
    </motion.div>
  );
}
