/**
 * Reports page — PDF export for case summaries, session rosters, case register
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

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

const iconCircle = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const inputStyle = {
  borderRadius: 8,
  border: '1px solid var(--input-border, rgba(255,255,255,0.1))',
  background: 'rgba(255,255,255,0.04)',
  padding: '8px 12px',
  fontSize: 14,
  color: 'var(--text-primary)',
  width: '100%',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

// Animation variants for staggered card entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// ── Helper: trigger a file download from a Blob ────────────
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

// ── Helper: format date for input ─────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

// ── Case summary report form ──────────────────────────────
function CaseSummaryReport() {
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (searchTerm.length < 2) { setCases([]); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      axios.get('/api/cases', { params: { search: searchTerm, limit: '20' } })
        .then(({ data }) => setCases(data?.data || []))
        .catch(() => setCases([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDownload = useCallback(async () => {
    if (!selectedCase) return;
    setDownloading(true);
    try {
      const res = await axios.get(`/api/reports/case/${selectedCase.id}`, {
        responseType: 'blob',
        timeout: 30000,
      });
      downloadBlob(res.data, `case-${selectedCase.case_number}-summary.pdf`);
      addToast('Case summary downloaded.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to generate report.', 'error');
    } finally {
      setDownloading(false);
    }
  }, [selectedCase, addToast]);

  return (
    <div style={glassCard}>
      <div className="report-card-header" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.06))' }}>
        <div style={{ ...iconCircle, background: 'var(--primary-light, rgba(99,102,241,0.15))', color: 'var(--primary)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Case Summary</h3>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.4 }}>Full case details, documents, and audit log in one PDF</p>
        </div>
      </div>
      <div className="report-card-body" style={{ padding: '16px 20px 20px' }}>
        <div className="form-group" style={{ position: 'relative', marginBottom: 16 }}>
          <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>Search for a case</label>
          <input
            className="form-input"
            type="text"
            placeholder="Type case number or title…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedCase(null); }}
            style={inputStyle}
          />
          {searching && <span className="report-search-spinner" />}
          {cases.length > 0 && (
            <div className="report-search-dropdown" style={{ borderRadius: 8, overflow: 'hidden' }}>
              {cases.map(c => (
                <button
                  key={c.id}
                  className={`report-search-item ${selectedCase?.id === c.id ? 'active' : ''}`}
                  onClick={() => { setSelectedCase(c); setSearchTerm(`${c.case_number} — ${c.title}`); setCases([]); }}
                  type="button"
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', cursor: 'pointer', fontSize: 13, background: 'transparent', color: 'inherit' }}
                >
                  <strong>{c.case_number}</strong> — {c.title}
                  <span className="report-search-meta" style={{ display: 'block', fontSize: 11, opacity: 0.6 }}>{c.status} · {c.case_type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={!selectedCase || downloading}
          style={{ borderRadius: 8 }}
        >
          {downloading ? (
            <><span className="spinner-sm" /> Generating…</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Session roster report form ────────────────────────────
function SessionRosterReport() {
  const [from, setFrom] = useState(thirtyDaysAgo());
  const [to, setTo] = useState(todayStr());
  const [courtroomId, setCourtroomId] = useState('');
  const [courtrooms, setCourtrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    axios.get('/api/scheduling/courtrooms')
      .then(({ data }) => setCourtrooms(data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!from || !to) { addToast('Please select both start and end dates.', 'warning'); return; }
    setDownloading(true);
    try {
      const params = { from, to };
      if (courtroomId) params.courtroom_id = courtroomId;
      const res = await axios.get('/api/reports/sessions', {
        params,
        responseType: 'blob',
        timeout: 30000,
      });
      downloadBlob(res.data, `session-roster-${from}-to-${to}.pdf`);
      addToast('Session roster downloaded.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to generate report.', 'error');
    } finally {
      setDownloading(false);
    }
  }, [from, to, courtroomId, addToast]);

  return (
    <div style={glassCard}>
      <div className="report-card-header" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.06))' }}>
        <div style={{ ...iconCircle, background: 'var(--info-light, rgba(59,130,246,0.15))', color: 'var(--info)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Session Roster</h3>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.4 }}>Court session schedule for a date range, optionally filtered by courtroom</p>
        </div>
      </div>
      <div className="report-card-body" style={{ padding: '16px 20px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 38, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="form-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 140px', minWidth: 120 }}>
              <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>From</label>
              <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
            </div>
            <div className="form-group" style={{ flex: '1 1 140px', minWidth: 120 }}>
              <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>To</label>
              <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
            </div>
            <div className="form-group" style={{ flex: '1 1 160px', minWidth: 140 }}>
              <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>Courtroom (optional)</label>
              <select className="form-input" value={courtroomId} onChange={e => setCourtroomId(e.target.value)} style={inputStyle}>
                <option value="">All courtrooms</option>
                {courtrooms.map(cr => (
                  <option key={cr.id} value={cr.id}>{cr.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={downloading}
          style={{ borderRadius: 8, marginTop: 12 }}
        >
          {downloading ? (
            <><span className="spinner-sm" /> Generating…</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Case register report form ─────────────────────────────
function CaseRegisterReport() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [downloading, setDownloading] = useState(false);
  const { addToast } = useToast();

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const params = {};
      if (type) params.type = type;
      if (status) params.status = status;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await axios.get('/api/reports/cases', {
        params,
        responseType: 'blob',
        timeout: 30000,
      });
      downloadBlob(res.data, `case-register-${todayStr()}.pdf`);
      addToast('Case register downloaded.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to generate report.', 'error');
    } finally {
      setDownloading(false);
    }
  }, [type, status, from, to, addToast]);

  return (
    <div style={glassCard}>
      <div className="report-card-header" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.06))' }}>
        <div style={{ ...iconCircle, background: 'var(--success-light, rgba(34,197,94,0.15))', color: 'var(--success)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Case Register</h3>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.4 }}>List of all cases matching your filters in a printable PDF</p>
        </div>
      </div>
      <div className="report-card-body" style={{ padding: '16px 20px 20px' }}>
        <div className="form-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div className="form-group" style={{ flex: '1 1 140px', minWidth: 120 }}>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>Case Type</label>
            <select className="form-input" value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
              <option value="">All types</option>
              <option value="Criminal">Criminal</option>
              <option value="Civil">Civil</option>
              <option value="Family">Family</option>
              <option value="Labour">Labour</option>
              <option value="Commercial">Commercial</option>
              <option value="Appeal">Appeal</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 140px', minWidth: 120 }}>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>Status</label>
            <select className="form-input" value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              <option value="">All statuses</option>
              <option value="Open">Open</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 140px', minWidth: 120 }}>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>From (created)</label>
            <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
          </div>
          <div className="form-group" style={{ flex: '1 1 140px', minWidth: 120 }}>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>To (created)</label>
            <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={downloading}
            style={{ borderRadius: 8 }}
          >
            {downloading ? (
              <><span className="spinner-sm" /> Generating…</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF</>
            )}
          </button>
          {!type && !status && !from && !to && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No filters applied — all cases will be included</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Reports page ────────────────────────────────────
export default function Reports() {
  return (
    <motion.div
      className="reports-page"
      style={pageContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* ── Page header ─────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
          Reports
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 15 }}>
          Generate PDF reports for cases, sessions, and registers
        </p>
      </div>

      {/* ── Reports grid with staggered entrance ────────── */}
      <motion.div
        className="reports-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}
      >
        <motion.div variants={cardVariants}>
          <CaseSummaryReport />
        </motion.div>
        <motion.div variants={cardVariants}>
          <SessionRosterReport />
        </motion.div>
        <motion.div variants={cardVariants}>
          <CaseRegisterReport />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
