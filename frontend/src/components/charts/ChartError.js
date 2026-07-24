import React from 'react';

export default function ChartError({ message = 'Failed to load chart data.', onRetry, height = 240 }) {
  return (
    <div className="error-state" style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" style={{ opacity: 0.4, marginBottom: 8 }}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h3 style={{ margin: '0 0 4px' }}>Something went wrong</h3>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: '0 0 12px' }}>{message}</p>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry} style={{ fontSize: '0.8rem' }}>Retry</button>
      )}
    </div>
  );
}
