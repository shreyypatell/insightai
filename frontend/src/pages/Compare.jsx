import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { datasetService, modelService } from '../services/dataService'
import { ModelComparisonChart } from '../components/Charts'
import { EmptyState, PageLoader, SectionTitle, Badge } from '../components/ui'

export default function Compare() {
  const [datasets, setDatasets] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [models, setModels]   = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingDs, setLoadingDs] = useState(true)

  useEffect(() => {
    datasetService.list()
      .then((r) => setDatasets(r.data))
      .finally(() => setLoadingDs(false))
  }, [])

  useEffect(() => {
    if (!selectedId) { setModels([]); return }
    setLoading(true)
    modelService.getForDataset(selectedId)
      .then((r) => setModels(r.data))
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }, [selectedId])

  const isClassification = models[0]?.problem_type === 'classification'
  const primaryMetric    = isClassification ? 'f1_score' : 'r2_score'
  const bestModel = models.length
    ? models.reduce((a, b) =>
        (b.metrics[primaryMetric] ?? 0) > (a.metrics[primaryMetric] ?? 0) ? b : a
      )
    : null

  if (loadingDs) return <PageLoader />

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <SectionTitle sub="Select a dataset to compare all models trained on it.">Model Comparison</SectionTitle>

      <select className="input max-w-xs" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
        <option value="">Select a dataset…</option>
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>{d.filename}</option>
        ))}
      </select>

      {loading && <PageLoader message="Loading models…" />}

      {!loading && selectedId && models.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No models trained yet"
          description="Go to the Train page to train your first model on this dataset."
        />
      )}

      {!loading && models.length > 0 && (
        <>
          {/* Best model banner */}
          {bestModel && (
            <div className="card border-2 border-brand-400 dark:border-brand-600 flex items-center gap-4 flex-wrap">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Best performing model</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                  {bestModel.algorithm.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-brand-600 font-semibold">
                  {primaryMetric.replace(/_/g, ' ').toUpperCase()}: {bestModel.metrics[primaryMetric]?.toFixed(4)}
                </p>
              </div>
            </div>
          )}

          {/* Comparison chart */}
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
              {isClassification ? 'F1 Score Comparison' : 'R² Score Comparison'}
            </p>
            <ModelComparisonChart
              models={models}
              metricKey={primaryMetric}
              label={isClassification ? 'F1 Score' : 'R² Score'}
            />
          </div>

          {/* Results table */}
          <div className="card overflow-x-auto">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">All Metrics</p>
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left py-2 pr-4">Algorithm</th>
                  {isClassification
                    ? ['Accuracy','Precision','Recall','F1 Score'].map((h) => <th key={h} className="text-left py-2 pr-4">{h}</th>)
                    : ['R² Score','MAE','RMSE'].map((h) => <th key={h} className="text-left py-2 pr-4">{h}</th>)
                  }
                  <th className="text-left py-2">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {models.map((m) => (
                  <tr key={m.id} className={m.id === bestModel?.id ? 'bg-brand-50 dark:bg-brand-900/10' : ''}>
                    <td className="py-3 pr-4 font-medium text-gray-800 dark:text-gray-200 capitalize">
                      {m.algorithm.replace(/_/g, ' ')}
                      {m.id === bestModel?.id && <Badge label="Best" color="brand" />}
                    </td>
                    {isClassification ? (
                      <>
                        <td className="py-3 pr-4">{m.metrics.accuracy?.toFixed(4)}</td>
                        <td className="py-3 pr-4">{m.metrics.precision?.toFixed(4)}</td>
                        <td className="py-3 pr-4">{m.metrics.recall?.toFixed(4)}</td>
                        <td className="py-3 pr-4 font-semibold text-brand-600">{m.metrics.f1_score?.toFixed(4)}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 pr-4 font-semibold text-brand-600">{m.metrics.r2_score?.toFixed(4)}</td>
                        <td className="py-3 pr-4">{m.metrics.mae?.toFixed(4)}</td>
                        <td className="py-3 pr-4">{m.metrics.rmse?.toFixed(4)}</td>
                      </>
                    )}
                    <td className="py-3">
                      <a
                        href={modelService.downloadUrl(m.id)}
                        className="btn-ghost text-xs py-1"
                        download
                      >
                        .pkl
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
