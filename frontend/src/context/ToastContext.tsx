import React, { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextProps {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    
    // Auto remove after 4s
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }, [removeToast])

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast])
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast])
  const warning = useCallback((message: string) => addToast(message, 'warning'), [addToast])
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast])

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      
      {/* Floating stacked Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const icons = {
              success: <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />,
              error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
              warning: <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />,
              info: <Info className="w-5 h-5 text-blue-400 shrink-0" />
            }

            const styles = {
              success: 'border-green-500/20 bg-green-950/80 text-green-200 shadow-green-950/20',
              error: 'border-red-500/20 bg-red-950/80 text-red-200 shadow-red-950/20',
              warning: 'border-yellow-500/20 bg-yellow-950/80 text-yellow-200 shadow-yellow-950/20',
              info: 'border-blue-500/20 bg-blue-950/80 text-blue-200 shadow-blue-950/20'
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${styles[t.type]}`}
              >
                {icons[t.type]}
                <p className="text-xs font-light leading-relaxed flex-1 pt-0.5">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-gray-400 hover:text-white shrink-0 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider')
  }
  return context
}
