import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, Briefcase } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import apiClient from '../../services/api'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Button } from '../../components/ui/Button'

export const RecruiterLogin: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEmail(val)
    if (!val) {
      setEmailError(null)
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(val)) {
        setEmailError('Please enter a valid email address')
      } else {
        setEmailError(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Basic Validation
    if (!email || !password) {
      setError('Please fill in all fields')
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
      const res = await apiClient.post('/auth/login', { email, password, role: 'recruiter' })
      const { access_token, user } = res.data
      login(access_token, user, rememberMe)
      navigate('/company/dashboard')
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.detail || 
        'Invalid email/password or unauthorized role access.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#050816] text-white">
      {/* Background glow animations */}
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
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-gradient-purple flex items-center justify-center gap-2">
            <Briefcase className="w-8 h-8 text-purple-500" /> IntervueAI
          </Link>
          <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20 mt-2.5 inline-block">
            Recruiter Sign In Portal
          </span>
        </div>

        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Recruiter Login</h2>

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
              label="Work Email Address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={emailError || undefined}
              placeholder="name@company.com"
              icon={<Mail className="w-5 h-5 text-gray-500" />}
              disabled={loading}
            />

            <div className="space-y-1.5">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5 text-gray-500" />}
                disabled={loading}
                aria-label="Password"
              />
            </div>

            <div className="flex items-center justify-between pb-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-[#050816] focus:ring-offset-2 transition-all cursor-pointer accent-purple-500"
                />
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors select-none">
                  Remember me
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              loading={loading}
              icon={<ArrowRight className="w-4.5 h-4.5" />}
              iconPosition="right"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <span>New to recruiter console? </span>
            <Link to="/recruiter/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-all">
              Create a workspace
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
