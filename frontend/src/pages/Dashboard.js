import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';

// ────────────────────────────────────────────────────────────
// Namibia flag palette — also used for chart series colours.
// ────────────────────────────────────────────────────────────
const CHART_COLORS = ['#003580', '#009543', '#C8102E', '#FFB81C', '#00A3E0'];

// ────────────────────────────────────────────────────────────
// Injected styles — theme-aware glass backgrounds + keyframes
// ────────────────────────────────────────────────────────────
(function injectDashboardStyles() {
  if (typeof document === 'undefined') return;
  const id = 'dash-glass-styles';
  if (document.getElementById(id)) return;

  const s = document.createElement('style');
  s.id = id;
  s.textContent = `
    .dash-glass {
      background: rgba(255,255,255,0.55);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.05);
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }

    @media (prefers-color-scheme: dark) {
      .dash-glass {
        background: rgba(255,255,255,0.04);
        border-color: rgba(255,255,255,0.06);
        box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      }
    }
    [data-theme="dark"] .dash-glass,
    .dark .dash-glass {
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.06);
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    }

    @keyframes dashPulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 0.2; }
    }

    .dash-skeleton-glass {
      border-radius: 8px;
      background: rgba(255,255,255,0.07);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      animation: dashPulse 1.8s ease-in-out infinite;
    }
  `;
  document.head.appendChild(s);
})();

// ────────────────────────────────────────────────────────────
// Animated counter — counts from 0 → value on mount / change
// ────────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }

    startTimeRef.current = null;

    function step(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic — smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(value * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

// ────────────────────────────────────────────────────────────
// Skeleton components — pulsing glass style
// ────────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = 16, borderRadius = 8, style = {} }) {
  return (
    <div
      className="dash-skeleton-glass"
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div
      className="dash-glass"
      style={{ padding: 24, animation: 'dashPulse 1.8s ease-in-out infinite' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Skeleton width={80} height={14} />
        <Skeleton width={40} height={40} borderRadius={10} />
      </div>
      <Skeleton width={100} height={30} style={{ marginBottom: 6 }} />
      <Skeleton width={60} height={12} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SVG icons (unchanged)
// ────────────────────────────────────────────────────────────
const FOLDER_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
);
const SCALES_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M4 5l8 3 8-3M6 12a6 6 0 0 0 12 0"/></svg>
);
const ARCHIVE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
);
const FLAG_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>
);

// ────────────────────────────────────────────────────────────
// Stat card config — each gets a Namibia-flag gradient
// ────────────────────────────────────────────────────────────
const STATS_CARDS = [
  {
    key: 'total',
    label: 'Total Cases',
    icon: FOLDER_ICON,
    gradient: 'linear-gradient(135deg, #003580 0%, #004c9e 100%)',
    glow: 'rgba(0, 53, 128, 0.25)',
    subtitle: 'Total cases in the system',
  },
  {
    key: 'active',
    label: 'Active',
    icon: SCALES_ICON,
    gradient: 'linear-gradient(135deg, #009543 0%, #00b851 100%)',
    glow: 'rgba(0, 149, 67, 0.25)',
    subtitle: 'Currently active',
  },
  {
    key: 'open',
    label: 'Open',
    icon: ARCHIVE_ICON,
    gradient: 'linear-gradient(135deg, #FFB81C 0%, #ffcc4d 100%)',
    glow: 'rgba(255, 184, 28, 0.25)',
    subtitle: 'Cases awaiting action',
  },
  {
    key: 'high',
    label: 'High Priority',
    icon: FLAG_ICON,
    gradient: 'linear-gradient(135deg, #C8102E 0%, #e0203e 100%)',
    glow: 'rgba(200, 16, 46, 0.25)',
    subtitle: 'Requires immediate attention',
  },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
function getFormattedDateTime() {
  const now = new Date();
  return {
    dateStr: now.toLocaleDateString('en-NA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    timeStr: now.toLocaleTimeString('en-NA', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function StatusBreakdown({ label, statKey, color, stats }) {
  const pct = stats.total > 0 ? ((stats[statKey] || 0) / stats.total) * 100 : 0;
  return (
    <div className="status-bar-row">
      <span className="status-bar-label">{label}</span>
      <div className="status-bar-track">
        <motion.div
          className="status-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
      <motion.span
        className="status-bar-count"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.5 }}
      >
        {stats[statKey] || 0}
      </motion.span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Dashboard component
// ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(getFormattedDateTime);
  const [userName, setUserName] = useState('');

  // ── Data fetching (unchanged) ───────────────────────────
  useEffect(() => {
    axios.get('/api/cases/meta/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => setError('Failed to load dashboard data. Please try again.'));
  }, []);

  // ── Live clock ──────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(getFormattedDateTime()), 60_000);
    return () => clearInterval(t);
  }, []);

  // ── Read user name from localStorage (set at login) ────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name) setUserName(parsed.name);
      }
    } catch { /* skip */ }
  }, []);

  // ─── Loading state ──────────────────────────────────────
  if (!stats && !error) {
    return (
      <div style={{ padding: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <Skeleton width={280} height={28} />
          <Skeleton width={220} height={14} style={{ marginTop: 8 }} />
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[1, 2].map((i) => (
            <div key={i} className="dash-glass" style={{ minHeight: 280, padding: 20 }}>
              <Skeleton width={180} height={16} style={{ marginBottom: 20 }} />
              <Skeleton height={200} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────
  if (error) {
    return (
      <div className="error-state">
        <svg className="error-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3>Unable to load dashboard</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => { setError(''); window.location.reload(); }}>Retry</button>
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────
  return (
    <div style={{ padding: 0 }}>

      {/* ══════ Welcome header ══════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ marginBottom: 28 }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.3,
            }}>
              {userName ? `Welcome back, ${userName}` : 'Dashboard'}
            </h1>
            <p style={{
              color: 'var(--text-tertiary)',
              fontSize: '0.88rem',
              marginTop: 4,
            }}>
              {currentTime.dateStr} &middot; {currentTime.timeStr}
            </p>
          </div>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.85rem',
            margin: 0,
          }}>
            Case overview and analytics for the Magistrate Court
          </p>
        </div>
      </motion.div>

      {/* ══════ Stat cards ══════ */}
      <motion.div
        className="stats-grid"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
        }}
      >
        {STATS_CARDS.map((c) => {
          const value = stats[c.key] ?? 0;
          return (
            <motion.div
              key={c.key}
              className="dash-glass"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                padding: 24,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
              }}
              whileHover={{
                y: -3,
                boxShadow: `0 12px 40px ${c.glow}`,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              {/* Corner gradient accent */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 130,
                  height: 130,
                  background: c.gradient,
                  opacity: 0.06,
                  borderTopRightRadius: 14,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              />

              <div className="stat-card-top" style={{ marginBottom: 14 }}>
                <span className="stat-card-label">{c.label}</span>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: c.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.1rem',
                    boxShadow: `0 4px 12px ${c.glow}`,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {c.icon}
                </div>
              </div>

              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <AnimatedCounter value={value} duration={1400} />
              </div>

              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-tertiary)',
                position: 'relative',
                zIndex: 1,
              }}>
                {c.subtitle}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ══════ Charts row ══════ */}
      <motion.div
        className="charts-grid"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
        }}
      >
        {/* Cases by Type */}
        <motion.div
          className="dash-glass"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ padding: 20 }}
        >
          <h4 style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}>
            Cases by Type
          </h4>
          {stats.byType && stats.byType.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.byType} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8, border: '1px solid var(--border)',
                    fontSize: 13, background: 'var(--surface)', color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  cursor={{ fill: 'var(--surface-hover)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {stats.byType.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No case data available.</p>
            </div>
          )}
        </motion.div>

        {/* Status Breakdown */}
        <motion.div
          className="dash-glass"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ padding: 20 }}
        >
          <h4 style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}>
            Status Breakdown
          </h4>
          {stats.total > 0 ? (
            <div className="status-bars">
              {[
                { label: 'Active', key: 'active', color: 'var(--success)' },
                { label: 'Open', key: 'open', color: 'var(--info)' },
                { label: 'Pending', key: 'pending', color: 'var(--warning)' },
                { label: 'Closed', key: 'closed', color: 'var(--text-tertiary)' },
              ].map((s) => (
                <StatusBreakdown key={s.key} label={s.label} statKey={s.key} stats={stats} color={s.color} />
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No cases recorded yet.</p>
            </div>
          )}
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          className="dash-glass"
          style={{ padding: 20, gridColumn: '1 / -1' }}
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <h4 style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}>
            Monthly Case Trend
          </h4>
          {stats.byMonth && stats.byMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.byMonth} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                  tickFormatter={(m) => {
                    const d = new Date(m + '-01');
                    return d.toLocaleDateString('en-NA', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8, border: '1px solid var(--border)',
                    fontSize: 13, background: 'var(--surface)', color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#00A3E0"
                  strokeWidth={2}
                  dot={{ fill: '#00A3E0', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#00A3E0', strokeWidth: 0, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No trend data available.</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ══════ Recent Cases ══════ */}
      <motion.div
        className="dash-glass"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35, ease: 'easeOut' }}
        style={{ padding: 0, marginTop: 20, overflow: 'hidden' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(128,128,128,0.1)',
        }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            Recent Cases
          </h3>
          {stats.recent && (
            <span style={{
              fontSize: '0.78rem',
              color: 'var(--text-tertiary)',
            }}>
              {stats.recent.length} latest
            </span>
          )}
        </div>
        <div style={{ padding: '4px 0' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Case No.</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Hearing Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent && stats.recent.length > 0 ? (
                  stats.recent.map((c) => (
                    <tr key={c.id}>
                      <td><span className="case-number">{c.case_number}</span></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                      <td><span className={`badge badge-${c.case_type.toLowerCase()}`}>{c.case_type}</span></td>
                      <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                      <td>
                        <span className={`priority-dot priority-${c.priority.toLowerCase()}`} />
                        {c.priority}
                      </td>
                      <td className="cell-muted">{c.hearing_date || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                      No cases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
