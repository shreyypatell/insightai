import { useEffect, useState } from 'react'
import { FileText, Trash2, Lightbulb } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { datasetService, reportService } from '../services/dataService'
import { useToast } from '../context/ToastContext'
import { EmptyState, PageLoader, SectionTitle, Badge } from '../components/ui'

export default function Reports() {
  const { success, error: showError } = useToast()
  const [datasets, setDatasets] = useState([])
  const [reports, setReports]   = useState({}) // { datasetId: report }
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    datasetService.list().then(async (r) => {
      setDatasets(r.data)
      // Try to load a report for each dataset (ignore 404s)
      const reportMap = {}
      await Promise.all(
        r.data.map(async (d) => {
          try {
            const { data } = await reportService.get(d.id)
            reportMap[d.id] = data
          } catch { /* no report yet */ }
        })
      )
      setReports(reportMap)
    }).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (datasetId) => {
    if (!confirm('Delete this report? The dataset will remain.')) return
    try {
      await reportService.delete(datasetId)
      setReports((prev) => { const copy = { ...prev }; delete copy[datasetId]; return copy })
      success('Report deleted.')
    } catch { showError('Failed to delete report.') }
  }

  if (loading) return <PageLoader />

  const reportEntries = Object.entries(reports)

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <SectionTitle sub="View AI-generated insights and EDA summaries for each dataset.">Analysis Reports</SectionTitle>

      {reportEntries.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Run EDA on a dataset to generate your first report."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {reportEntries.map(([datasetId, report]) => {
              const dataset = datasets.find((d) => String(d.id) === String(datasetId))
              return (
                <motion.div
                  key={datasetId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="card flex flex-col gap-5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {dataset?.filename ?? `Dataset #${datasetId}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(report.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(datasetId)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Cleaning summary */}
                  {report.cleaning_summary && Object.keys(report.cleaning_summary).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Cleaning Summary
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge label={`${report.cleaning_summary.duplicates_removed} duplicates removed`} color="amber" />
                        <Badge label={`${report.cleaning_summary.rows_before} → ${report.cleaning_summary.rows_after} rows`} color="blue" />
                        <Badge label={`${report.cleaning_summary.columns_type_corrected?.length ?? 0} types corrected`} color="gray" />
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {report.insights && report.insights.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Lightbulb size={13} /> AI Insights
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {report.insights.map((insight, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-brand-500 mt-0.5 shrink-0">→</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
