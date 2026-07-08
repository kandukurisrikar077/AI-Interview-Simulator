import { useEffect, useRef } from 'react'
import apiClient from '../services/api'

export const useBrowserIntegrity = (interviewId: string | null) => {
  const lastLoggedRef = useRef<{ [key: string]: number }>({})

  useEffect(() => {
    if (!interviewId) return

    const logBreach = async (type: 'tab_switch' | 'window_blur', severity: 'low' | 'medium' | 'high') => {
      const now = Date.now()
      // Throttle pings of same type to once every 10 seconds to avoid DB spam
      const lastLogged = lastLoggedRef.current[type] || 0
      if (now - lastLogged < 10000) return
      
      lastLoggedRef.current[type] = now

      try {
        await apiClient.post(`/interviews/${interviewId}/malpractice`, {
          type,
          confidence: 1.0,
          severity
        })
        console.warn(`Browser Integrity warning logged: ${type}`)
      } catch (err) {
        console.error('Failed to log malpractice breach:', err)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logBreach('tab_switch', 'medium')
      }
    }

    const handleBlur = () => {
      logBreach('window_blur', 'low')
    }

    // Add listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      // Clean up
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [interviewId])
}
