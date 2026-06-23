import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Spinner } from './ui'

export default function UploadZone({ onUpload, loading }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      alert('Please upload a CSV or Excel file.')
      return
    }
    onUpload(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-colors
        ${dragging
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {loading ? (
        <>
          <Spinner size={36} />
          <p className="text-sm text-gray-500 dark:text-gray-400">Uploading and analysing…</p>
        </>
      ) : (
        <>
          <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-500">
            <UploadCloud size={32} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Drag & drop your file here
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Supports CSV, XLSX — click to browse
            </p>
          </div>
        </>
      )}
    </div>
  )
}
