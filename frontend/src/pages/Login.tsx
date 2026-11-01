import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../services/api'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Button } from '../components/ui/Button'
import { Checkbox } from '../components/ui/Checkbox'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  // Mode: 'password' (Default normal login) or 'otp' (Alternative verification code login)
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password')
  
  // OTP flow sub-step: 'email' -> 'code'
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email')

  // Form Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  // Status & Feedback States
  const [error, setError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Resend OTP Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  // Email syntax validator
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

  // Centralized role-based redirection
  const handleRoleRedirection = (role?: string) => {
    if (role === 'admin' || role === 'SUPER_ADMIN') {
      navigate('/admin/dashboard')
    } else if (role === 'recruiter') {
      navigate('/company/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  // 1. NORMAL PASSWORD LOGIN HANDLER
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUnverifiedEmail(null)
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
    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.post('/auth/login', {
        email: cleanEmail,
        password: password,
      })
      const { access_token, user } = res.data
      login(access_token, user, rememberMe)
      handleRoleRedirection(user?.role)
    } catch (err: any) {
      console.error('Login error:', err)
      const status = err.response?.status
      const detail = err.response?.data?.detail

      if (!err.response) {
        setError('Cannot reach authentication server. Please check your network connection.')
      } else if (status === 403 && typeof detail === 'string' && detail.toLowerCase().includes('not verified')) {
        setUnverifiedEmail(cleanEmail)
        setError('Your account is not verified. Please verify your email before logging in.')
      } else if (status === 400 || status === 401) {
        setError(typeof detail === 'string' ? detail : 'Incorrect email or password. Please try again.')
      } else {
        setError(typeof detail === 'string' ? detail : 'Sign in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // 2. OTP LOGIN — STEP 1: REQUEST OTP
  const handleSendOtpCode = async (e: React.FormEvent) => {
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
      await apiClient.post('/auth/send-otp', { email: cleanEmail })
      setOtpStep('code')
      setCooldown(60)
    } catch (err: any) {
      console.error('Send OTP error:', err)
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string' 
          ? detail 
          : 'Failed to send verification code. Please check your email address and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // 2. OTP LOGIN — STEP 2: VERIFY OTP
  const handleVerifyOtpCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanOtp = otp.trim()
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code')
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.post('/auth/verify-otp', {
        email: email.trim(),
        otp: cleanOtp,
      })
      const { access_token, user } = res.data
      login(access_token, user, rememberMe)
      handleRoleRedirection(user?.role)
    } catch (err: any) {
      console.error('Verify OTP error:', err)
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Invalid or expired verification code. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return
    setError(null)
    setLoading(true)
    try {
      await apiClient.post('/auth/send-otp', { email: email.trim() })
      setCooldown(60)
      setOtp('')
    } catch (err: any) {
      console.error('Resend OTP error:', err)
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to resend code. Please try again.')
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
        {/* Navigation header */}
        <div className="mb-6">
          {authMethod === 'otp' && otpStep === 'code' ? (
            <button
              onClick={() => {
                setOtpStep('email')
                setError(null)
                setOtp('')
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Change Email Address
            </button>
          ) : (
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Landing Page
            </Link>
          )}
        </div>

        {/* Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-gradient-purple">
            IntervueAI
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Welcome back. Accelerate your interview preparation.</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {authMethod === 'password'
                ? 'Sign In'
                : otpStep === 'email'
                ? 'Sign In with Code'
                : 'Verify Identity'}
            </h2>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {authMethod === 'password' ? 'Password' : 'OTP Code'}
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-xs mb-5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 leading-relaxed">
                <span>{error}</span>
                {unverifiedEmail && (
                  <div className="mt-1.5">
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                      className="font-semibold text-purple-300 hover:text-purple-200 underline inline-flex items-center gap-1"
                    >
                      Click here to enter your verification code &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* 1. NORMAL PASSWORD LOGIN (DEFAULT) */}
            {authMethod === 'password' ? (
              <motion.form
                key="password-login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handlePasswordLogin}
                className="space-y-4"
              >
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  error={emailError || undefined}
                  placeholder="name@example.com"
                  icon={<Mail className="w-5 h-5 text-gray-500" />}
                  disabled={loading}
                  autoComplete="email"
                />

                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5 text-gray-500" />}
                  disabled={loading}
                  autoComplete="current-password"
                />

                {/* Remember me & Forgot Password */}
                <div className="flex items-center justify-between pt-1 pb-1">
                  <Checkbox
                    label="Remember me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <Link
                    to="/forgot-password"
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
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

                {/* Switch to OTP Login */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0b0f24] px-2 text-gray-500 font-medium tracking-wider">
                      Or alternative access
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('otp')
                    setOtpStep('email')
                    setError(null)
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Sign in with verification code
                </button>
              </motion.form>
            ) : otpStep === 'email' ? (
              /* 2. OTP LOGIN — STEP 1: ENTER EMAIL */
              <motion.form
                key="otp-email-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSendOtpCode}
                className="space-y-4"
              >
                <div className="text-xs text-gray-400 leading-relaxed">
                  Enter your registered email address. We'll send a one-time 6-digit confirmation code.
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  error={emailError || undefined}
                  placeholder="name@example.com"
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
                  Send Verification Code
                </Button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('password')
                      setError(null)
                    }}
                    className="text-xs text-gray-400 hover:text-white font-medium transition-colors cursor-pointer"
                  >
                    &larr; Sign in with password instead
                  </button>
                </div>
              </motion.form>
            ) : (
              /* 2. OTP LOGIN — STEP 2: ENTER CODE */
              <motion.form
                key="otp-code-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyOtpCode}
                className="space-y-4"
              >
                <div className="text-xs text-gray-400 text-center leading-relaxed">
                  We've dispatched a 6-digit verification code to <br />
                  <strong className="text-purple-300 font-semibold">{email}</strong>. It expires in 5 minutes.
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
                  autoComplete="one-time-code"
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  loading={loading}
                  icon={<ArrowRight className="w-4.5 h-4.5" />}
                  iconPosition="right"
                >
                  Verify & Sign In
                </Button>

                {/* Resend & Back options */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('password')
                      setError(null)
                    }}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Password sign-in
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className={`font-semibold transition-colors ${
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

          {/* Footer Navigation */}
          <div className="mt-8 pt-5 border-t border-white/5 text-center">
            <span className="text-gray-500 text-xs">Don't have an account? </span>
            <Link to="/signup" className="text-purple-400 hover:text-purple-300 text-xs font-semibold transition-colors">
              Sign up free
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
