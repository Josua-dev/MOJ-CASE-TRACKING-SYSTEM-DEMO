import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

// ────────────────────────────────────────────────────────────
// Animated counter — counts from 0 to value on mount / change
// ────────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }

    startTimeRef.current = null;

    function step(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic — smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(value * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

// ────────────────────────────────────────────────────────────
// StatCard — single stat card with animated counter,
// gradient icon, hover effects, and glass-morphism styling
// ────────────────────────────────────────────────────────────
export default function StatCard({
  title,
  value,
  icon,
  gradient,
  subtitle,
  delay = 0,
  glow,
}) {
  const shadowColor = glow || 'rgba(0,0,0,0.15)';

  return (
    <motion.div
      className="dash-glass"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
      style={{
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
      whileHover={{
        y: -3,
        boxShadow: `0 12px 40px ${shadowColor}`,
        borderColor: 'rgba(255,255,255,0.2)',
      }}
    >
      {/* Corner gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 130,
          height: 130,
          background: gradient,
          opacity: 0.06,
          borderTopRightRadius: 14,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div className="stat-card-top" style={{ marginBottom: 14 }}>
        <span className="stat-card-label">{title}</span>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.1rem',
            boxShadow: `0 4px 12px ${shadowColor}`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          lineHeight: 1.2,
          color: 'var(--text-primary)',
          marginBottom: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatedCounter value={value} duration={1400} />
      </div>

      <div
        style={{
          fontSize: '0.78rem',
          color: 'var(--text-tertiary)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {subtitle}
      </div>
    </motion.div>
  );
}
