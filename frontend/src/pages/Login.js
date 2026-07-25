import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import Logo from '../components/Logo';

/* ══════════════════════════════════════════════════════════════
   SVG Icons
   ══════════════════════════════════════════════════════════════ */

function ScalesIcon({ size = 48 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Base */}
      <rect x="20" y="40" width="8" height="5" rx="1.5" fill="currentColor" opacity="0.7" />
      {/* Central pillar */}
      <line x1="24" y1="10" x2="24" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Horizontal beam */}
      <line x1="4" y1="10" x2="44" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Left chains */}
      <line x1="11" y1="13" x2="8" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="13" x2="18" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Left pan */}
      <path d="M4 26 C4 31, 8 34, 13 34 C18 34, 22 31, 22 26" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="7" y1="26" x2="19" y2="26" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      {/* Right chains */}
      <line x1="30" y1="13" x2="30" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="37" y1="13" x2="40" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Right pan */}
      <path d="M26 26 C26 31, 30 34, 35 34 C40 34, 44 31, 44 26" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="29" y1="26" x2="41" y2="26" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      {/* Top ornament */}
      <circle cx="24" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   Injected page-level CSS (avoids modifying index.css)
   ══════════════════════════════════════════════════════════════ */

const lgnStyles = `
  /* ── Card enhancement ───────────────────────── */
  .lgn-card {
    padding: 32px 28px;
    position: relative;
    overflow: hidden;
  }

  /* ── Gold accent bar ────────────────────────── */
  .lgn-accent {
    width: 56px;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--accent, #b8942e), transparent);
    border-radius: 2px;
    margin: -12px auto 22px;
  }

  /* ── Serif typography for title ──────────────── */
  .login-header .moj-logo-ministry {
    font-family: Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif !important;
    font-weight: 700 !important;
    letter-spacing: 0.02em;
  }
  .login-header .moj-logo-republic {
    letter-spacing: 0.04em;
    font-size: 0.78rem !important;
  }

  /* ── Scales-of-justice emblem ───────────────── */
  .lgn-emblem {
    display: flex;
    justify-content: center;
    margin-bottom: 6px;
  }
  .lgn-emblem svg {
    color: var(--accent, #b8942e);
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
  }

  /* ── Input icon wrapper ─────────────────────── */
  .lgn-input-wrapper {
    position: relative;
  }
  .lgn-input-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: var(--text-tertiary);
    pointer-events: none;
    transition: color 0.2s ease;
    z-index: 1;
  }
  .lgn-input-icon svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .lgn-input-wrapper:focus-within .lgn-input-icon {
    color: var(--primary);
  }

  /* ── Enhanced error banner ──────────────────── */
  .lgn-error {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-left: 4px solid var(--danger);
    border-radius: 8px;
    color: var(--danger);
    font-size: 0.82rem;
    margin-bottom: 18px;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  .lgn-error svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    opacity: 0.9;
  }

  /* ── Button enhancements ────────────────────── */
  .lgn-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 16px !important;
    margin-top: 14px !important;
    border-radius: 8px !important;
    font-weight: 600;
    letter-spacing: 0.03em;
    font-size: 0.9rem;
    transition: all 0.2s ease !important;
    position: relative;
    overflow: hidden;
  }
  .lgn-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  /* ── Button spinner (custom for white bg) ───── */
  .lgn-btn-spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lgn-spin 0.6s linear infinite;
    flex-shrink: 0;
  }
  @keyframes lgn-spin {
    to { transform: rotate(360deg); }
  }

  /* ── Copyright footer ───────────────────────── */
  .lgn-copyright {
    text-align: center;
    font-size: 0.72rem;
    color: var(--text-tertiary);
    margin-top: 10px;
    padding-top: 6px;
    letter-spacing: 0.03em;
    opacity: 0.8;
  }

  /* ── Dark-mode adjustments ──────────────────── */
  [data-theme="dark"] .lgn-emblem svg {
    color: var(--accent, #d4a830);
  }
  [data-theme="dark"] .lgn-error {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.2);
  }

  /* ── Responsive ─────────────────────────────── */
  @media (max-width: 480px) {
    .lgn-card {
      padding: 24px 20px;
    }
    .lgn-accent {
      margin: -8px auto 18px;
    }
  }
`;

/* ══════════════════════════════════════════════════════════════
   Inline style objects
   ══════════════════════════════════════════════════════════════ */

const pageStyle = {
  background: `
    linear-gradient(
      155deg,
      rgba(0,18,43,0.77) 0%,
      rgba(0,34,80,0.72) 20%,
      rgba(0,53,128,0.67) 45%,
      rgba(0,42,92,0.72) 70%,
      rgba(0,26,58,0.80) 100%
    ),
    url('/images/court-bg.jpg') center / cover no-repeat
  `,
  backgroundAttachment: 'fixed, fixed',
};

const overlayStyle = {
  background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)',
};

const cardEnhance = {
  background: 'rgba(15, 23, 36, 0.55)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
};

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errs = {};
    if (!email.trim()) errs.email = 'Email is required.';
    if (!password.trim()) errs.password = 'Password is required.';
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{lgnStyles}</style>

      <div
        className="login-page"
        style={pageStyle}
      >
        <div className="login-overlay" style={overlayStyle} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 2 }}
        >
          <GlassCard className="lgn-card" style={cardEnhance}>
            {/* ── Gold accent bar ───────────────────────────── */}
            <div className="lgn-accent" />

            {/* ── Emblem + Title ────────────────────────────── */}
            <motion.div
              className="login-header"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
            >
              <div className="lgn-emblem">
                <ScalesIcon size={48} />
              </div>
              <Logo variant="login" />
            </motion.div>

            {/* ── Error banner ──────────────────────────────── */}
            {error && (
              <motion.div
                className="lgn-error"
                role="alert"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <AlertIcon />
                <span>{error}</span>
              </motion.div>
            )}

            {/* ── Login form ────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Email field */}
              <motion.div
                className="form-group"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.15 }}
              >
                <label className="form-label" htmlFor="login-email">
                  Email Address <span className="required">*</span>
                </label>
                <div className="lgn-input-wrapper">
                  <span className="lgn-input-icon">
                    <UserIcon />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    className={`form-input lgn-input ${fieldErrors.email ? 'error' : ''}`}
                    placeholder="you@moj.na"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); setFieldErrors(prev => ({...prev, email: undefined})); }}
                    style={{ paddingLeft: 34 }}
                    autoFocus
                    required
                    autoComplete="email"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  />
                </div>
                {fieldErrors.email && <p className="form-error" id="email-error">{fieldErrors.email}</p>}
              </motion.div>

              {/* Password field */}
              <motion.div
                className="form-group"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <label className="form-label" htmlFor="login-password">
                  Password <span className="required">*</span>
                </label>
                <div className="lgn-input-wrapper">
                  <span className="lgn-input-icon">
                    <LockIcon />
                  </span>
                  <input
                    id="login-password"
                    type="password"
                    className={`form-input lgn-input ${fieldErrors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); setFieldErrors(prev => ({...prev, password: undefined})); }}
                    style={{ paddingLeft: 34 }}
                    required
                    autoComplete="current-password"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  />
                </div>
                {fieldErrors.password && <p className="form-error" id="password-error">{fieldErrors.password}</p>}
              </motion.div>

              {/* Submit button */}
              <motion.button
                type="submit"
                className="btn btn-accent lgn-btn"
                disabled={loading}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.25 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {loading ? (
                  <>
                    <span className="lgn-btn-spinner" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* ── Divider ───────────────────────────────────── */}
            <motion.div
              className="login-divider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            />

            {/* ── Warning notice ────────────────────────────── */}
            <motion.p
              className="login-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.35 }}
            >
              Authorised personnel only.<br />
              Unauthorised access is prohibited by law.
            </motion.p>

            {/* ── Copyright ─────────────────────────────────── */}
            <motion.p
              className="lgn-copyright"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.4 }}
            >
              &copy; Ministry of Justice, Namibia
            </motion.p>
          </GlassCard>
        </motion.div>
      </div>
    </>
  );
}
