import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import NotificationBell from './components/NotificationBell';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { registerServiceWorker } from './serviceWorkerRegistration';

// ── Code-split pages (React.lazy) ────────────────────────────
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cases = lazy(() => import('./pages/Cases'));
const Visualisations = lazy(() => import('./pages/Visualisations'));
const Display = lazy(() => import('./pages/Display'));
const Users = lazy(() => import('./pages/Users'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Reports = lazy(() => import('./pages/Reports'));

const PAGES = {
  dashboard: { title: 'Dashboard', subtitle: 'Case overview and analytics for the Magistrate Court' },
  cases: { title: 'Case Register', subtitle: 'Manage and track magistrate court cases' },
  visualisations: { title: 'Visualisations', subtitle: 'Create and manage data visualisations for display screens' },
  users: { title: 'User Management', subtitle: 'Manage system users and roles' },
  calendar: { title: 'Court Calendar', subtitle: 'Manage court sessions and scheduling' },
  reports: { title: 'Reports', subtitle: 'Generate PDF reports — case summaries, session rosters, case register' },
};

const SHORTCUTS = [
  { key: '1', action: 'Go to Dashboard' },
  { key: '2', action: 'Go to Case Register' },
  { key: '3', action: 'Go to Visualisations' },
  { key: '4', action: 'Go to User Management' },
  { key: '5', action: 'Go to Court Calendar' },
  { key: '6', action: 'Go to Reports' },
  { key: '?', action: 'Toggle this help panel' },
  { key: 'Esc', action: 'Close modals / dialogs' },
  { key: 'Tab', action: 'Cycle focus in modal forms' },
  { key: 'Shift+Tab', action: 'Reverse-cycle focus in modal forms' },
];

function LoadingFallback({ message = 'Loading...' }) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ marginTop: 16, color: 'var(--text-tertiary)' }}>{message}</p>
    </div>
  );
}

function ShortcutsModal({ onClose }) {
  return (
    <motion.div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="modal modal-sm"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="modal-header">
          <h3>Keyboard Shortcuts</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="shortcuts-grid">
            {SHORTCUTS.map((s, i) => (
              <motion.div
                className="shortcut-row"
                key={s.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
              >
                <kbd className="shortcut-key">{s.key}</kbd>
                <span className="shortcut-desc">{s.action}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Shell() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Update document title ──────────────────────────────────
  useEffect(() => {
    const current = PAGES[page];
    if (current) {
      document.title = `${current.title} — MOJ Case Tracker`;
    } else {
      document.title = 'MOJ Case Tracker';
    }
  }, [page]);

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger shortcuts when typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === '1') setPage('dashboard');
      if (e.key === '2') setPage('cases');
      if (e.key === '3') setPage('visualisations');
      if (e.key === '4') setPage('users');
      if (e.key === '5') setPage('calendar');
      if (e.key === '6') setPage('reports');
      if (e.key === '?') { e.preventDefault(); setShowShortcuts(p => !p); }
      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return; }
        document.dispatchEvent(new CustomEvent('key:escape'));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts]);

  const navigateTo = useCallback((p) => {
    if (p === 'shortcuts') { setShowShortcuts(true); return; }
    setPage(p);
    setMobileMenuOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    );
  }

  // Display mode — renders outside app-shell (fullscreen TV/monitor)
  if (page === 'display') {
    return (
      <Suspense fallback={<LoadingFallback message="Starting display..." />}>
        <Display />
      </Suspense>
    );
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const current = PAGES[page] || PAGES.dashboard;

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={navigateTo} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h2>{current.title}</h2>
            <span className="topbar-divider" />
            <span className="topbar-subtitle">{current.subtitle}</span>
          </div>
          <div className="topbar-center">
            <SearchBar navigateTo={navigateTo} />
          </div>
          <div className="topbar-right">
            <NotificationBell />
            <span className="topbar-date">{dateStr}</span>
          </div>
        </header>
        <main className="page-content" role="main">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Suspense fallback={<LoadingFallback />}>
                {page === 'dashboard' && <Dashboard />}
                {page === 'cases' && <Cases />}
                {page === 'visualisations' && <Visualisations />}
                {page === 'users' && <Users />}
                {page === 'calendar' && <Calendar />}
                {page === 'reports' && <Reports />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Keyboard shortcuts help modal */}
      <AnimatePresence>
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </AnimatePresence>

      {/* Offline indicator banner */}
      <OfflineIndicator />

      {/* PWA install prompt */}
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    registerServiceWorker({
      onUpdate: () => {
        console.log('📡 New version available — refresh to update.');
      },
    });
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
