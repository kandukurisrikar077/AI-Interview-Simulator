import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Button } from '../components/ui/Button'
import apiClient from '../services/api'

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState<string | null>(null)

  // Step: 'verify_otp' (enter 6-digit code) -> 'new_password' (enter & confirm password)
  const [step, setStep] = useState<'verify_otp' | 'new_password'>('verify_otp')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(60)

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  // Password complexity checks
  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const isPasswordStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial

  // Step 1: Verify Reset OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim()
    const cleanOtp = otp.trim()

    if (!cleanEmail) {
      setError('Please provide your email address')
      return
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email')
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.post('/auth/verify-reset-otp', {
        email: cleanEmail,
        otp: cleanOtp,
      })
      const token = res.data?.reset_token
      setResetToken(token || null)
      setStep('new_password')
    } catch (err: any) {
      console.error('Verify reset OTP error:', err)
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Invalid or expired verification code. Please request a new code.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Resend Reset OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading || !email.trim()) return
    setError(null)
    setLoading(true)
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() })
      setCooldown(60)
      setOtp('')
    } catch (err: any) {
      console.error('Resend reset OTP error:', err)
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to resend code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields')
      return
    }

    if (!isPasswordStrong) {
      setError('Password must meet all complexity requirements')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.trim(),
        new_password: password,
        reset_token: resetToken || undefined,
        otp: otp.trim() || undefined,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      console.error('Reset password error:', err)
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Failed to reset password. Please verify the code and try again.'
      )
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
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Sign In
        </Link>

        {/* Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-gradient-purple">
            IntervueAI
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Secure Account Password Recovery</p>
        </div>

        {/* Glass Card */}
        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            {success
              ? 'Password Updated!'
              : step === 'verify_otp'
              ? 'Enter Reset Code'
              : 'Create New Password'}
          </h2>

          <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
            {success
              ? 'Your password has been securely reset. Redirecting to sign in...'
              : step === 'verify_otp'
              ? `Enter the 6-digit verification code dispatched to ${email || 'your email'}.`
              : 'Choose a strong, unique password for your account.'}
          </p>

          {/* Success State */}
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Reset Successful</h3>
                <p className="text-gray-400 text-xs">
                  Your credentials have been updated. You can now sign in with your new password.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  className="w-full"
                >
                  Proceed to Sign In &rarr;
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Error Banner */}
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

              <AnimatePresence mode="wait">
                {step === 'verify_otp' ? (
                  /* STEP 1: VERIFY OTP */
                  <motion.form
                    key="verify-otp-step"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-4"
                  >
                    {!searchParams.get('email') && (
                      <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        icon={<Mail className="w-5 h-5 text-gray-500" />}
                        disabled={loading}
                      />
                    )}

                    <Input
                      label="6-Digit Reset Code"
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
                      Verify Reset Code
                    </Button>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <Link to="/forgot-password" className="text-gray-400 hover:text-white transition-colors">
                        Re-enter email
                      </Link>

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
                ) : (
                  /* STEP 2: ENTER NEW PASSWORD */
                  <motion.form
                    key="new-password-step"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onSubmit={handleResetPassword}
                    className="space-y-4"
                  >
                    <PasswordInput
                      label="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      icon={<Lock className="w-5 h-5 text-gray-500" />}
                      disabled={loading}
                      autoComplete="new-password"
                    />

                    {/* Live Password Complexity Checklist */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                      <p className="text-[11px] font-semibold text-gray-400 mb-1">Password Requirements:</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                        <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-green-400' : 'bg-gray-600'}`} />
                          Min 8 chars
                        </span>
                        <span className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasUpperCase ? 'bg-green-400' : 'bg-gray-600'}`} />
                          One uppercase
                        </span>
                        <span className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasLowerCase ? 'bg-green-400' : 'bg-gray-600'}`} />
                          One lowercase
                        </span>
                        <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-green-400' : 'bg-gray-600'}`} />
                          One number
                        </span>
                        <span className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? 'bg-green-400' : 'bg-gray-600'}`} />
                          One special character (!@#$%^&*)
                        </span>
                      </div>
                    </div>

                    <PasswordInput
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      icon={<Lock className="w-5 h-5 text-gray-500" />}
                      disabled={loading}
                      autoComplete="new-password"
                      error={
                        confirmPassword && password !== confirmPassword
                          ? 'Passwords do not match'
                          : undefined
                      }
                    />

                    <Button
                      type="submit"
                      className="w-full mt-2"
                      loading={loading}
                      disabled={!isPasswordStrong || password !== confirmPassword}
                      icon={<ArrowRight className="w-4.5 h-4.5" />}
                      iconPosition="right"
                    >
                      Update Password
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 pt-5 border-t border-white/5 text-center">
            <span className="text-gray-500 text-xs">Return to </span>
            <Link to="/login" className="text-purple-400 hover:text-purple-300 text-xs font-semibold transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
