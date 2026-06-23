/**
 * Thin wrapper functions around the API client.
 * Components import these instead of calling axios directly,
 * which makes them easy to mock in tests.
 */
import api from './api'

// ── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
}

// ── Datasets ─────────────────────────────────────────────────────────────────
export const datasetService = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/datasets/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: (search = '') => api.get('/api/datasets', { params: search ? { search } : {} }),
  get: (id) => api.get(`/api/datasets/${id}`),
  delete: (id) => api.delete(`/api/datasets/${id}`),
}

// ── Cleaning ─────────────────────────────────────────────────────────────────
export const cleaningService = {
  clean: (datasetId) => api.post(`/api/clean/${datasetId}`),
}

// ── EDA ───────────────────────────────────────────────────────────────────────
export const edaService = {
  run: (datasetId, targetColumn) =>
    api.get(`/api/eda/${datasetId}`, {
      params: targetColumn ? { target_column: targetColumn } : {},
    }),
}

// ── Models ────────────────────────────────────────────────────────────────────
export const modelService = {
  train: (payload) => api.post('/api/models/train', payload),
  getForDataset: (datasetId) => api.get(`/api/models/dataset/${datasetId}`),
  getResult: (modelId) => api.get(`/api/models/${modelId}/results`),
  downloadUrl: (modelId) => `${import.meta.env.VITE_API_BASE_URL || ''}/api/models/${modelId}/download`,
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportService = {
  get: (datasetId) => api.get(`/api/reports/${datasetId}`),
  delete: (datasetId) => api.delete(`/api/reports/${datasetId}`),
}
