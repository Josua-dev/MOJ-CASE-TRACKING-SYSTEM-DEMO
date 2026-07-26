import React, { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

const SIZE_WIDTH = {
  sm: 440,
  md: 520,
  lg: 720,
};

/**
 * Modal — glassmorphism dialog with spring animation.
 *
 * @param {boolean}  isOpen
 * @param {() => void} onClose
 * @param {string}   title
 * @param {React.ReactNode} children
 * @param {"sm"|"md"|"lg"} size
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) {
  const overlayRef = useRef(null);

  /* ── Escape key ────────────────────────────────── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  /* ── Overlay click ─────────────────────────────── */
  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const maxW = SIZE_WIDTH[size] || SIZE_WIDTH.md;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={handleOverlayClick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-5)",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            style={{
              width: "100%",
              maxWidth: maxW,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              background: "var(--glass-bg)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              boxShadow:
                "0 32px 64px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{
              type: "spring",
              duration: 0.35,
              bounce: 0.15,
              ease: "easeOut",
            }}
          >
            {/* ── Header ───────────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-4) var(--space-5)",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "1.3rem",
                  color: "var(--text-tertiary)",
                  transition: "all 0.12s",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--text-tertiary)";
                }}
              >
                &times;
              </button>
            </div>

            {/* ── Body ─────────────────────────────── */}
            <div
              style={{
                padding: "var(--space-5)",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
