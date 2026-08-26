import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../services/api'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailError(null)
    setLoading(true)

    if (!email) {
      setEmailError('Please enter your email address')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      await apiClient.post('/auth/send-otp', { email })
      setStep('otp')
      setCooldown(60)
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.detail || 
        'Failed to send verification code. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification code')
      setLoading(false)
      return
    }

    try {
      const res = await apiClient.post('/auth/verify-otp', { email, otp })
      const { access_token, user } = res.data
      login(access_token, user, rememberMe)
      navigate('/dashboard')
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.detail || 
        'Invalid verification code. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (cooldown > 0) return
    setError(null)
    setLoading(true)
    try {
      await apiClient.post('/auth/send-otp', { email })
      setCooldown(60)
      setOtp('')
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.detail || 
        'Failed to resend code. Please try again.'
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
        {step === 'email' ? (
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Landing Page
          </Link>
        ) : (
          <button
            onClick={() => {
              setStep('email')
              setError(null)
              setOtp('')
            }}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Change Email Address
          </button>
        )}

        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-gradient-purple">
            IntervueAI
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Welcome back. Let's practice some interviews.</p>
        </div>

        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {step === 'email' ? 'Sign In' : 'Verify Identity'}
          </h2>

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

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSendCode}
                className="space-y-5"
              >
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  error={emailError || undefined}
                  placeholder="name@company.com"
                  icon={<Mail className="w-5 h-5 text-gray-500" />}
                  disabled={loading}
                />

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
                  Send Verification Code
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                <div className="text-xs text-gray-400 text-center leading-relaxed">
                  We've sent a 6-digit confirmation code to <br />
                  <strong className="text-purple-300">{email}</strong>. It expires in 5 minutes.
                </div>

                <Input
                  label="Verification Code"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  icon={<ShieldCheck className="w-5 h-5 text-gray-500" />}
                  disabled={loading}
                  className="text-center tracking-[0.5em] text-lg font-bold"
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  loading={loading}
                  icon={<ArrowRight className="w-4.5 h-4.5" />}
                  iconPosition="right"
                >
                  Verify & Log In
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={cooldown > 0 || loading}
                    className={`text-xs font-semibold select-none transition-colors ${
                      cooldown > 0 
                        ? 'text-gray-500 cursor-not-allowed' 
                        : 'text-purple-400 hover:text-purple-300 cursor-pointer'
                    }`}
                  >
                    {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <span className="text-gray-500 text-xs">Don't have an account? </span>
            <Link to="/signup" className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-all">
              Sign up free
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
