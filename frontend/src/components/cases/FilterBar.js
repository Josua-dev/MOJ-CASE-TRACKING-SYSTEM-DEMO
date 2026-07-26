import React from 'react';
import { motion } from 'motion/react';

const STATUSES = ['Open', 'Active', 'Pending', 'Closed'];
const TYPES = ['Criminal', 'Civil', 'Family', 'Commercial', 'Labour'];
const PRIORITIES = ['Low', 'Medium', 'High'];

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

export default function FilterBar({ filters, onFilterChange, onCreate, onExport }) {
  const { search = '', status = '', type = '', priority = '' } = filters || {};

  return (
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
              onChange={(e) => onFilterChange('search', e.target.value)}
              aria-label="Search cases"
            />
            {search && (
              <button
                onClick={() => onFilterChange('search', '')}
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
              onClick={onCreate}
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
              onClick={onExport}
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
            value={status}
            onChange={(v) => onFilterChange('status', v)}
          />
          <FilterPillGroup
            label="Type"
            options={TYPES}
            value={type}
            onChange={(v) => onFilterChange('type', v)}
          />
          <FilterPillGroup
            label="Priority"
            options={PRIORITIES}
            value={priority}
            onChange={(v) => onFilterChange('priority', v)}
          />
        </div>
      </div>
    </motion.div>
  );
}
