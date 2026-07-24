import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ComposedChart, Treemap,
  RadialBarChart, RadialBar, FunnelChart, Funnel,
} from 'recharts';
import { CHART_COLORS } from './ChartRegistry';
import ChartEmpty from './ChartEmpty';

const tooltipProps = {
  contentStyle: {
    borderRadius: 8,
    border: '1px solid var(--border)',
    fontSize: 13,
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-md)',
  },
  cursor: { fill: 'var(--surface-hover)' },
};

export default function ChartRenderer({ chartType, data, config = {}, height = 240, compact = false }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <ChartEmpty height={height} />;
  }

  const themeColors = CHART_COLORS;
  const animEnabled = config.animation_enabled !== false;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            {!compact && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipProps} />
            <Line type="monotone" dataKey="value" stroke={themeColors[0]} strokeWidth={2} dot={{ fill: themeColors[0], r: compact ? 2 : 3 }} activeDot={{ r: compact ? 3 : 5 }} isAnimationActive={animEnabled} />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            {!compact && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipProps} />
            <Area type="monotone" dataKey="value" stroke={themeColors[0]} fill={themeColors[0]} fillOpacity={0.15} strokeWidth={2} isAnimationActive={animEnabled} />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={0} outerRadius={compact ? 60 : 90} paddingAngle={1} isAnimationActive={animEnabled}>
              {data.map((_, i) => <Cell key={i} fill={themeColors[i % themeColors.length]} />)}
            </Pie>
            <Tooltip {...tooltipProps} />
          </PieChart>
        );

      case 'donut':
        return (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={compact ? 30 : 50} outerRadius={compact ? 60 : 90} paddingAngle={2} isAnimationActive={animEnabled}>
              {data.map((_, i) => <Cell key={i} fill={themeColors[i % themeColors.length]} />)}
            </Pie>
            <Tooltip {...tooltipProps} />
          </PieChart>
        );

      case 'stackedBar':
        return (
          <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            {!compact && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]} maxBarSize={compact ? 20 : 60} isAnimationActive={animEnabled}>
              {data.map((_, i) => <Cell key={i} fill={themeColors[i % themeColors.length]} />)}
            </Bar>
          </BarChart>
        );

      case 'radar':
        return (
          <RadarChart data={data} cx="50%" cy="50%" outerRadius={compact ? 50 : 80}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />
            {!compact && <PolarRadiusAxis tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />}
            <Radar name="value" dataKey="value" stroke={themeColors[0]} fill={themeColors[0]} fillOpacity={0.15} isAnimationActive={animEnabled} />
            <Tooltip {...tooltipProps} />
          </RadarChart>
        );

      case 'radialBar':
        return (
          <RadialBarChart data={data} cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" startAngle={180} endAngle={0}>
            <RadialBar dataKey="value" background cornerRadius={10} label={{ fill: 'var(--text-primary)', fontSize: 10 }} isAnimationActive={animEnabled}>
              {data.map((_, i) => <Cell key={i} fill={themeColors[i % themeColors.length]} />)}
            </RadialBar>
            <Tooltip {...tooltipProps} />
          </RadialBarChart>
        );

      case 'composed':
        return (
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            {!compact && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" barSize={compact ? 10 : 20} fill={themeColors[0]} isAnimationActive={animEnabled} />
            <Line type="monotone" dataKey="value" stroke={themeColors[1]} strokeWidth={2} isAnimationActive={animEnabled} />
          </ComposedChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            {!compact && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="value" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipProps} />
            <Scatter data={data} fill={themeColors[0]} isAnimationActive={animEnabled} />
          </ScatterChart>
        );

      case 'treemap':
        return (
          <Treemap data={data} dataKey="value" ratio={4 / 3} stroke="var(--surface)" fill={themeColors[0]} isAnimationActive={animEnabled}>
            {data.map((_, i) => <Cell key={i} fill={themeColors[i % themeColors.length]} />)}
          </Treemap>
        );

      case 'funnel':
        return (
          <FunnelChart>
            <Funnel dataKey="value" data={data} isAnimationActive={animEnabled}>
              {data.map((_, i) => <Cell key={i} fill={themeColors[i % themeColors.length]} />)}
            </Funnel>
            <Tooltip {...tooltipProps} />
          </FunnelChart>
        );

      case 'kpi':
        return (
          <div className="kpi-value" style={{ textAlign: 'center', padding: compact ? 8 : 16 }}>
            <div style={{ fontSize: compact ? '1.5rem' : '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {typeof data[0]?.value === 'number' ? data[0].value.toLocaleString() : data[0]?.value || '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
              {data[0]?.name || ''}
            </div>
          </div>
        );

      case 'gauge':
        return (
          <div style={{ textAlign: 'center', padding: compact ? 8 : 16, position: 'relative' }}>
            <svg viewBox="0 0 200 120" width={compact ? 120 : 200} height={compact ? 72 : 120}>
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--border)" strokeWidth={12} strokeLinecap="round" />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={themeColors[0]}
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${(data[0]?.value || 0) / 100 * 251.2} 251.2`}
                transform="rotate(180 100 100)"
              />
            </svg>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: -16 }}>
              {data[0]?.value || 0}%
            </div>
          </div>
        );

      case 'progress':
        return (
          <div style={{ padding: compact ? 8 : 24 }}>
            {data.map((item, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>{item.value}%</span>
                </div>
                <div className="status-bar-track" style={{ height: compact ? 6 : 8 }}>
                  <div className="status-bar-fill" style={{ width: `${Math.min(item.value, 100)}%`, background: themeColors[i % themeColors.length], height: '100%', borderRadius: 4, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        );

      case 'heatmap':
        return (
          <div className="heatmap-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.length, 10)}, 1fr)`, gap: 2, padding: compact ? 4 : 12, height: '100%', alignContent: 'center' }}>
            {data.slice(0, 50).map((item, i) => {
              const maxVal = Math.max(...data.map(d => d.value), 1);
              const intensity = (item.value / maxVal) * 0.7 + 0.3;
              return (
                <div key={i} title={`${item.name}: ${item.value}`} style={{
                  aspectRatio: '1', borderRadius: 3,
                  backgroundColor: `rgba(30, 107, 184, ${intensity})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', color: '#fff', fontWeight: 600,
                }}>
                  {!compact && item.value}
                </div>
              );
            })}
          </div>
        );

      default:
        return (
          <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            {!compact && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={compact ? 20 : 60} isAnimationActive={animEnabled}>
              {data.map((_, i) => <Cell key={i} fill={themeColors[i % themeColors.length]} />)}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
}
