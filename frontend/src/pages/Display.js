import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import ChartRenderer from '../components/charts/ChartRenderer';

/**
 * Display mode — fullscreen TV/monitor display for visualisations
 *
 * Renders outside the app-shell. Supports:
 *   - Single visualisation mode (?vis=:id)
 *   - Playlist rotation (?playlist=:id)
 *   - Auto-refresh, keyboard nav, pause, fullscreen
 */
export default function Display() {
  const [visualisations, setVisualisations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const overlayTimeout = useRef(null);
  const containerRef = useRef(null);

  const params = new URLSearchParams(window.location.search);
  const singleVisId = params.get('vis');
  const playlistId = params.get('playlist');

  // Fetch visualisations
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (singleVisId) {
          const { data } = await axios.get(`/api/visualisations/${singleVisId}`);
          setVisualisations([data.data]);
        } else if (playlistId) {
          const { data } = await axios.get('/api/playlists', { params: { limit: 50 } });
          const pl = (data.data || []).find(p => p.id === playlistId);
          if (pl?.items?.length) {
            const visPromises = pl.items.map(item =>
              axios.get(`/api/visualisations/${item.visualisation_id}`)
                .then(r => ({ ...r.data.data, display_duration: item.duration_seconds }))
                .catch(() => null)
            );
            const visList = (await Promise.all(visPromises)).filter(Boolean);
            setVisualisations(visList);
          } else {
            setError('Playlist is empty or not found.');
          }
        } else {
          // Show all enabled visualisations
          const { data } = await axios.get('/api/visualisations', { params: { enabled: true, limit: 100 } });
          setVisualisations(data.data || []);
        }
      } catch {
        setError('Failed to load display data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [singleVisId, playlistId]);

  // Fetch data for current visualisation
  const currentVis = visualisations[currentIndex];

  useEffect(() => {
    if (!currentVis) return;
    let cancelled = false;

    async function fetchData() {
      try {
        const { data } = await axios.get(`/api/visualisations/${currentVis.id}/data`);
        if (!cancelled) setChartData(data.data?.data || null);
      } catch {
        if (!cancelled) setChartData(null);
      }
    }

    fetchData();

    // Auto-refresh
    if (currentVis.auto_refresh && currentVis.refresh_interval > 0) {
      const interval = setInterval(fetchData, currentVis.refresh_interval * 1000);
      return () => { cancelled = true; clearInterval(interval); };
    }

    return () => { cancelled = true; };
  }, [currentVis?.id, currentVis?.auto_refresh, currentVis?.refresh_interval]);

  // Auto-rotation
  useEffect(() => {
    if (paused || visualisations.length <= 1) return;

    const duration = (currentVis?.display_duration || 30) * 1000;
    const timer = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % visualisations.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [paused, currentIndex, visualisations.length, currentVis?.display_duration]);

  // Auto-hide overlay
  useEffect(() => {
    if (!showOverlay) return;
    overlayTimeout.current = setTimeout(() => setShowOverlay(false), 3000);
    return () => clearTimeout(overlayTimeout.current);
  }, [showOverlay]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard handlers
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev - 1 + visualisations.length) % visualisations.length);
        setShowOverlay(true);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev + 1) % visualisations.length);
        setShowOverlay(true);
      } else if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        setPaused(p => !p);
        setShowOverlay(true);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        else window.close();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visualisations.length, toggleFullscreen]);

  if (loading) {
    return (
      <div className="display-mode">
        <div className="loading-page">
          <div className="spinner" />
          <p style={{ color: 'var(--text-tertiary)', marginTop: 16 }}>Loading display...</p>
        </div>
      </div>
    );
  }

  if (error || !currentVis) {
    return (
      <div className="display-mode">
        <div className="error-state">
          <h3>Display Unavailable</h3>
          <p>{error || 'No visualisations to display.'}</p>
          <button className="btn btn-ghost" onClick={() => window.close()}>Close</button>
        </div>
      </div>
    );
  }

  const chartHeight = window.innerHeight - 160;

  return (
    <div
      className="display-mode"
      ref={containerRef}
      onClick={() => setShowOverlay(true)}
      onMouseMove={() => setShowOverlay(true)}
    >
      {/* Main chart */}
      <div className="display-chart">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVis.id + '-' + currentIndex}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <h1 className="display-title">{currentVis.name}</h1>
            <ChartRenderer
              chartType={currentVis.chart_type}
              data={chartData}
              config={currentVis.config}
              height={chartHeight}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Overlay controls */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="display-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="display-controls">
              <button className="display-btn" onClick={() => setCurrentIndex(prev => (prev - 1 + visualisations.length) % visualisations.length)} title="Previous (←)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>

              <button className="display-btn" onClick={() => setPaused(p => !p)} title={paused ? 'Resume' : 'Pause (Space)'}>
                {paused ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                )}
              </button>

              <button className="display-btn" onClick={() => setCurrentIndex(prev => (prev + 1) % visualisations.length)} title="Next (→)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <span className="display-progress">
                {currentIndex + 1} / {visualisations.length}
              </span>

              <button className="display-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
                {isFullscreen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                )}
              </button>

              <button className="display-btn display-btn-exit" onClick={() => window.close()} title="Exit (Esc)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused indicator */}
      {paused && (
        <div className="display-paused">⏸ Paused</div>
      )}
    </div>
  );
}
