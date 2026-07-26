import React from "react";

const VARIANT_DEFAULTS = {
  text: { width: "100%", height: 14, borderRadius: 6 },
  card: { width: "100%", height: 140, borderRadius: 12 },
  "table-row": { width: "100%", height: 42, borderRadius: 6 },
  chart: { width: "100%", height: 240, borderRadius: 12 },
};

const shimmerStyle = {
  background:
    "linear-gradient(90deg, var(--glass-bg) 25%, rgba(255,255,255,0.12) 50%, var(--glass-bg) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

/**
 * Skeleton — glassmorphism shimmer placeholder.
 *
 * @param {"text"|"card"|"table-row"|"chart"} variant
 * @param {string|number} width   Override default width
 * @param {string|number} height  Override default height
 * @param {number} count          Render multiple items (default 1)
 */
export default function Skeleton({
  variant = "text",
  width,
  height,
  count = 1,
}) {
  const def = VARIANT_DEFAULTS[variant] || VARIANT_DEFAULTS.text;

  const w = width ?? def.width;
  const h = height ?? def.height;
  const radius = def.borderRadius;

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      style={{
        ...shimmerStyle,
        width: w,
        height: h,
        borderRadius: radius,
        marginBottom: count > 1 && i < count - 1 ? 10 : 0,
      }}
      role="presentation"
      aria-hidden="true"
    />
  ));

  if (count <= 1) return items[0];

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 0 }}
      role="status"
      aria-label="Loading"
    >
      {items}
    </div>
  );
}
