import React from 'react';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  cases: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

export default function Sidebar({ page, setPage }) {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="coat">⚖️</div>
        <h2>Ministry of Justice</h2>
        <p>Republic of Namibia</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
          {icons.dashboard} Dashboard
        </button>
        <button className={`nav-item ${page === 'cases' ? 'active' : ''}`} onClick={() => setPage('cases')}>
          {icons.cases} Cases
        </button>

        <div className="nav-section-label" style={{ marginTop: 24 }}>System</div>
        <button className="nav-item" onClick={logout}>
          {icons.logout} Sign Out
        </button>
      </nav>

      <div className="sidebar-user">
        <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
      </div>
    </div>
  );
}
