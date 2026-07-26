import React from 'react';
import { motion } from 'motion/react';
import Badge from '../ui/Badge';

/* ── Status → Badge colour mapping ───────────────────────── */
const STATUS_COLOR_MAP = {
  open: 'green',
  active: 'blue',
  pending: 'gold',
  closed: 'default',
};

/* ── Skeleton rows matching table column structure ────────── */
function TableSkeleton({ rows = 5 }) {
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

/* ── Status badge using ui/Badge component ───────────────── */
function StatusBadge({ status }) {
  const color = STATUS_COLOR_MAP[status?.toLowerCase()] || 'default';
  return <Badge variant="status" color={color}>{status}</Badge>;
}

export default function CasesTable({
  cases,
  onCaseClick,
  isLoading,
  error,
  sortField,
  sortDir,
  onSort,
  onRetry,
  totalItems = 0,
  currentPage = 1,
  pageSize = 20,
}) {
  const fromRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRecord = Math.min(currentPage * pageSize, totalItems);

  /* ── Sortable column header ───────────────────────────── */
  function SortHeader({ column, children }) {
    return (
      <th
        className={`sortable ${sortField === column ? sortDir : ''}`}
        onClick={() => onSort(column)}
        tabIndex={0}
        role="columnheader"
        aria-sort={
          sortField === column
            ? sortDir === 'asc'
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
            opacity: sortField === column ? 1 : 0.35,
          }}
        >
          {sortField === column
            ? sortDir === 'asc'
              ? '▲'
              : '▼'
            : '▽'}
        </span>
      </th>
    );
  }

  /* ── Render table body based on state ─────────────────── */
  function renderBody() {
    /* Loading state */
    if (isLoading) {
      return <TableSkeleton rows={5} />;
    }

    /* Error state */
    if (error) {
      return (
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
                <button className="btn btn-ghost" onClick={onRetry}>
                  Retry
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }

    /* Empty state */
    if (cases.length === 0) {
      return (
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
      );
    }

    /* Data rows */
    return (
      <tbody>
        {cases.map((c, i) => (
          <motion.tr
            key={c.id}
            onClick={() => onCaseClick(c)}
            tabIndex={0}
            role="button"
            aria-label={`View case ${c.case_number}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCaseClick(c);
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
                className={`badge badge-${c.case_type?.toLowerCase()}`}
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
                  className={`priority-dot priority-${c.priority?.toLowerCase()}`}
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
    );
  }

  return (
    <>
      <div
        className="card-header"
        style={{
          padding: 'var(--space-4) var(--space-5)',
          marginBottom: 0,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h3>Cases</h3>
        {!isLoading && (
          <span className="text-xs text-muted">
            Showing {fromRecord}&ndash;{toRecord} of {totalItems}
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
            {renderBody()}
          </table>
        </div>
      </div>
    </>
  );
}
