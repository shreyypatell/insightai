import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { BrainCircuit, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { datasetService, modelService } from '../services/dataService'
import { useToast } from '../context/ToastContext'
import { SectionTitle, Spinner, PageLoader } from '../components/ui'

const CLASSIFICATION_ALGOS = [
  { id: 'logistic_regression', label: 'Logistic Regression' },
  { id: 'random_forest',       label: 'Random Forest'       },
  { id: 'xgboost',             label: 'XGBoost'             },
]

const REGRESSION_ALGOS = [
  { id: 'linear_regression', label: 'Linear Regression' },
  { id: 'random_forest',     label: 'Random Forest'     },
  { id: 'xgboost',           label: 'XGBoost'           },
]

function MetricPill({ label, value }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20">
      <span className="text-xs text-gray-400 mb-1">{label}</span>
      <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{value}</span>
    </div>
  )
}

export default function Train() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [datasets, setDatasets] = useState([])
  const [loadingDatasets, setLoadingDatasets] = useState(true)

  // Form state
 // Form state
  const [datasetId, setDatasetId]       = useState(searchParams.get('dataset') || '')
  const [datasetDetail, setDatasetDetail] = useState(null)   // full dataset incl. column names
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [targetColumn, setTargetColumn] = useState('')
  const [problemType, setProblemType]   = useState('classification')
  const [algorithms, setAlgorithms]     = useState(['logistic_regression', 'random_forest', 'xgboost'])

  const [results, setResults]     = useState(null)
  const [training, setTraining]   = useState(false)

  const algoOptions = problemType === 'classification' ? CLASSIFICATION_ALGOS : REGRESSION_ALGOS

  useEffect(() => {
    datasetService.list()
      .then((r) => setDatasets(r.data))
      .finally(() => setLoadingDatasets(false))
  }, [])

  useEffect(() => {
    if (!datasetId) { setDatasetDetail(null); return }
    setLoadingDetail(true)
    datasetService.get(datasetId)
      .then((r) => setDatasetDetail(r.data))
      .catch(() => { setDatasetDetail(null); showError('Could not load dataset columns.') })
      .finally(() => setLoadingDetail(false))
  }, [datasetId])

  // Reset algo selection when problem type changes
  useEffect(() => {
    setAlgorithms(algoOptions.map((a) => a.id))
  }, [problemType])

  const toggleAlgo = (id) => {
    setAlgorithms((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleTrain = async () => {
    if (!datasetId || !targetColumn || algorithms.length === 0) {
      showError('Please fill all fields and select at least one algorithm.')
      return
    }
    setTraining(true)
    setResults(null)
    try {
      const { data } = await modelService.train({
        dataset_id: Number(datasetId),
        target_column: targetColumn,
        problem_type: problemType,
        algorithms,
      })
      setResults(data)
      success('Training complete! Check the results below.')
    } catch (err) {
      showError(err?.response?.data?.detail || 'Training failed. Check your target column and dataset.')
    } finally {
      setTraining(false)
    }
  }

  if (loadingDatasets) return <PageLoader message="Loading datasets…" />

  const primaryMetric = problemType === 'classification' ? 'f1_score' : 'r2_score'
  const metricLabel   = problemType === 'classification' ? 'F1 Score' : 'R² Score'

  return (
    <div className="flex flex-col gap-8 animate-slide-up max-w-3xl">
      <SectionTitle sub="Select a dataset, configure the problem, and train multiple models at once.">
        Train Models
      </SectionTitle>

      <div className="card flex flex-col gap-6">
        {/* Dataset */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dataset</label>
          <select className="input" value={datasetId} onChange={(e) => { setDatasetId(e.target.value); setTargetColumn('') }}>
            <option value="">Select a dataset…</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>{d.filename} ({d.n_rows} rows)</option>
            ))}
          </select>
        </div>

       {/* Target column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Column</label>
          <select className="input" value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)} disabled={!datasetDetail || loadingDetail}>
            <option value="">{loadingDetail ? 'Loading columns…' : 'Select target column…'}</option>
            {datasetDetail?.columns?.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {/* Problem type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Problem Type</label>
          <div className="flex gap-3">
            {['classification', 'regression'].map((type) => (
              <button
                key={type}
                onClick={() => setProblemType(type)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors capitalize
                  ${problemType === type
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Algorithms to Train</label>
          <div className="flex flex-col gap-2">
            {algoOptions.map(({ id, label }) => (
              <label key={id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={algorithms.includes(id)}
                  onChange={() => toggleAlgo(id)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-brand-600 transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleTrain}
          disabled={training}
          className="btn-primary justify-center py-3 text-base"
        >
          {training
            ? <><Spinner size={18} /> Training models…</>
            : <><Play size={18} /> Train {algorithms.length} Model{algorithms.length !== 1 ? 's' : ''}</>
          }
        </button>
      </div>

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <SectionTitle sub={`Best model: ${results.best_algorithm.replace(/_/g, ' ')}`}>
            Training Results
          </SectionTitle>

          {results.results.map((model) => (
            <div
              key={model.id}
              className={`card flex flex-col gap-4 border-2 transition-colors
                ${model.id === results.best_model_id
                  ? 'border-brand-400 dark:border-brand-600'
                  : 'border-gray-100 dark:border-gray-700'
                }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={18} className="text-brand-600" />
                  <span className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
                    {model.algorithm.replace(/_/g, ' ')}
                  </span>
                  {model.id === results.best_model_id && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                      Best
                    </span>
                  )}
                </div>
                <a
                  href={modelService.downloadUrl(model.id)}
                  className="btn-ghost text-xs py-1"
                  download
                >
                  Download .pkl
                </a>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Object.entries(model.metrics)
                  .filter(([k]) => k !== 'confusion_matrix')
                  .map(([key, val]) => (
                    <MetricPill
                      key={key}
                      label={key.replace(/_/g, ' ').toUpperCase()}
                      value={typeof val === 'number' ? val.toFixed(4) : val}
                    />
                  ))
                }
              </div>

              {/* Confusion matrix */}
              {model.metrics.confusion_matrix && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Confusion Matrix</p>
                  <div className="inline-flex flex-col gap-1">
                    {model.metrics.confusion_matrix.map((row, i) => (
                      <div key={i} className="flex gap-1">
                        {row.map((cell, j) => (
                          <div key={j} className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold
                            ${i === j ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                            {cell}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* AI Insights */}
          {results.insights.length > 0 && (
            <div className="card border-l-4 border-brand-500">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">💡 AI Insights</p>
              <ul className="flex flex-col gap-2">
                {results.insights.map((insight, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-brand-500 mt-0.5">→</span> {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
