import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import CaseModal from '../components/CaseModal';
import CaseDetailModal from '../components/CaseDetailModal';
import { useToast } from '../context/ToastContext';

const STATUSES = ['', 'Open', 'Active', 'Pending', 'Closed'];
const TYPES = ['', 'Criminal', 'Civil', 'Family', 'Commercial', 'Labour'];
const PRIORITIES = ['', 'Low', 'Medium', 'High'];
const PAGE_SIZES = [10, 20, 50, 100];

function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{
          height: 14, marginBottom: 16, borderRadius: 4,
          width: `${65 + Math.random() * 30}%`,
        }} />
      ))}
    </div>
  );
}

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const { success, error: toastError } = useToast();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (sortBy) { params.sort_by = sortBy; params.sort_order = sortOrder; }

      const { data } = await axios.get('/api/cases', { params });
      setCases(data.data || []);
      setTotal(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 0);
    } catch {
      setCases([]);
      setError('Failed to load cases.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, typeFilter, priorityFilter, sortBy, sortOrder]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  // Listen for case:select event from global search
  useEffect(() => {
    const handler = (e) => {
      setSelectedCase({ id: e.detail.caseId });
    };
    window.addEventListener('case:select', handler);
    return () => window.removeEventListener('case:select', handler);
  }, []);
  function handleSort(column) {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  }

  function handleCreated() {
    setShowCreate(false);
    success('Case created successfully.');
    fetchCases();
  }

  function handleUpdated() {
    setSelectedCase(null);
    success('Case updated successfully.');
    fetchCases();
  }

  async function handleExport() {
    try {
      const { data } = await axios.get('/api/cases/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `moj-cases-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('Cases exported successfully.');
    } catch (err) {
      toastError('Failed to export cases.');
    }
  }

  const totalActive = cases.length;
  const fromRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const toRecord = Math.min(page * limit, total);

  const SortHeader = ({ column, children }) => (
    <th className={`sortable ${sortBy === column ? sortOrder : ''}`} onClick={() => handleSort(column)} tabIndex={0} role="columnheader" aria-sort={sortBy === column ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
      {children}
      <span className="sort-indicator">{sortBy === column ? (sortOrder === 'asc' ? '▲' : '▼') : '▽'}</span>
    </th>
  );

  return (
    <div>
      {/* Page header */}
      <div className="dashboard-header">
        <h1>Case Register</h1>
        <p>Manage and track magistrate court cases</p>
      </div>

      {/* Filters card */}
      <motion.div
        className="card"
        style={{ marginBottom: 'var(--space-5)' }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="filters-bar">
            <div className="search-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Search cases..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search cases"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter by status">
              <option value="">All Statuses</option>
              {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="filter-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} aria-label="Filter by type">
              <option value="">All Types</option>
              {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select className="filter-select" value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} aria-label="Filter by priority">
              <option value="">All Priorities</option>
              {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <button className="btn btn-primary" onClick={() => setShowCreate(true)} aria-label="Create new case">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Case
            </button>

            <button className="btn btn-ghost" onClick={handleExport} aria-label="Export cases as CSV">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* Table card */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }}
      >
        <div className="card-header">
          <h3>Cases</h3>
          {!loading && (
            <span className="text-xs text-muted">
              Showing {fromRecord}–{toRecord} of {total}
            </span>
          )}
        </div>
        <div className="card-body compact">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <SortHeader column="case_number">Case No.</SortHeader>
                  <SortHeader column="title">Title</SortHeader>
                  <th>Type</th>
                  <SortHeader column="status">Status</SortHeader>
                  <SortHeader column="priority">Priority</SortHeader>
                  <th>Plaintiff</th>
                  <th>Defendant</th>
                  <SortHeader column="hearing_date">Hearing</SortHeader>
                  <th>Officer</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9}><TableSkeleton rows={5} /></td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="error-state" style={{ padding: 'var(--space-8) 0' }}>
                        <h3>Failed to load cases</h3>
                        <p>{error}</p>
                        <button className="btn btn-ghost" onClick={fetchCases}>Retry</button>
                      </div>
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state" role="status">
                        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <h3>No cases found</h3>
                        <p>Try adjusting your search or filters, or create a new case.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cases.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View case ${c.case_number}`}
                      onKeyDown={e => { if (e.key === 'Enter') setSelectedCase(c); }}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.025, ease: 'easeOut' }}
                      whileHover={{ backgroundColor: 'var(--surface-hover)' }}
                    >
                      <td><span className="case-number">{c.case_number}</span></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                      <td><span className={`badge badge-${c.case_type.toLowerCase()}`}>{c.case_type}</span></td>
                      <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                      <td>
                        <span className={`priority-dot priority-${c.priority.toLowerCase()}`} />
                        {c.priority}
                      </td>
                      <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="cell-muted">{c.plaintiff}</td>
                      <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="cell-muted">{c.defendant}</td>
                      <td className="cell-muted">{c.hearing_date || '—'}</td>
                      <td className="cell-muted">{c.presiding_officer || '—'}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              {fromRecord}–{toRecord} of {total}
            </div>
            <div className="pagination-controls">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Previous page">&lsaquo;</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button key={p} className={`pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)} aria-label={`Page ${p}`} aria-current={page === p ? 'page' : undefined}>
                    {p}
                  </button>
                );
              })}
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} aria-label="Next page">&rsaquo;</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="text-xs text-muted">Per page</span>
              <select
                className="filter-select"
                style={{ minWidth: 60, padding: '0 24px 0 8px', fontSize: '0.8rem', height: 32 }}
                value={limit}
                onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                aria-label="Results per page"
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </motion.div>
      {showCreate && (
        <CaseModal onClose={() => setShowCreate(false)} onSaved={handleCreated} />
      )}
      {selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
