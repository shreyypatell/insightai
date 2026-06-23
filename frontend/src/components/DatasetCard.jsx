import { Link } from 'react-router-dom'
import { Trash2, FileText, Calendar, Rows } from 'lucide-react'
import { motion } from 'framer-motion'

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function DatasetCard({ dataset, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="card group flex flex-col gap-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate" title={dataset.filename}>
              {dataset.filename}
            </p>
          </div>
        </div>

        <button
          onClick={() => onDelete(dataset.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete dataset"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Rows size={13} />
          <span>{dataset.n_rows.toLocaleString()} rows</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText size={13} />
          <span>{dataset.n_columns} columns</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <Calendar size={13} />
          <span>{fmt(dataset.uploaded_at)}</span>
        </div>
      </div>

      {/* Action */}
      <Link
        to={`/datasets/${dataset.id}`}
        className="btn-primary text-center justify-center text-xs py-1.5"
      >
        Analyse →
      </Link>
    </motion.div>
  )
}
