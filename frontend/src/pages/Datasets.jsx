import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Database, Search } from 'lucide-react'
import { datasetService } from '../services/dataService'
import { useToast } from '../context/ToastContext'
import DatasetCard from '../components/DatasetCard'
import UploadZone from '../components/UploadZone'
import { EmptyState, Skeleton, SectionTitle } from '../components/ui'

function CardSkeleton() {
  return <div className="card"><Skeleton className="h-32 rounded-xl" /></div>
}

export default function Datasets() {
  const { success, error } = useToast()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchDatasets = useCallback(async () => {
    try {
      const { data } = await datasetService.list(search)
      setDatasets(data)
    } catch {
      error('Failed to load datasets.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(fetchDatasets, 300) // debounce search
    return () => clearTimeout(timer)
  }, [fetchDatasets])

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      const { data } = await datasetService.upload(file)
      setDatasets((prev) => [data, ...prev])
      success(`"${data.filename}" uploaded successfully.`)
    } catch (err) {
      error(err?.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this dataset and all associated reports and models?')) return
    try {
      await datasetService.delete(id)
      setDatasets((prev) => prev.filter((d) => d.id !== id))
      success('Dataset deleted.')
    } catch {
      error('Failed to delete dataset.')
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <SectionTitle sub="Upload, search, and manage your datasets.">Datasets</SectionTitle>

      {/* Upload zone */}
      <UploadZone onUpload={handleUpload} loading={uploading} />

      {/* Search */}
      {datasets.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search datasets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : datasets.length === 0 ? (
        <EmptyState
          icon={Database}
          title={search ? 'No datasets match your search' : 'No datasets yet'}
          description={search ? 'Try a different keyword.' : 'Upload a CSV or Excel file above.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {datasets.map((d) => (
              <DatasetCard key={d.id} dataset={d} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
