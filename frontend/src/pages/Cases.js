import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import CaseModal from '../components/CaseModal';
import CaseDetailModal from '../components/CaseDetailModal';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await axios.get('/api/cases', { params });
      setCases(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    const t = setTimeout(fetchCases, 300);
    return () => clearTimeout(t);
  }, [fetchCases]);

  const handleCreated = () => { setShowCreate(false); fetchCases(); };
  const handleUpdated = () => { setSelectedCase(null); fetchCases(); };

  return (
    <div>
      <div className="filters-row">
        <div className="search-bar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search cases, parties..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Open</option><option>Active</option><option>Pending</option><option>Closed</option>
        </select>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option>Criminal</option><option>Civil</option><option>Family</option><option>Commercial</option><option>Labour</option>
        </select>
        <button className="btn btn-gold" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Case
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Case Register</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{cases.length} record{cases.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : cases.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p>No cases found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Case No.</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Plaintiff</th>
                  <th>Defendant</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Hearing</th>
                  <th>Officer</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} onClick={() => setSelectedCase(c)}>
                    <td style={{ fontWeight: 700, color: 'var(--blue-accent)', fontFamily: 'monospace', fontSize: 12 }}>{c.case_number}</td>
                    <td style={{ fontWeight: 500, maxWidth: 200 }}>{c.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.case_type}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.plaintiff}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.defendant}</td>
                    <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                    <td><span className={`priority-${c.priority.toLowerCase()}`}>● {c.priority}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.hearing_date || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.presiding_officer || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && <CaseModal onClose={() => setShowCreate(false)} onSaved={handleCreated} />}
      {selectedCase && <CaseDetailModal caseData={selectedCase} onClose={() => setSelectedCase(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
