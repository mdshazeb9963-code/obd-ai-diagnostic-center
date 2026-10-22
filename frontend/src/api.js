import axios from 'axios'

const staticPreview = import.meta.env.VITE_STATIC_PREVIEW === 'true'
const translationApiUrl = (import.meta.env.VITE_TRANSLATION_API_URL || '').trim().replace(/\/+$/, '')

export async function translateSpeech(payload, signal) {
  if (translationApiUrl) {
    const apiBase = translationApiUrl.endsWith('/api/v1') ? translationApiUrl : `${translationApiUrl}/api/v1`
    let response
    try {
      response = await fetch(`${apiBase}/ai/speech-translation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal,
      })
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      throw new Error('The online translation service could not be reached. Check the API connection and try again.')
    }
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Online translation could not be completed. Try again later.')
    if (typeof data.translation !== 'string' || !data.translation.trim()) throw new Error('The translation service returned no speech text.')
    return data.translation.trim()
  }

  if (staticPreview) throw new Error('Online translation is not connected yet. Choose English, or connect the translation API to this website.')
  const { data } = await http.post('/ai/speech-translation', payload, { signal })
  if (typeof data?.translation !== 'string' || !data.translation.trim()) throw new Error('The translation service returned no speech text.')
  return data.translation.trim()
}

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
