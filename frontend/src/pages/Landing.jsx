import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart2, Upload, BrainCircuit, Sparkles, ArrowRight } from 'lucide-react'

const features = [
  { icon: Upload,      title: 'Upload Any Dataset',      desc: 'CSV and Excel files. Automatic metadata extraction on upload.' },
  { icon: BarChart2,   title: 'Instant EDA',             desc: 'Distributions, correlations, and heatmaps generated in seconds.' },
  { icon: BrainCircuit,title: 'Train & Compare Models',  desc: 'Logistic Regression, Random Forest, XGBoost — side-by-side metrics.' },
  { icon: Sparkles,    title: 'AI-Generated Insights',   desc: 'Plain-English data analysis without any paid API.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl text-brand-600">
          <BarChart2 size={24} /> InsightAI
        </div>
        <div className="flex gap-3">
          <Link to="/login"    className="btn-ghost text-sm">Login</Link>
          <Link to="/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
            Open-Source Portfolio Project
          </span>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
            Turn your data<br />
            <span className="text-brand-600">into insights.</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-8">
            Upload a dataset, explore it visually, train and compare machine learning models,
            and get plain-English analytics — all in one platform.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors text-base"
          >
            Start for free <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 w-fit mb-3">
              <Icon size={20} />
            </div>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  )
}
