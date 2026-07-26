import React from 'react';
import { motion } from 'motion/react';

// ────────────────────────────────────────────────────────────
// WelcomeHeader — welcome message with user name,
// date/time display, and dashboard subtitle
// ────────────────────────────────────────────────────────────
export default function WelcomeHeader({ userName, dateStr, timeStr }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ marginBottom: 28 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {userName ? `Welcome back, ${userName}` : 'Dashboard'}
          </h1>
          <p
            style={{
              color: 'var(--text-tertiary)',
              fontSize: '0.88rem',
              marginTop: 4,
            }}
          >
            {dateStr} &middot; {timeStr}
          </p>
        </div>
        <p
          style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.85rem',
            margin: 0,
          }}
        >
          Case overview and analytics for the Magistrate Court
        </p>
      </div>
    </motion.div>
  );
}
