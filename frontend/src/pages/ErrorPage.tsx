import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Lock, ShieldAlert, FileQuestion, WifiOff, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

interface ErrorPageProps {
  code?: '401' | '403' | '404' | '500' | 'offline'
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ code: propCode }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const code = propCode || (searchParams.get('code') as any) || '404'

  const dashboardLink = user?.role === 'recruiter'
    ? '/company/dashboard'
    : user?.role === 'admin' || user?.role === 'SUPER_ADMIN'
      ? '/admin/dashboard'
      : '/dashboard'

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const errorDetails = {
    '401': {
      title: 'Session Unauthorized',
      desc: 'You do not have a valid authorization token. Please authenticate.',
      icon: <Lock className="w-12 h-12 text-red-500" />,
      action: (
        <Link to="/login">
          <Button>Sign In to Account</Button>
        </Link>
      )
    },
    '403': {
      title: 'Access Forbidden',
      desc: 'You do not possess the required credentials to access this administrative zone.',
      icon: <ShieldAlert className="w-12 h-12 text-yellow-500" />,
      action: (
        <Link to={dashboardLink}>
          <Button>Back to Dashboard</Button>
        </Link>
      )
    },
    '404': {
      title: 'Page Not Found',
      desc: 'The requested route page could not be located in our workspace.',
      icon: <FileQuestion className="w-12 h-12 text-purple-500" />,
      action: (
        <Link to={dashboardLink}>
          <Button>Return to Dashboard</Button>
        </Link>
      )
    },
    '500': {
      title: 'Server Error',
      desc: 'Our API servers are currently experiencing anomalies. Please check back shortly.',
      icon: <AlertCircle className="w-12 h-12 text-red-500" />,
      action: (
        <Button onClick={() => window.location.reload()} icon={<RefreshCw className="w-4 h-4" />}>
          Reload Workspace
        </Button>
      )
    },
    'offline': {
      title: 'Connection Disconnected',
      desc: 'Your local machine has lost internet connectivity. Check your network configurations.',
      icon: <WifiOff className="w-12 h-12 text-gray-500" />,
      action: (
        <Button 
          onClick={() => {
            if (navigator.onLine) {
              navigate(dashboardLink)
            } else {
              alert('Still offline. Please check connection.')
            }
          }} 
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Check Connectivity
        </Button>
      )
    }
  }

  const activeError = errorDetails[(isOnline ? code : 'offline') as keyof typeof errorDetails] || errorDetails['404']

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#050816] text-white">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-xl">
          {activeError.icon}
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">{activeError.title}</h1>
          <p className="text-gray-400 text-xs font-light leading-relaxed max-w-sm mx-auto">
            {activeError.desc}
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-4">
          {activeError.action}
          <Button variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
