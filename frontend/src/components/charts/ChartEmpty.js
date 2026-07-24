import React from 'react';

export default function ChartEmpty({ message = 'No data available.', height = 240 }) {
  return (
    <div className="empty-state" style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ opacity: 0.4, marginBottom: 8 }}>
        <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
      </svg>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{message}</p>
    </div>
  );
}
