import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request Interceptor: Automatically inject JWT token from localStorage/sessionStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Catch auth and server errors, dispatch events for global handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Token expired or invalid — force logout
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        window.dispatchEvent(new Event('auth-unauthorized'))
        window.location.href = '/unauthorized'
      } else if (error.response.status === 403) {
        // Forbidden — dispatch event for toast notification
        window.dispatchEvent(
          new CustomEvent('auth-forbidden', {
            detail: error.response.data?.detail || 'Access forbidden',
          })
        )
      }
    } else if (error.code === 'ECONNABORTED' || !error.response) {
      // Network error or timeout
      window.dispatchEvent(new Event('network-error'))
    }
    return Promise.reject(error)
  }
)

export default apiClient
