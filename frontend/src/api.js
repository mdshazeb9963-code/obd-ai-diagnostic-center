import axios from 'axios'

const staticPreview = import.meta.env.VITE_STATIC_PREVIEW === 'true'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30_000,
  withCredentials: true,
})

if (staticPreview) {
  http.defaults.adapter = async (config) => {
    const { demoAdapter } = await import('./demoApi.js')
    return demoAdapter(config)
  }
}

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('obd.accessToken')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthRoute = /\/auth\/(login|register|refresh|logout)/.test(original?.url || '')
    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true
      try {
        const refreshed = await http.post('/auth/refresh', {}, { _skipRefresh: true })
        sessionStorage.setItem('obd.accessToken', refreshed.data.accessToken)
        original.headers.Authorization = 'Bearer ' + refreshed.data.accessToken
        return http(original)
      } catch {
        sessionStorage.removeItem('obd.accessToken')
        window.dispatchEvent(new CustomEvent('obd:session-expired'))
      }
    }
    return Promise.reject(error)
  },
)

export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.response?.data?.detail || error?.message || fallback
