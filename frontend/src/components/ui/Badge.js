import React from "react";

const DOT_SIZE = 6;

const COLOR_CONFIG = {
  green: {
    bg: "var(--success-light)",
    text: "var(--success)",
    dot: "var(--success)",
  },
  blue: {
    bg: "var(--info-light)",
    text: "var(--info)",
    dot: "var(--info)",
  },
  red: {
    bg: "var(--danger-light)",
    text: "var(--danger)",
    dot: "var(--danger)",
  },
  gold: {
    bg: "var(--warning-light)",
    text: "var(--warning)",
    dot: "var(--warning)",
  },
  default: {
    bg: "var(--surface-active)",
    text: "var(--text-tertiary)",
    dot: "var(--text-tertiary)",
  },
};

const baseStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "3px 10px",
  fontSize: "0.75rem",
  fontWeight: 600,
  borderRadius: 12,
  whiteSpace: "nowrap",
  lineHeight: 1.4,
};

/**
 * Badge — coloured label or status dot indicator.
 *
 * @param {"status"|"role"|"default"} variant
 *   - "status": renders a coloured dot + label (default)
 *   - "role":   renders a pill badge (no dot)
 *   - "default": plain pill badge
 * @param {"green"|"blue"|"red"|"gold"|"default"} color
 * @param {React.ReactNode} children
 * @param {string} className
 */
export default function Badge({
  variant = "default",
  color = "default",
  children,
  className = "",
}) {
  const c = COLOR_CONFIG[color] || COLOR_CONFIG.default;

  if (variant === "status") {
    return (
      <span
        className={className}
        style={{
          ...baseStyle,
          padding: "3px 10px 3px 8px",
          backgroundColor: c.bg,
          color: c.text,
        }}
      >
        <span
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: "50%",
            backgroundColor: c.dot,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        {children}
      </span>
    );
  }

  /* role or default */
  return (
    <span
      className={className}
      style={{
        ...baseStyle,
        backgroundColor: c.bg,
        color: c.text,
      }}
    >
      {children}
    </span>
  );
}
