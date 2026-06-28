import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

// ─── Axios clients ──────────────────────────────────────────────────────────
const openMeteo: AxiosInstance = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 10000,
})

const restCountries: AxiosInstance = axios.create({
  baseURL: 'https://restcountries.com/v3.1',
  timeout: 10000,
})

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Auth interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get('eioms_token') ||
    (typeof window !== 'undefined' ? localStorage.getItem('eioms_token') : null)
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      Cookies.remove('eioms_token')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('eioms_token')
        localStorage.removeItem('eioms_user')
        window.location.href = '/auth/login'
      }
    }
    const msg = (err.response?.data as any)?.message || err.message
    return Promise.reject(new Error(msg))
  }
)

// ────────────────────────────────────────────────────────────────────────────
// 1. AUTH API
// ────────────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password })
    return res.data
  },
  register: async (payload: Record<string, unknown>) => {
    const res = await api.post('/auth/register', payload)
    return res.data
  },
  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email })
    return res.data
  },
  getMe: async () => {
    const res = await api.get('/auth/me')
    return res.data.user
  },
}

// ────────────────────────────────────────────────────────────────────────────
// 2. USERS API
// ────────────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: async () => {
    const res = await api.get('/users')
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await api.get(`/users/${id}`)
    return res.data.data
  },
  create: async (payload: Record<string, unknown>) => {
    const res = await api.post('/users', payload)
    return res.data.data
  },
  update: async (id: number, payload: Record<string, unknown>) => {
    if (!id) throw new Error('ID is required')
    const res = await api.put(`/users/${id}`, payload)
    return res.data.data
  },
  delete: async (id: number) => {
    if (!id) throw new Error('ID is required')
    await api.delete(`/users/${id}`)
    return true
  },
}

// ────────────────────────────────────────────────────────────────────────────
// 3. INCIDENTS API
// ────────────────────────────────────────────────────────────────────────────
export const incidentsApi = {
  getAll: async () => {
    const res = await api.get('/incidents')
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await api.get(`/incidents/${id}`)
    return res.data.data
  },
  create: async (payload: Record<string, unknown>) => {
    const res = await api.post('/incidents', payload)
    return res.data.data
  },
  update: async (id: number, payload: Record<string, unknown>) => {
    if (!id) throw new Error('ID is required')
    const res = await api.put(`/incidents/${id}`, payload)
    return res.data.data
  },
  delete: async (id: number) => {
    if (!id) throw new Error('ID is required')
    await api.delete(`/incidents/${id}`)
    return true
  },
}

// ────────────────────────────────────────────────────────────────────────────
// 4. ASSETS API
// ────────────────────────────────────────────────────────────────────────────
export const assetsApi = {
  getAll: async () => {
    const res = await api.get('/assets')
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await api.get(`/assets/${id}`)
    return res.data.data
  },
  create: async (payload: Record<string, unknown>) => {
    const res = await api.post('/assets', payload)
    return res.data.data
  },
  update: async (id: number, payload: Record<string, unknown>) => {
    if (!id) throw new Error('ID is required')
    const res = await api.put(`/assets/${id}`, payload)
    return res.data.data
  },
  delete: async (id: number) => {
    if (!id) throw new Error('ID is required')
    await api.delete(`/assets/${id}`)
    return true
  },
}

// ────────────────────────────────────────────────────────────────────────────
// 5. SERVERS API
// ────────────────────────────────────────────────────────────────────────────
export const serversApi = {
  getAll: async () => {
    const res = await api.get('/servers')
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await api.get(`/servers/${id}`)
    return res.data.data
  },
  create: async (payload: Record<string, unknown>) => {
    const res = await api.post('/servers', payload)
    return res.data.data
  },
  update: async (id: number, payload: Record<string, unknown>) => {
    if (!id) throw new Error('ID is required')
    const res = await api.put(`/servers/${id}`, payload)
    return res.data.data
  },
  delete: async (id: number) => {
    if (!id) throw new Error('ID is required')
    await api.delete(`/servers/${id}`)
    return true
  },
}

// ────────────────────────────────────────────────────────────────────────────
// 6. MONITORING API — Open-Meteo real weather data
// ────────────────────────────────────────────────────────────────────────────
const DC_LOCATIONS = [
  { name: 'us-east-1 (Ashburn)', lat: 39.0438, lon: -77.4874 },
  { name: 'eu-west-1 (Dublin)', lat: 53.3498, lon: -6.2603 },
  { name: 'ap-south-1 (Mumbai)', lat: 19.0760, lon: 72.8777 },
  { name: 'us-west-2 (Portland)', lat: 45.5152, lon: -122.6784 },
  { name: 'ap-east-1 (Tokyo)', lat: 35.6762, lon: 139.6503 },
  { name: 'eu-central-1 (Frankfurt)', lat: 50.1109, lon: 8.6821 },
]

export const monitoringApi = {
  getWeatherForDCs: async () => {
    const results = await Promise.allSettled(
      DC_LOCATIONS.map(dc =>
        openMeteo.get('/forecast', {
          params: {
            latitude: dc.lat,
            longitude: dc.lon,
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
            hourly: 'temperature_2m,relative_humidity_2m',
            forecast_days: 1,
          },
        }).then(r => ({ ...dc, weather: r.data }))
      )
    )
    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value)
  },
  getCurrentWeather: async (lat = 40.4093, lon = 49.8671) => {
    const res = await openMeteo.get('/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature,precipitation',
        hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
        forecast_days: 2,
        timezone: 'auto',
      },
    })
    return res.data
  },
}

// ────────────────────────────────────────────────────────────────────────────
// 7. REPORTS / SUMMARY
// ────────────────────────────────────────────────────────────────────────────
export const reportsApi = {
  getSummary: async () => {
    const res = await api.get('/reports/summary')
    return res.data.data
  },
}

// ────────────────────────────────────────────────────────────────────────────
// 8. SETTINGS API
// ────────────────────────────────────────────────────────────────────────────
export const settingsApi = {
  getSettings: async () => {
    const res = await api.get('/settings')
    return res.data.data
  },
  updatePreferences: async (payload: Record<string, unknown>) => {
    const res = await api.put('/settings', { type: 'preferences', payload })
    return res.data
  },
  updateSystem: async (payload: Record<string, unknown>) => {
    const res = await api.put('/settings', { type: 'system', payload })
    return res.data
  },
  // API Keys
  createApiKey: async (name: string) => {
    const res = await api.post('/api-keys', { name })
    return res.data.data
  },
  deleteApiKey: async (id: number) => {
    await api.delete(`/api-keys/${id}`)
    return true
  }
}

export default api

