import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#2A6EBB', '#1A7A4A', '#C9952A', '#B83232', '#6B48D1'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('/api/cases/meta/stats').then(r => setStats(r.data)).catch(console.error);
  }, []);

  if (!stats) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Cases', value: stats.total, bg: '#EBF4FF', color: '#2A6EBB', icon: '📁' },
    { label: 'Active Cases', value: stats.active, bg: '#E6F6EE', color: '#1A7A4A', icon: '⚡' },
    { label: 'Open Cases', value: stats.open, bg: '#FFF7E6', color: '#C9952A', icon: '📂' },
    { label: 'High Priority', value: stats.high, bg: '#FFF0F0', color: '#B83232', icon: '🔴' },
  ];

  return (
    <div>
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: s.bg }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h3>Cases by Type</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byType} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="case_type" tick={{ fontSize: 12, fontFamily: 'DM Sans' }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontFamily: 'DM Sans', fontSize: 13, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Status Breakdown</h3></div>
          <div className="card-body">
            {[
              { label: 'Active', value: stats.active, color: '#1A7A4A', total: stats.total },
              { label: 'Open', value: stats.open, color: '#2A6EBB', total: stats.total },
              { label: 'Pending', value: stats.pending, color: '#C9952A', total: stats.total },
              { label: 'Closed', value: stats.closed, color: '#8A99AA', total: stats.total },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{item.value} cases</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.total ? (item.value / item.total) * 100 : 0}%`, background: item.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Recent Cases</h3></div>
        <div className="table-wrap">
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
              {stats.recent.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: 'var(--blue-accent)', fontFamily: 'monospace', fontSize: 12 }}>{c.case_number}</td>
                  <td style={{ fontWeight: 500 }}>{c.title}</td>
                  <td>{c.case_type}</td>
                  <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td><span className={`priority-${c.priority.toLowerCase()}`}>● {c.priority}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.hearing_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
