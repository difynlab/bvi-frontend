export function resolveReportPreviewImageUrl(raw) {
  if (raw == null || raw === '') return ''
  const s = String(raw).trim()
  if (!s) return ''
  if (s.startsWith('blob:') || s.startsWith('data:')) return s
  if (/^https?:\/\//i.test(s)) return s
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const apiBaseURL = baseURL.replace(/\/api\/?$/, '').replace(/\/$/, '')
  if (s.startsWith('/')) return `${apiBaseURL}${s}`
  if (s.startsWith('storage/')) return `${apiBaseURL}/${s}`
  if (s.includes('/')) return `${apiBaseURL}/storage/${s.replace(/^\//, '')}`
  return `${apiBaseURL}/storage/reports/${s}`
}
