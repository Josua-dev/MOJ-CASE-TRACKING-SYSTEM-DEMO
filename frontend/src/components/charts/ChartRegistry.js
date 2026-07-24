/**
 * Chart Registry — defines every chart type with metadata
 */
export const CHART_TYPES = {
  /* ── Standard charts ─────────────────────── */
  bar:              { label: 'Bar Chart',        dataShape: 'categorical', category: 'Standard' },
  line:             { label: 'Line Chart',       dataShape: 'timeseries',  category: 'Standard' },
  pie:              { label: 'Pie Chart',        dataShape: 'categorical', category: 'Standard' },
  donut:            { label: 'Donut Chart',      dataShape: 'categorical', category: 'Standard' },
  area:             { label: 'Area Chart',       dataShape: 'timeseries',  category: 'Standard' },

  /* ── Comparative charts ──────────────────── */
  stackedBar:       { label: 'Stacked Bar',      dataShape: 'stacked',     category: 'Comparative' },
  stackedArea:      { label: 'Stacked Area',     dataShape: 'stacked',     category: 'Comparative' },
  radar:            { label: 'Radar Chart',      dataShape: 'categorical', category: 'Comparative' },
  radialBar:        { label: 'Radial Bar',       dataShape: 'categorical', category: 'Comparative' },
  composed:         { label: 'Composed Chart',   dataShape: 'timeseries',  category: 'Comparative' },

  /* ── Statistical charts ──────────────────── */
  scatter:          { label: 'Scatter Plot',     dataShape: 'xy',          category: 'Statistical' },
  heatmap:          { label: 'Heatmap',          dataShape: 'matrix',      category: 'Statistical' },
  treemap:          { label: 'Treemap',          dataShape: 'hierarchy',   category: 'Statistical' },

  /* ── KPI charts ──────────────────────────── */
  gauge:            { label: 'Gauge',            dataShape: 'single',      category: 'KPI' },
  kpi:              { label: 'KPI Card',         dataShape: 'single',      category: 'KPI' },
  progress:         { label: 'Progress Bar',     dataShape: 'single',      category: 'KPI' },
  funnel:           { label: 'Funnel Chart',     dataShape: 'categorical', category: 'KPI' },

  /* ── Case-specific presets ────────────────── */
  'cases-byType':     { label: 'Cases by Type',     dataSource: 'cases/byType',     component: 'bar',    category: 'Cases' },
  'cases-byMonth':    { label: 'Cases by Month',    dataSource: 'cases/byMonth',    component: 'line',   category: 'Cases' },
  'cases-byPriority': { label: 'Cases by Priority', dataSource: 'cases/byPriority', component: 'donut',  category: 'Cases' },
  'cases-byStatus':   { label: 'Case Status',       dataSource: 'cases/byStatus',   component: 'pie',    category: 'Cases' },
  'cases-byMagistrate': { label: 'Cases by Magistrate', dataSource: 'cases/byMagistrate', component: 'bar', category: 'Cases' },
  'user-activity':    { label: 'User Activity',     dataSource: 'users/activity',   component: 'line',   category: 'Cases' },
  'cases-total':      { label: 'Case Totals',       dataSource: 'cases/total',      component: 'kpi',    category: 'Cases' },
};

export const CHART_COLORS = [
  '#1e6bb8', '#0d7c3f', '#b8942e', '#b91c1c', '#6b48d1',
  '#cbd5e1', '#14b8a6', '#f97316', '#ec4899', '#8b5cf6',
];

export const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'Standard', label: 'Standard' },
  { key: 'Comparative', label: 'Comparative' },
  { key: 'Statistical', label: 'Statistical' },
  { key: 'KPI', label: 'KPI' },
  { key: 'Cases', label: 'Cases' },
];

export const DATA_SOURCES = [
  { value: 'cases/byType',      label: 'Cases by Type' },
  { value: 'cases/byMonth',     label: 'Cases by Month' },
  { value: 'cases/byPriority',  label: 'Cases by Priority' },
  { value: 'cases/byStatus',    label: 'Cases by Status' },
  { value: 'cases/byMagistrate', label: 'Cases by Magistrate' },
  { value: 'users/activity',    label: 'User Activity' },
  { value: 'cases/total',       label: 'Total Cases' },
];

export const CHART_SIZES = [
  { value: 'small',  label: 'Small',  cols: 1, rows: 1 },
  { value: 'medium', label: 'Medium', cols: 2, rows: 1 },
  { value: 'large',  label: 'Large',  cols: 2, rows: 2 },
  { value: 'full',   label: 'Full',   cols: 3, rows: 2 },
];

export const COLOUR_THEMES = [
  { value: 'default',  label: 'Default', colors: ['#1e6bb8', '#0d7c3f', '#b8942e', '#b91c1c', '#6b48d1'] },
  { value: 'warm',     label: 'Warm',    colors: ['#f97316', '#dc2626', '#eab308', '#ec4899', '#92400e'] },
  { value: 'cool',     label: 'Cool',    colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#6366f1', '#8b5cf6'] },
  { value: 'forest',   label: 'Forest',  colors: ['#166534', '#15803d', '#22c55e', '#65a30d', '#0f766e'] },
  { value: 'mono',     label: 'Monochrome', colors: ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#334155'] },
];

export const CHART_ICONS = {
  bar: '📊',
  line: '📈',
  pie: '🥧',
  donut: '🍩',
  area: '📉',
  stackedBar: '📊',
  stackedArea: '📉',
  radar: '🕸️',
  radialBar: '💫',
  composed: '📊',
  scatter: '✨',
  heatmap: '🗺️',
  treemap: '🔲',
  gauge: '🎯',
  kpi: '📋',
  progress: '📏',
  funnel: '🔻',
};
