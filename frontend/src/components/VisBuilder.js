import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CHART_TYPES, CATEGORIES, DATA_SOURCES, CHART_SIZES, COLOUR_THEMES, CHART_ICONS } from './charts/ChartRegistry';

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'chartType', label: 'Chart Type' },
  { key: 'dataSource', label: 'Data Source' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'filters', label: 'Filters' },
  { key: 'display', label: 'Display' },
];

const DEFAULT_FORM = {
  name: '',
  description: '',
  category: '',
  tags: '',
  chart_type: 'bar',
  data_source: 'cases/byType',
  colour_theme: 'default',
  chart_size: 'medium',
  animation_enabled: true,
  auto_refresh: false,
  refresh_interval: 0,
  fullscreen_support: true,
  config: {},
  filters: [],
};

export default function VisBuilder({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(() => existing ? {
    name: existing.name || '',
    description: existing.description || '',
    category: existing.category || '',
    tags: existing.tags || '',
    chart_type: existing.chart_type || 'bar',
    data_source: existing.data_source || 'cases/byType',
    colour_theme: existing.colour_theme || 'default',
    chart_size: existing.chart_size || 'medium',
    animation_enabled: existing.animation_enabled !== false,
    auto_refresh: !!existing.auto_refresh,
    refresh_interval: existing.refresh_interval || 0,
    fullscreen_support: existing.fullscreen_support !== false,
    config: existing.config || {},
    filters: existing.filters || [],
  } : { ...DEFAULT_FORM });

  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.chart_type) errs.chart_type = 'Chart type is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSaved(form);
  }

  return (
    <motion.div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="modal modal-lg vis-builder"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="modal-header">
          <h3>{existing ? 'Edit Visualisation' : 'New Visualisation'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="builder-layout" style={{ display: 'flex', minHeight: 400 }}>
          {/* Tab sidebar */}
          <div className="builder-tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`builder-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="builder-content" style={{ flex: 1, padding: 'var(--space-5)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'general' && (
                  <div className="builder-tab-content">
                    <h4>General Settings</h4>
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Name *</label>
                        <input
                          className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                          value={form.name}
                          onChange={e => set('name', e.target.value)}
                          placeholder="My Visualisation"
                          autoFocus
                        />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-input"
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder="Optional description..."
                        rows={3}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Category</label>
                        <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                          <option value="">No category</option>
                          {CATEGORIES.filter(c => c.key).map(c => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Tags</label>
                        <input
                          className="form-input"
                          value={form.tags}
                          onChange={e => set('tags', e.target.value)}
                          placeholder="comma, separated, tags"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chartType' && (
                  <div className="builder-tab-content">
                    <h4>Chart Type</h4>
                    <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-4)' }}>Select the chart type for this visualisation</p>

                    {/* Standard charts grid */}
                    <div className="chart-type-grid">
                      {Object.entries(CHART_TYPES)
                        .filter(([, info]) => info.category !== 'Cases')
                        .map(([key, info]) => (
                          <button
                            key={key}
                            className={`chart-type-option ${form.chart_type === key ? 'active' : ''}`}
                            onClick={() => set('chart_type', key)}
                          >
                            <span className="chart-type-icon">{CHART_ICONS[key] || '📊'}</span>
                            <span className="chart-type-label">{info.label}</span>
                            <span className="chart-type-badge">{info.category}</span>
                          </button>
                        ))}
                    </div>

                    {/* Case-specific presets */}
                    <h5 style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>Case-Specific Presets</h5>
                    <div className="chart-type-grid">
                      {Object.entries(CHART_TYPES)
                        .filter(([, info]) => info.category === 'Cases')
                        .map(([key, info]) => (
                          <button
                            key={key}
                            className={`chart-type-option ${form.chart_type === key ? 'active' : ''}`}
                            onClick={() => {
                              set('chart_type', key);
                              set('data_source', info.dataSource);
                            }}
                          >
                            <span className="chart-type-icon">{CHART_ICONS[key] || '📊'}</span>
                            <span className="chart-type-label">{info.label}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {activeTab === 'dataSource' && (
                  <div className="builder-tab-content">
                    <h4>Data Source</h4>
                    <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-4)' }}>Choose the data source for this visualisation</p>
                    <div className="data-source-list">
                      {DATA_SOURCES.map(ds => (
                        <button
                          key={ds.value}
                          className={`data-source-option ${form.data_source === ds.value ? 'active' : ''}`}
                          onClick={() => set('data_source', ds.value)}
                        >
                          <div className="data-source-radio">
                            <div className={`radio-dot ${form.data_source === ds.value ? 'active' : ''}`} />
                          </div>
                          <div className="data-source-info">
                            <span className="data-source-label">{ds.label}</span>
                            <span className="data-source-value">{ds.value}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="builder-tab-content">
                    <h4>Appearance</h4>
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Colour Theme</label>
                        <div className="colour-theme-grid">
                          {COLOUR_THEMES.map(t => (
                            <button
                              key={t.value}
                              className={`colour-theme-option ${form.colour_theme === t.value ? 'active' : ''}`}
                              onClick={() => set('colour_theme', t.value)}
                            >
                              <div className="colour-swatches">
                                {t.colors.slice(0, 3).map((c, i) => (
                                  <span key={i} className="colour-swatch" style={{ background: c }} />
                                ))}
                              </div>
                              <span className="colour-theme-label">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Chart Size</label>
                        <div className="chart-size-grid">
                          {CHART_SIZES.map(s => (
                            <button
                              key={s.value}
                              className={`chart-size-option ${form.chart_size === s.value ? 'active' : ''}`}
                              onClick={() => set('chart_size', s.value)}
                            >
                              <div className="chart-size-vis">
                                <div className="chart-size-rect" style={{ gridColumn: `span ${s.cols}`, gridRow: `span ${s.rows}` }} />
                              </div>
                              <span>{s.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={form.animation_enabled}
                            onChange={e => set('animation_enabled', e.target.checked)}
                          />
                          <span>Enable animations</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'filters' && (
                  <div className="builder-tab-content">
                    <h4>Filters</h4>
                    <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-4)' }}>Add data filters (advanced)</p>
                    {form.filters.map((filter, i) => (
                      <div className="form-row filter-row" key={i} style={{ marginBottom: 'var(--space-3)' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <select
                            className="form-input"
                            value={filter.filter_type}
                            onChange={e => {
                              const f = [...form.filters];
                              f[i] = { ...f[i], filter_type: e.target.value };
                              set('filters', f);
                            }}
                          >
                            <option value="case_type">Case Type</option>
                            <option value="status">Status</option>
                            <option value="priority">Priority</option>
                            <option value="court">Court</option>
                            <option value="presiding_officer">Magistrate</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ flex: 2 }}>
                          <input
                            className="form-input"
                            value={filter.filter_value}
                            onChange={e => {
                              const f = [...form.filters];
                              f[i] = { ...f[i], filter_value: e.target.value };
                              set('filters', f);
                            }}
                            placeholder="Filter value"
                          />
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => set('filters', form.filters.filter((_, j) => j !== i))}
                          style={{ alignSelf: 'flex-end', marginBottom: 4 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => set('filters', [...form.filters, { filter_type: 'status', filter_value: '', enabled: true }])}
                    >
                      + Add Filter
                    </button>
                  </div>
                )}

                {activeTab === 'display' && (
                  <div className="builder-tab-content">
                    <h4>Display Settings</h4>
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Auto-refresh</label>
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={form.auto_refresh}
                            onChange={e => set('auto_refresh', e.target.checked)}
                          />
                          <span>Enable auto-refresh</span>
                        </label>
                      </div>
                    </div>
                    {form.auto_refresh && (
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Refresh Interval (seconds)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={form.refresh_interval}
                            onChange={e => set('refresh_interval', parseInt(e.target.value) || 0)}
                            min={5}
                            max={3600}
                            style={{ maxWidth: 200 }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={form.fullscreen_support}
                            onChange={e => set('fullscreen_support', e.target.checked)}
                          />
                          <span>Enable fullscreen display mode</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {existing ? 'Save Changes' : 'Create Visualisation'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
