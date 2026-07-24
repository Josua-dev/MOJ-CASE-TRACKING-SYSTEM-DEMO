import React from 'react';
import { motion } from 'motion/react';

export default function ChartSkeleton({ height = 240, count = 1 }) {
  if (count > 1) {
    return (
      <div className="vis-skeleton-grid">
        {Array.from({ length: count }, (_, i) => (
          <div className="chart-card" key={i}>
            <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '100%', height, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 16 }} />
      <motion.div
        className="skeleton"
        style={{ width: '100%', height, borderRadius: 8 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
