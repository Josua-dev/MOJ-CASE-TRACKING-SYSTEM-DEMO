import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';
import ChartRenderer from './charts/ChartRenderer';
import { CHART_TYPES, CHART_ICONS } from './charts/ChartRegistry';

export default function VisCard({ vis, onEdit, onDuplicate, onDelete, onToggle, onFavourite, dragHandleProps }) {
  const [chartData, setChartData] = useState(null);
  const [dataError, setDataError] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (vis.enabled) {
      axios.get(`/api/visualisations/${vis.id}/data`)
        .then(({ data }) => { if (!cancelled) setChartData(data.data?.data || null); })
        .catch(() => { if (!cancelled) setDataError(true); });
    }
    return () => { cancelled = true; };
  }, [vis.id, vis.enabled]);

  const chartType = vis.chart_type;
  const typeInfo = CHART_TYPES[chartType];
  const icon = CHART_ICONS[chartType] || '📊';

  return (
    <motion.div
      className={`vis-card ${!vis.enabled ? 'vis-card-disabled' : ''}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Drag handle */}
      {dragHandleProps && (
        <div className="vis-card-drag" {...dragHandleProps}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
        </div>
      )}

      {/* Card header */}
      <div className="vis-card-header" onClick={() => setShowActions(!showActions)}>
        <div className="vis-card-title">
          <span className="vis-card-icon">{icon}</span>
          <div>
            <span className="vis-card-name">{vis.name}</span>
            {vis.category && <span className="vis-card-category">{vis.category}</span>}
          </div>
        </div>
        <button
          className="vis-card-fav"
          onClick={(e) => { e.stopPropagation(); onFavourite?.(vis.id, !vis.is_favourite); }}
          title={vis.is_favourite ? 'Remove from favourites' : 'Add to favourites'}
          style={{ color: vis.is_favourite ? 'var(--warning)' : 'var(--text-tertiary)' }}
        >
          {vis.is_favourite ? '★' : '☆'}
        </button>
      </div>

      {/* Chart preview */}
      <div className="vis-card-preview">
        {dataError ? (
          <div className="empty-state" style={{ height: 140 }}>
            <p style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>Failed to load</p>
          </div>
        ) : vis.enabled ? (
          <ChartRenderer chartType={chartType} data={chartData} config={vis.config} height={140} compact />
        ) : (
          <div className="empty-state" style={{ height: 140 }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Disabled</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <motion.div
        className="vis-card-actions"
        initial={false}
        animate={{ opacity: showActions ? 1 : 0, y: showActions ? 0 : 4 }}
        transition={{ duration: 0.15 }}
      >
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit?.(vis)} title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onDuplicate?.(vis.id)} title="Duplicate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onToggle?.(vis.id, !vis.enabled); }} title={vis.enabled ? 'Disable' : 'Enable'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx={vis.enabled ? 16 : 8} cy="12" r="3" fill="currentColor"/></svg>
        </button>
        <button className="btn btn-ghost btn-sm vis-card-delete" onClick={() => onDelete?.(vis)} title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </motion.div>

      {/* Data source & refresh badge */}
      {vis.enabled && (
        <div className="vis-card-footer">
          <span className="vis-card-source">{vis.data_source}</span>
          {vis.refresh_interval > 0 && (
            <span className="vis-card-refresh">↻ {vis.refresh_interval}s</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
