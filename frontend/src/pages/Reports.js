/**
 * Reports page — PDF export for case summaries, session rosters, case register
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

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
    <div className="report-card">
      <div className="report-card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <div>
          <h3>Case Summary</h3>
          <p>Full case details, documents, and audit log in one PDF</p>
        </div>
      </div>
      <div className="report-card-body">
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Search for a case</label>
          <input
            className="form-input"
            type="text"
            placeholder="Type case number or title…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedCase(null); }}
          />
          {searching && <span className="report-search-spinner" />}
          {cases.length > 0 && (
            <div className="report-search-dropdown">
              {cases.map(c => (
                <button
                  key={c.id}
                  className={`report-search-item ${selectedCase?.id === c.id ? 'active' : ''}`}
                  onClick={() => { setSelectedCase(c); setSearchTerm(`${c.case_number} — ${c.title}`); setCases([]); }}
                  type="button"
                >
                  <strong>{c.case_number}</strong> — {c.title}
                  <span className="report-search-meta">{c.status} · {c.case_type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={!selectedCase || downloading}
        >
          {downloading ? (
            <><span className="spinner-sm" /> Generating…</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF</>
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
  const [downloading, setDownloading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    axios.get('/api/scheduling/courtrooms')
      .then(({ data }) => setCourtrooms(data?.data || []))
      .catch(() => {});
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
    <div className="report-card">
      <div className="report-card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <div>
          <h3>Session Roster</h3>
          <p>Court session schedule for a date range, optionally filtered by courtroom</p>
        </div>
      </div>
      <div className="report-card-body">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">From</label>
            <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Courtroom (optional)</label>
            <select className="form-input" value={courtroomId} onChange={e => setCourtroomId(e.target.value)}>
              <option value="">All courtrooms</option>
              {courtrooms.map(cr => (
                <option key={cr.id} value={cr.id}>{cr.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <><span className="spinner-sm" /> Generating…</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF</>
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
    <div className="report-card">
      <div className="report-card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <div>
          <h3>Case Register</h3>
          <p>List of all cases matching your filters in a printable PDF</p>
        </div>
      </div>
      <div className="report-card-body">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Case Type</label>
            <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
              <option value="">All types</option>
              <option value="Criminal">Criminal</option>
              <option value="Civil">Civil</option>
              <option value="Family">Family</option>
              <option value="Labour">Labour</option>
              <option value="Commercial">Commercial</option>
              <option value="Appeal">Appeal</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="Open">Open</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">From (created)</label>
            <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To (created)</label>
            <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <><span className="spinner-sm" /> Generating…</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main Reports page ────────────────────────────────────
export default function Reports() {
  return (
    <motion.div
      className="reports-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="reports-grid">
        <CaseSummaryReport />
        <SessionRosterReport />
        <CaseRegisterReport />
      </div>
    </motion.div>
  );
}
