import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';

const CHART_COLORS = ['#1e6bb8', '#0d7c3f', '#b8942e', '#b91c1c', '#6b48d1'];

function Skeleton({ width = '100%', height = 16, style = {} }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="stat-card-top" style={{ marginBottom: 12 }}>
        <Skeleton width={60} height={14} />
        <Skeleton width={36} height={36} style={{ borderRadius: 8 }} />
      </div>
      <Skeleton width={80} height={28} style={{ marginBottom: 6 }} />
      <Skeleton width={50} height={12} />
    </div>
  );
}

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

const STATS_CARDS = [
  { key: 'total', label: 'Total Cases', icon: FOLDER_ICON, bg: 'var(--info-light)', color: 'var(--info)' },
  { key: 'active', label: 'Active', icon: SCALES_ICON, bg: 'var(--success-light)', color: 'var(--success)' },
  { key: 'open', label: 'Open', icon: ARCHIVE_ICON, bg: 'var(--warning-light)', color: 'var(--warning)' },
  { key: 'high', label: 'High Priority', icon: FLAG_ICON, bg: 'var(--danger-light)', color: 'var(--danger)' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/cases/meta/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => setError('Failed to load dashboard data. Please try again.'));
  }, []);

  // Loading state
  if (!stats && !error) {
    return (
      <div>
        <div className="dashboard-header">
          <Skeleton width={200} height={24} />
          <Skeleton width={300} height={14} style={{ marginTop: 8 }} />
        </div>
        <div className="stats-grid">
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[1,2].map(i => (
            <div className="chart-card" key={i}>
              <Skeleton width={140} height={16} style={{ marginBottom: 20 }} />
              <Skeleton height={200} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
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

  return (
    <div>
      {/* Page header */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Case overview and analytics for the Magistrate Court</p>
      </div>

      {/* Stats cards */}
      <motion.div
        className="stats-grid"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {STATS_CARDS.map(c => {
          const value = stats[c.key] ?? 0;
          return (
            <motion.div
              className="stat-card"
              key={c.key}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="stat-card-top">
                <span className="stat-card-label">{c.label}</span>
                <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
              </div>
              <div className="stat-card-value">{value.toLocaleString()}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts row */}
      <motion.div
        className="charts-grid"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
        }}
      >
        <motion.div
          className="chart-card"
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <h4>Cases by Type</h4>
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

        <motion.div
          className="chart-card"
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <h4>Status Breakdown</h4>
          {stats.total > 0 ? (
            <div className="status-bars">
              {[
                { label: 'Active', key: 'active', color: 'var(--success)' },
                { label: 'Open', key: 'open', color: 'var(--info)' },
                { label: 'Pending', key: 'pending', color: 'var(--warning)' },
                { label: 'Closed', key: 'closed', color: 'var(--text-tertiary)' },
              ].map((s) => (
                <div className="status-bar-row" key={s.key}>
                  <span className="status-bar-label">{s.label}</span>
                  <div className="status-bar-track">
                    <motion.div
                      className="status-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${((stats[s.key] || 0) / stats.total) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                      style={{ background: s.color }}
                    />
                  </div>
                  <motion.span
                    className="status-bar-count"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.5 }}
                  >{stats[s.key] || 0}</motion.span>
                </div>
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
          className="chart-card"
          style={{ gridColumn: '1 / -1' }}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <h4>Monthly Case Trend</h4>
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
                  stroke="#b8942e"
                  strokeWidth={2}
                  dot={{ fill: '#b8942e', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#b8942e', strokeWidth: 0, r: 5 }}
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

      {/* Recent cases */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.3, ease: 'easeOut' }}
      >
        <div className="card-header">
          <h3>Recent Cases</h3>
          {stats.recent && <span className="text-xs text-muted">{stats.recent.length} latest</span>}
        </div>
        <div className="card-body compact">
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
