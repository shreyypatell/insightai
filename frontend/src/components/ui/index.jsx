/**
 * Small, reusable UI building-blocks used across every page.
 * Keeping them in one file avoids over-engineering for a portfolio project.
 */
import { motion } from 'framer-motion'

/* ── Loading spinner ─────────────────────────────────────────────────── */
export function Spinner({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin text-brand-600 ${className}`}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        strokeDasharray="31.416" strokeDashoffset="10" />
    </svg>
  )
}

/* ── Skeleton shimmer block ──────────────────────────────────────────── */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

/* ── Full-page loading overlay ───────────────────────────────────────── */
export function PageLoader({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500 dark:text-gray-400">
      <Spinner size={36} />
      <p className="text-sm">{message}</p>
    </div>
  )
}

/* ── Empty state placeholder ─────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center gap-3"
    >
      {Icon && (
        <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
          <Icon size={32} />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>}
      {action}
    </motion.div>
  )
}

/* ── KPI / stat card ─────────────────────────────────────────────────── */
export function StatCard({ label, value, icon: Icon, color = 'brand', sub }) {
  const colorMap = {
    brand:   'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    rose:    'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  }
  return (
    <div className="card flex items-center gap-4">
      {Icon && (
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Section heading ─────────────────────────────────────────────────── */
export function SectionTitle({ children, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{children}</h2>
      {sub && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

/* ── Badge ───────────────────────────────────────────────────────────── */
export function Badge({ label, color = 'gray' }) {
  const map = {
    gray:    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    green:   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    blue:    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    amber:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    rose:    'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    brand:   'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[color]}`}>
      {label}
    </span>
  )
}
