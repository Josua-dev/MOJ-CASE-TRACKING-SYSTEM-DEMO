import React from "react";

/**
 * EmptyState — centred illustration for empty-data views.
 *
 * @param {React.ReactNode} icon      SVG / icon element
 * @param {string}          title
 * @param {string}          description
 * @param {{ label: string, onClick: () => void }} [action]
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-12) var(--space-5)",
        textAlign: "center",
      }}
      role="status"
    >
      {icon && (
        <div
          style={{
            color: "var(--text-tertiary)",
            opacity: 0.5,
            marginBottom: "var(--space-4)",
            width: 64,
            height: 64,
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 4,
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-tertiary)",
            maxWidth: 340,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={action.onClick}
          style={{ marginTop: "var(--space-4)" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
