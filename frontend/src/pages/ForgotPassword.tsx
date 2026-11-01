import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import apiClient from '../services/api'

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(val.trim())
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEmail(val)
    if (!val) {
      setEmailError(null)
    } else if (!validateEmail(val)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailError(null)

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setEmailError('Please enter your email address')
      return
    }

    if (!validateEmail(cleanEmail)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/auth/forgot-password', { email: cleanEmail })
      // Navigate to reset password page with email parameter
      navigate(`/reset-password?email=${encodeURIComponent(cleanEmail)}`)
    } catch (err: any) {
      console.error('Forgot password error:', err)
      const detail = err.response?.data?.detail
      if (!err.response) {
        setError('Cannot connect to authentication service. Please check your network.')
      } else {
        setError(typeof detail === 'string' ? detail : 'Failed to send password reset code. Please check your email and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#050816] text-white">
      {/* Background glow meshes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to Sign In */}
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Sign In
        </Link>

        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-gradient-purple">
            IntervueAI
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Recover your security login credentials.</p>
        </div>

        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Forgot Password</h2>
          <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
            Enter your registered email address and we'll send you a 6-digit verification code to reset your password.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-xs mb-5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={emailError || undefined}
              placeholder="name@company.com"
              icon={<Mail className="w-5 h-5 text-gray-500" />}
              disabled={loading}
              autoComplete="email"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              loading={loading}
              icon={<ArrowRight className="w-4.5 h-4.5" />}
              iconPosition="right"
            >
              Send Reset Code
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <span className="text-gray-500 text-xs">Remembered your password? </span>
            <Link to="/login" className="text-purple-400 hover:text-purple-300 text-xs font-semibold transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
