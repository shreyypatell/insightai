import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, BrainCircuit, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { datasetService, modelService } from '../services/dataService'
import { StatCard, Skeleton, EmptyState } from '../components/ui'

function StatSkeleton() {
  return (
    <div className="card flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    datasetService.list()
      .then((r) => setDatasets(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalRows = datasets.reduce((s, d) => s + d.n_rows, 0)

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here's a snapshot of your workspace.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Datasets" value={datasets.length} icon={Database} color="brand" />
            <StatCard label="Total Rows" value={totalRows.toLocaleString()} icon={TrendingUp} color="emerald" />
            <StatCard
              label="Columns Avg"
              value={datasets.length ? Math.round(datasets.reduce((s, d) => s + d.n_columns, 0) / datasets.length) : '—'}
              icon={FileText}
              color="amber"
            />
            <StatCard label="Models Trained" value="—" icon={BrainCircuit} color="rose" sub="Train on a dataset" />
          </>
        )}
      </div>

      {/* Recent datasets */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Recent Datasets</h2>
          <Link to="/datasets" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : datasets.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No datasets yet"
            description="Upload a CSV or Excel file to get started."
            action={
              <Link to="/datasets" className="btn-primary mt-2">Upload a dataset</Link>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {datasets.slice(0, 5).map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between py-3 gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{d.filename}</p>
                  <p className="text-xs text-gray-400">{d.n_rows.toLocaleString()} rows · {d.n_columns} cols</p>
                </div>
                <Link to={`/datasets/${d.id}`} className="btn-ghost text-xs py-1 px-3">
                  Open
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/datasets',  icon: Database,     label: 'Upload Dataset',   desc: 'CSV or Excel'             },
          { to: '/train',     icon: BrainCircuit, label: 'Train a Model',    desc: 'Classification/Regression' },
          { to: '/compare',   icon: TrendingUp,   label: 'Compare Models',   desc: 'See who performs best'    },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="card hover:shadow-md transition-shadow flex items-center gap-4 group">
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
              <Icon size={22} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
