import React from "react";
import { motion } from "motion/react";

/**
 * PageHeader — animated page title bar with optional subtitle and actions.
 *
 * @param {string} title
 * @param {string} [subtitle]
 * @param {React.ReactNode} [actions]  Slot for buttons / controls aligned right
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        flexWrap: "wrap",
        marginBottom: "var(--space-5)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              color: "var(--text-tertiary)",
              fontSize: "0.9rem",
              margin: "4px 0 0 0",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
    </motion.div>
  );
}
