/**
 * Chart components built on Recharts.
 * Each component accepts the raw data format returned by the EDA API
 * and renders a consistent, dark-mode-aware chart.
 */
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa', '#34d399', '#fb923c']

const tooltipStyle = {
  backgroundColor: 'var(--tooltip-bg, #1f2937)',
  border: 'none',
  borderRadius: '8px',
  color: '#f9fafb',
  fontSize: '12px',
}

/* ── Histogram for numeric columns ──────────────────────────────────── */
export function HistogramChart({ data, column }) {
  const chartData = data.bins.slice(0, -1).map((bin, i) => ({
    bin: bin.toFixed(1),
    count: data.counts[i],
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
        <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Bar chart for categorical columns ───────────────────────────────── */
export function CategoryBarChart({ data, column }) {
  const chartData = data.categories.map((cat, i) => ({
    name: String(cat).length > 12 ? String(cat).slice(0, 12) + '…' : String(cat),
    count: data.counts[i],
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} width={80} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Correlation heatmap (SVG-based, not Recharts) ───────────────────── */
export function CorrelationHeatmap({ correlations }) {
  const { columns, matrix } = correlations
  if (!columns || columns.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Not enough numeric columns for correlation analysis.</p>
  }

  const N = columns.length
  const CELL = Math.min(54, Math.floor(420 / N))
  const PAD = 80

  function colorForValue(v) {
    // Blue (negative) → white (zero) → indigo (positive)
    if (v >= 0) {
      const t = v
      const r = Math.round(99 + (71 - 99) * t)
      const g = Math.round(102 + (85 - 102) * t)
      const b = Math.round(241 + (234 - 241) * t)
      return `rgb(${r},${g},${b})`
    } else {
      const t = -v
      return `rgba(239,68,68,${t * 0.8})`
    }
  }

  return (
    <div className="overflow-x-auto">
      <svg
        width={PAD + N * CELL}
        height={PAD + N * CELL}
        className="mx-auto"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Column labels */}
        {columns.map((col, j) => (
          <text
            key={`col-${j}`}
            x={PAD + j * CELL + CELL / 2}
            y={PAD - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#9ca3af"
            transform={`rotate(-35, ${PAD + j * CELL + CELL / 2}, ${PAD - 6})`}
          >
            {col.length > 10 ? col.slice(0, 10) + '…' : col}
          </text>
        ))}
        {/* Row labels */}
        {columns.map((col, i) => (
          <text
            key={`row-${i}`}
            x={PAD - 6}
            y={PAD + i * CELL + CELL / 2 + 4}
            textAnchor="end"
            fontSize={10}
            fill="#9ca3af"
          >
            {col.length > 10 ? col.slice(0, 10) + '…' : col}
          </text>
        ))}
        {/* Cells */}
        {matrix.map((row, i) =>
          row.map((val, j) => (
            <g key={`${i}-${j}`}>
              <rect
                x={PAD + j * CELL}
                y={PAD + i * CELL}
                width={CELL}
                height={CELL}
                fill={colorForValue(val)}
                stroke="rgba(156,163,175,0.15)"
                strokeWidth={1}
                rx={2}
              />
              {N <= 8 && (
                <text
                  x={PAD + j * CELL + CELL / 2}
                  y={PAD + i * CELL + CELL / 2 + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill={Math.abs(val) > 0.5 ? '#fff' : '#6b7280'}
                >
                  {val.toFixed(2)}
                </text>
              )}
            </g>
          ))
        )}
      </svg>
    </div>
  )
}

/* ── Model comparison bar chart ──────────────────────────────────────── */
export function ModelComparisonChart({ models, metricKey, label }) {
  const data = models.map((m) => ({
    name: m.algorithm.replace(/_/g, ' '),
    value: Number((m.metrics[metricKey] ?? 0).toFixed(4)),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, label]} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
