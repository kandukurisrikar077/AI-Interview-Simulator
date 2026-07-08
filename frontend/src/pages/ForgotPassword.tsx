import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import apiClient from '../services/api'

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Basic Validation
    if (!email) {
      setError('Please provide your email address')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      await apiClient.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'An error occurred. Please verify your email address and try again.')
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
        {/* Back to Landing */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Landing Page
        </Link>

        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-gradient-purple">
            IntervueAI
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Recover your security login credentials.</p>
        </div>

        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Reset Password</h2>

          {success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Email Dispatched!</h3>
                <p className="text-gray-400 text-xs font-light leading-relaxed">
                  We have sent instructions to reset your password to **{email}**. Please inspect your inbox.
                </p>
              </div>
              <div className="pt-4">
                <Link to="/login" className="w-full">
                  <Button variant="secondary" className="w-full" icon={<ArrowLeft className="w-4 h-4" />}>
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs mb-5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-5 h-5" />}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  loading={loading}
                >
                  Request Password Reset
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-gray-400 hover:text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
