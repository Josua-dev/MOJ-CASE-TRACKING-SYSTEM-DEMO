import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Sidebar from './components/Sidebar';
import './index.css';

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of all cases and system activity' },
  cases: { title: 'Case Register', subtitle: 'Search, manage and track all active cases' },
};

function Shell() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) return <Login />;

  const info = PAGE_TITLES[page];

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">
            <h1>{info.title}</h1>
            <p>{info.subtitle}</p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-NA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="page-content">
          {page === 'dashboard' && <Dashboard />}
          {page === 'cases' && <Cases />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><Shell /></AuthProvider>;
}
