import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import CaseModal from '../components/CaseModal';
import CaseDetailModal from '../components/CaseDetailModal';
import { useToast } from '../context/ToastContext';

const STATUSES = ['Open', 'Active', 'Pending', 'Closed'];
const TYPES = ['Criminal', 'Civil', 'Family', 'Commercial', 'Labour'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const PAGE_SIZES = [10, 20, 50, 100];

/* ── Pill-style filter group ──────────────────────────────── */
function FilterPillGroup({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? '' : opt)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                background: active ? 'var(--primary)' : 'transparent',
                color: active
                  ? 'var(--text-inverse)'
                  : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: active ? 600 : 400,
                lineHeight: 1.4,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Skeleton rows matching table column structure ────────── */
function TableSkeleton({ rows = 5 }) {
  // Rough pixel widths for each column
  const widths = [100, 160, 70, 80, 70, 130, 130, 90, 120];
  return (
    <tbody>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {widths.map((w, c) => (
            <td key={c} style={{ padding: '10px 12px' }}>
              <div
                className="skeleton"
                style={{
                  height: 13,
                  width: `${w}px`,
                  maxWidth: '100%',
                  borderRadius: 4,
                  opacity: 1 - r * 0.06,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/* ── Status badge with dot indicator ──────────────────────── */
function StatusBadge({ status }) {
  const colorMap = {
    open: 'var(--success)',
    active: 'var(--info)',
    pending: 'var(--warning)',
    closed: 'var(--text-tertiary)',
  };
  const bgMap = {
    open: 'var(--success-light)',
    active: 'var(--info-light)',
    pending: 'var(--warning-light)',
    closed: 'var(--surface-active)',
  };
  const cls = status?.toLowerCase() || '';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px 3px 8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 12,
        backgroundColor: bgMap[cls] || 'var(--surface-active)',
        color: colorMap[cls] || 'var(--text-tertiary)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          flexShrink: 0,
        }}
      />
      {status}
    </span>
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
  const { success, error: toastError } = useToast();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
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
      if (sortBy) {
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
      }

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
  }, [
    page,
    limit,
    debouncedSearch,
    statusFilter,
    typeFilter,
    priorityFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

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
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
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
      const { data } = await axios.get('/api/cases/export/csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(
        new Blob([data], { type: 'text/csv;charset=utf-8' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `moj-cases-${new Date().toISOString().slice(0, 10)}.csv`
      );
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
    <th
      className={`sortable ${sortBy === column ? sortOrder : ''}`}
      onClick={() => handleSort(column)}
      tabIndex={0}
      role="columnheader"
      aria-sort={
        sortBy === column
          ? sortOrder === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {children}
      <span
        className="sort-indicator"
        style={{
          marginLeft: 4,
          fontSize: '0.65rem',
          opacity: sortBy === column ? 1 : 0.35,
        }}
      >
        {sortBy === column
          ? sortOrder === 'asc'
            ? '▲'
            : '▼'
          : '▽'}
      </span>
    </th>
  );

  /* ── Render page number range ─────────────────────────── */
  function getPageNumbers() {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 4) {
      for (let i = 1; i <= 7; i++) pages.push(i);
    } else if (page >= totalPages - 3) {
      for (let i = totalPages - 6; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 3; i <= page + 3; i++) pages.push(i);
    }
    return pages;
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────────────── */}
      <div className="dashboard-header">
        <h1>Case Register</h1>
        <p>Manage and track magistrate court cases</p>
      </div>

      {/* ── Filters card ─────────────────────────────────── */}
      <motion.div
        className="card"
        style={{ marginBottom: 'var(--space-5)' }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div
          className="card-body"
          style={{ padding: 'var(--space-4) var(--space-5)' }}
        >
          {/* Search + actions row */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div
              className="search-field"
              style={{ flex: '1 1 220px', minWidth: 180 }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Search cases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search cases"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreate(true)}
                aria-label="Create new case"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Case
              </button>

              <button
                className="btn btn-ghost"
                onClick={handleExport}
                aria-label="Export cases as CSV"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Filter pills row */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            <FilterPillGroup
              label="Status"
              options={STATUSES}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            />
            <FilterPillGroup
              label="Type"
              options={TYPES}
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            />
            <FilterPillGroup
              label="Priority"
              options={PRIORITIES}
              value={priorityFilter}
              onChange={(v) => {
                setPriorityFilter(v);
                setPage(1);
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Table card ───────────────────────────────────── */}
      <motion.div
        className="card"
        style={{ padding: 0, overflow: 'hidden' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }}
      >
        <div
          className="card-header"
          style={{
            padding: 'var(--space-4) var(--space-5)',
            marginBottom: 0,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3>Cases</h3>
          {!loading && (
            <span className="text-xs text-muted">
              Showing {fromRecord}&ndash;{toRecord} of {total}
            </span>
          )}
        </div>
        <div className="card-body compact">
          <div
            className="table-container"
            style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 3,
                }}
              >
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
              {loading ? (
                <TableSkeleton rows={5} />
              ) : error ? (
                <tbody>
                  <tr>
                    <td colSpan={9}>
                      <div
                        className="error-state"
                        style={{ padding: 'var(--space-10) 0' }}
                      >
                        <svg
                          className="error-state-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          width="40"
                          height="40"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <h3>Failed to load cases</h3>
                        <p>{error}</p>
                        <button className="btn btn-ghost" onClick={fetchCases}>
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : cases.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={9}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 'var(--space-12) var(--space-5)',
                          textAlign: 'center',
                        }}
                        role="status"
                      >
                        <svg
                          viewBox="0 0 80 80"
                          fill="none"
                          width="72"
                          height="72"
                          style={{
                            color: 'var(--text-tertiary)',
                            opacity: 0.5,
                            marginBottom: 'var(--space-4)',
                          }}
                        >
                          <rect
                            x="16"
                            y="8"
                            width="48"
                            height="64"
                            rx="4"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                          />
                          <path
                            d="M16 24h48M16 34h48M16 44h48M16 54h32"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="12"
                            fill="var(--surface)"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M60 64h8M64 60v8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <h3
                          style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          No matching cases
                        </h3>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-tertiary)',
                            maxWidth: 320,
                            lineHeight: 1.5,
                          }}
                        >
                          No cases match your current filters. Try adjusting
                          the search term, changing the filter pills above, or
                          create a new case.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {cases.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View case ${c.case_number}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelectedCase(c);
                      }}
                      style={{
                        borderLeft: '3px solid transparent',
                        transition:
                          'border-color 0.15s ease, background-color 0.15s ease',
                        backgroundColor:
                          i % 2 === 1
                            ? 'var(--surface-hover)'
                            : 'transparent',
                        cursor: 'pointer',
                      }}
                      whileHover={{
                        borderLeft: '3px solid var(--primary)',
                        backgroundColor: 'var(--surface-active)',
                      }}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.15,
                        delay: i * 0.025,
                        ease: 'easeOut',
                      }}
                    >
                      <td>
                        <span className="case-number">{c.case_number}</span>
                      </td>
                      <td
                        style={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.title}
                      </td>
                      <td>
                        <span
                          className={`badge badge-${c.case_type.toLowerCase()}`}
                        >
                          {c.case_type}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <span
                            className={`priority-dot priority-${c.priority.toLowerCase()}`}
                            style={{ width: 8, height: 8, borderRadius: '50%' }}
                          />
                          {c.priority}
                        </span>
                      </td>
                      <td
                        style={{
                          maxWidth: 140,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        className="cell-muted"
                      >
                        {c.plaintiff}
                      </td>
                      <td
                        style={{
                          maxWidth: 140,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        className="cell-muted"
                      >
                        {c.defendant}
                      </td>
                      <td className="cell-muted">
                        {c.hearing_date || '—'}
                      </td>
                      <td className="cell-muted">
                        {c.presiding_officer || '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>

        {/* ── Pagination ──────────────────────────────────── */}
        {totalPages > 1 && (
          <div
            className="pagination"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-5)',
              borderTop: '1px solid var(--border)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="text-xs text-muted">
              {fromRecord}&ndash;{toRecord} of {total}
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                style={{
                  minWidth: 36,
                  minHeight: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'none',
                  color: page <= 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                  cursor: page <= 1 ? 'default' : 'pointer',
                  fontSize: '0.9rem',
                  opacity: page <= 1 ? 0.4 : 1,
                  transition: 'all 0.12s',
                }}
              >
                &lsaquo;
              </button>

              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={page === p ? 'page' : undefined}
                  style={{
                    minWidth: 36,
                    minHeight: 36,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: `1px solid ${page === p ? 'var(--primary)' : 'var(--border)'}`,
                    background:
                      page === p ? 'var(--primary)' : 'transparent',
                    color:
                      page === p
                        ? 'var(--text-inverse)'
                        : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: page === p ? 600 : 400,
                    transition: 'all 0.12s',
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                aria-label="Next page"
                style={{
                  minWidth: 36,
                  minHeight: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'none',
                  color:
                    page >= totalPages
                      ? 'var(--text-tertiary)'
                      : 'var(--text-secondary)',
                  cursor: page >= totalPages ? 'default' : 'pointer',
                  fontSize: '0.9rem',
                  opacity: page >= totalPages ? 0.4 : 1,
                  transition: 'all 0.12s',
                }}
              >
                &rsaquo;
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="text-xs text-muted">Per page</span>
              <select
                className="filter-select"
                style={{
                  minWidth: 60,
                  padding: '4px 24px 4px 8px',
                  fontSize: '0.8rem',
                  height: 32,
                }}
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Results per page"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Modals with exit animations ───────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <CaseModal
            onClose={() => setShowCreate(false)}
            onSaved={handleCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCase && (
          <CaseDetailModal
            caseData={selectedCase}
            onClose={() => setSelectedCase(null)}
            onUpdated={handleUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
