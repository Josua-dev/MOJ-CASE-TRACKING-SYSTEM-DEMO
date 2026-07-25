import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MonitorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  cases: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  visualisations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round"/>
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  shortcuts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
      <line x1="9" y1="9" x2="15" y2="9"/><line x1="15" y1="13" x2="9" y2="13"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

export default function Sidebar({ page, setPage, totalCases, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const activeNavStyle = {
    boxShadow: 'inset 3px 0 0 var(--primary)',
  };

  const navHover = { x: 3 };
  const navTap = { scale: 0.97 };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
        )}
      </AnimatePresence>
      <motion.aside
        id="sidebar"
        className={`sidebar ${isOpen ? 'sidebar-mobile-open' : ''}`}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
        }}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Logo variant="sidebar" />
          </div>
          <button className="sidebar-mobile-close" onClick={onClose} aria-label="Close menu">&times;</button>
        </div>

      <nav className="sidebar-nav" id="main-navigation" aria-label="Main navigation">
        <div className="sidebar-section">
          <p className="sidebar-label">Main</p>

          <motion.button
            className={`nav-link ${page === 'dashboard' ? 'active' : ''}`}
            onClick={() => setPage('dashboard')}
            aria-current={page === 'dashboard' ? 'page' : undefined}
            whileHover={navHover}
            whileTap={navTap}
            transition={{ duration: 0.15 }}
            style={page === 'dashboard' ? activeNavStyle : undefined}
          >
            {icons.dashboard}
            <span>Dashboard</span>
          </motion.button>

          <motion.button
            className={`nav-link ${page === 'cases' ? 'active' : ''}`}
            onClick={() => setPage('cases')}
            aria-current={page === 'cases' ? 'page' : undefined}
            whileHover={navHover}
            whileTap={navTap}
            transition={{ duration: 0.15 }}
            style={page === 'cases' ? activeNavStyle : undefined}
          >
            {icons.cases}
            <span>Cases</span>
            {totalCases > 0 && <span className="nav-badge">{totalCases}</span>}
          </motion.button>

          {user?.role === 'admin' && (
            <motion.button
              className={`nav-link ${page === 'visualisations' ? 'active' : ''}`}
              onClick={() => setPage('visualisations')}
              aria-current={page === 'visualisations' ? 'page' : undefined}
              whileHover={navHover}
              whileTap={navTap}
              transition={{ duration: 0.15 }}
              style={page === 'visualisations' ? activeNavStyle : undefined}
            >
              {icons.visualisations}
              <span>Visualisations</span>
            </motion.button>
          )}

          {user?.role === 'admin' && (
            <motion.button
              className={`nav-link ${page === 'calendar' ? 'active' : ''}`}
              onClick={() => setPage('calendar')}
              aria-current={page === 'calendar' ? 'page' : undefined}
              whileHover={navHover}
              whileTap={navTap}
              transition={{ duration: 0.15 }}
              style={page === 'calendar' ? activeNavStyle : undefined}
            >
              {icons.calendar}
              <span>Calendar</span>
            </motion.button>
          )}

          {user?.role === 'admin' && (
            <motion.button
              className={`nav-link ${page === 'reports' ? 'active' : ''}`}
              onClick={() => setPage('reports')}
              aria-current={page === 'reports' ? 'page' : undefined}
              whileHover={navHover}
              whileTap={navTap}
              transition={{ duration: 0.15 }}
              style={page === 'reports' ? activeNavStyle : undefined}
            >
              {icons.reports}
              <span>Reports</span>
            </motion.button>
          )}

          {user?.role === 'admin' && (
            <motion.button
              className={`nav-link ${page === 'users' ? 'active' : ''}`}
              onClick={() => setPage('users')}
              aria-current={page === 'users' ? 'page' : undefined}
              whileHover={navHover}
              whileTap={navTap}
              transition={{ duration: 0.15 }}
              style={page === 'users' ? activeNavStyle : undefined}
            >
              {icons.users}
              <span>Users</span>
            </motion.button>
          )}
        </div>

        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <p className="sidebar-label">System</p>

          <motion.button
            className="nav-link"
            onClick={() => {
              const ev = new CustomEvent('key:shortcuts');
              document.dispatchEvent(ev);
            }}
            aria-label="Keyboard shortcuts"
            whileHover={navHover}
            whileTap={navTap}
            transition={{ duration: 0.15 }}
          >
            {icons.shortcuts}
            <span>Shortcuts</span>
          </motion.button>

          <motion.button
            className="nav-link"
            onClick={logout}
            whileHover={navHover}
            whileTap={navTap}
            transition={{ duration: 0.15 }}
          >
            {icons.logout}
            <span>Sign Out</span>
          </motion.button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <motion.div
          className="sidebar-user"
          onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
          whileHover={{ backgroundColor: 'var(--surface-hover)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          style={{ cursor: 'pointer' }}
        >
          <div className="sidebar-avatar" style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="sidebar-user-info">
            <div className="name">{user?.name || 'User'}</div>
            <div className="role">{user?.role || ''}</div>
          </div>
          <div className="theme-toggle" onClick={e => e.stopPropagation()} role="radiogroup" aria-label="Theme" style={{ position: 'relative' }}>
            {['light','system','dark'].map(t => (
              <motion.button
                key={t}
                className={`theme-option ${theme === t ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setTheme(t); }}
                role="radio"
                aria-checked={theme === t}
                aria-label={`${t} theme`}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.12 }}
              >
                {t === 'light' ? <SunIcon /> : t === 'dark' ? <MoonIcon /> : <MonitorIcon />}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.aside>
    </>
  );
}
