import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Wand2, BarChart2, Lightbulb, ArrowLeft, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { datasetService, cleaningService, edaService } from '../services/dataService'
import { useToast } from '../context/ToastContext'
import { HistogramChart, CategoryBarChart, CorrelationHeatmap } from '../components/Charts'
import { PageLoader, Badge, SectionTitle, Spinner } from '../components/ui'

export default function DatasetDetail() {
  const { id } = useParams()
  const { success, error: showError } = useToast()

  const [dataset, setDataset]   = useState(null)
  const [cleaning, setCleaning] = useState(null)
  const [eda, setEda]           = useState(null)
  const [target, setTarget]     = useState('')
  const [loadingPage, setLoadingPage]       = useState(true)
  const [loadingClean, setLoadingClean]     = useState(false)
  const [loadingEda, setLoadingEda]         = useState(false)

  useEffect(() => {
    datasetService.get(id)
      .then((r) => { setDataset(r.data); setLoadingPage(false) })
      .catch(() => { showError('Dataset not found.'); setLoadingPage(false) })
  }, [id])

  const runCleaning = async () => {
    setLoadingClean(true)
    try {
      const { data } = await cleaningService.clean(id)
      setCleaning(data)
      success('Data cleaning complete.')
    } catch { showError('Cleaning failed.') }
    finally { setLoadingClean(false) }
  }

  const runEda = async () => {
    setLoadingEda(true)
    try {
      const { data } = await edaService.run(id, target || undefined)
      setEda(data)
      success('EDA complete.')
    } catch { showError('EDA failed.') }
    finally { setLoadingEda(false) }
  }

  if (loadingPage) return <PageLoader message="Loading dataset…" />
  if (!dataset)    return <p className="text-red-500">Dataset not found.</p>

  const dtypeColor = (dtype) => {
    if (dtype.includes('int') || dtype.includes('float')) return 'blue'
    if (dtype.includes('object') || dtype.includes('str'))  return 'amber'
    return 'gray'
  }

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      {/* Back */}
      <Link to="/datasets" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 w-fit">
        <ArrowLeft size={15} /> Back to datasets
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{dataset.filename}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {dataset.n_rows.toLocaleString()} rows · {dataset.n_columns} columns
          </p>
        </div>
        <Link to={`/train?dataset=${id}`} className="btn-primary">
          Train a model →
        </Link>
      </div>

      {/* Columns overview */}
      <div className="card">
        <SectionTitle>Column Overview</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="text-left py-2 pr-4 font-medium">Column</th>
                <th className="text-left py-2 pr-4 font-medium">Type</th>
                <th className="text-left py-2 font-medium">Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {dataset.columns.map((col) => (
                <tr key={col}>
                  <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-200">{col}</td>
                  <td className="py-2 pr-4">
                    <Badge label={dataset.dtypes[col]} color={dtypeColor(dataset.dtypes[col])} />
                  </td>
                  <td className="py-2 text-gray-500">
                    {dataset.missing_values[col] > 0
                      ? <span className="text-amber-500">{dataset.missing_values[col]}</span>
                      : <span className="text-emerald-500">0</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cleaning */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <SectionTitle sub="Detect duplicates, fix types, fill missing values.">Data Cleaning</SectionTitle>
          <button onClick={runCleaning} disabled={loadingClean} className="btn-primary text-sm">
            {loadingClean ? <Spinner size={15} /> : <><Wand2 size={15} /> Run Cleaning</>}
          </button>
        </div>

        {cleaning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40">
              <p className="text-xs text-gray-400 mb-1">Duplicates Removed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{cleaning.duplicates_removed}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40">
              <p className="text-xs text-gray-400 mb-1">Rows</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {cleaning.rows_before} → {cleaning.rows_after}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40">
              <p className="text-xs text-gray-400 mb-1">Types Corrected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {cleaning.columns_type_corrected.length}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* EDA */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <SectionTitle sub="Distributions, correlations, and target variable analysis.">
            Exploratory Data Analysis
          </SectionTitle>
          <div className="flex items-center gap-2">
            <select
              className="input w-44 text-sm"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">No target</option>
              {dataset.columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <button onClick={runEda} disabled={loadingEda} className="btn-primary text-sm">
              {loadingEda ? <Spinner size={15} /> : <><BarChart2 size={15} /> Run EDA</>}
            </button>
          </div>
        </div>

        {eda && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
            {/* Summary Stats */}
            {Object.keys(eda.summary_statistics).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Summary Statistics</p>
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-400 font-medium">Stat</th>
                        {Object.keys(eda.summary_statistics).map((col) => (
                          <th key={col} className="text-left px-3 py-2 text-gray-400 font-medium">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                      {['count','mean','std','min','25%','50%','75%','max'].map((stat) => (
                        <tr key={stat}>
                          <td className="px-3 py-2 font-medium text-gray-500">{stat}</td>
                          {Object.values(eda.summary_statistics).map((stats, i) => (
                            <td key={i} className="px-3 py-2 text-gray-700 dark:text-gray-300">
                              {stats[stat] !== undefined ? stats[stat] : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Column distributions */}
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Column Distributions</p>
              <div className="grid sm:grid-cols-2 gap-6">
                {Object.entries(eda.column_distributions).map(([col, data]) => (
                  <div key={col} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">{col}</p>
                    {data.type === 'numeric'
                      ? <HistogramChart data={data} column={col} />
                      : <CategoryBarChart data={data} column={col} />
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Correlation heatmap */}
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Correlation Heatmap</p>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <CorrelationHeatmap correlations={eda.correlations} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
