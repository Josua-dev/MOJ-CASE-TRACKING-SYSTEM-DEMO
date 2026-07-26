import React from 'react';

const PAGE_SIZES = [10, 20, 50, 100];

/* ── Compute page number window ────────────────────────── */
function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 4) {
    for (let i = 1; i <= 7; i++) pages.push(i);
  } else if (currentPage >= totalPages - 3) {
    for (let i = totalPages - 6; i <= totalPages; i++) pages.push(i);
  } else {
    for (let i = currentPage - 3; i <= currentPage + 3; i++) pages.push(i);
  }
  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalPages <= 1) return null;

  const fromRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRecord = Math.min(currentPage * pageSize, totalItems);

  return (
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
      {/* Page info */}
      <span className="text-xs text-muted">
        {fromRecord}&ndash;{toRecord} of {totalItems}
      </span>

      {/* Page buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <button
          className="pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
            color:
              currentPage <= 1
                ? 'var(--text-tertiary)'
                : 'var(--text-secondary)',
            cursor: currentPage <= 1 ? 'default' : 'pointer',
            fontSize: '0.9rem',
            opacity: currentPage <= 1 ? 0.4 : 1,
            transition: 'all 0.12s',
          }}
        >
          &lsaquo;
        </button>

        {getPageNumbers(currentPage, totalPages).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={currentPage === p ? 'page' : undefined}
            style={{
              minWidth: 36,
              minHeight: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 10px',
              borderRadius: 8,
              border: `1px solid ${
                currentPage === p ? 'var(--primary)' : 'var(--border)'
              }`,
              background:
                currentPage === p ? 'var(--primary)' : 'transparent',
              color:
                currentPage === p
                  ? 'var(--text-inverse)'
                  : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: currentPage === p ? 600 : 400,
              transition: 'all 0.12s',
            }}
          >
            {p}
          </button>
        ))}

        <button
          className="pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() =>
            onPageChange(Math.min(totalPages, currentPage + 1))
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
              currentPage >= totalPages
                ? 'var(--text-tertiary)'
                : 'var(--text-secondary)',
            cursor: currentPage >= totalPages ? 'default' : 'pointer',
            fontSize: '0.9rem',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            transition: 'all 0.12s',
          }}
        >
          &rsaquo;
        </button>
      </div>

      {/* Per-page selector */}
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
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
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
  );
}
