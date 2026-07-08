import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import apiClient from '../services/api'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Button } from '../components/ui/Button'

export const Signup: React.FC = () => {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Password checks
  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const isPasswordStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial

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

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
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

    if (!isPasswordStrong) {
      setError('Password must meet all complexity requirements')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await apiClient.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`)
      }, 2000)
    } catch (err: any) {
      console.error(err)
      const detail = err.response?.data?.detail
      let errorMsg = 'Registration failed. This email might already be registered.'
      
      if (err.response?.status === 422 && Array.isArray(detail)) {
        errorMsg = detail
          .map((e: any) => {
            const field = e.loc ? e.loc[e.loc.length - 1] : ''
            const formattedField = field ? field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ') : ''
            return `${formattedField ? formattedField + ': ' : ''}${e.msg}`
          })
          .join(', ')
      } else if (typeof detail === 'string' && detail) {
        errorMsg = detail
      }
      
      setError(errorMsg)
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
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-gradient-purple">
            IntervueAI
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Create your free account to get started.</p>
        </div>

        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

          {success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Registration Successful!</h3>
                <p className="text-gray-400 text-xs font-light">Redirecting you to the sign-in page...</p>
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  icon={<User className="w-5 h-5 text-gray-500" />}
                  disabled={loading}
                />

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

                <div className="space-y-2">
                  <PasswordInput
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock className="w-5 h-5 text-gray-500" />}
                    disabled={loading}
                  />
                  {password.length > 0 && (
                    <div className="space-y-1 bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-gray-400">
                      <p className="font-medium text-gray-300">Password requirements:</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                        <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-green-400' : 'bg-gray-600'}`} />
                          Min 8 chars
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasUpperCase ? 'bg-green-400' : 'bg-gray-600'}`} />
                          One uppercase
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasLowerCase ? 'bg-green-400' : 'bg-gray-600'}`} />
                          One lowercase
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-green-400' : 'bg-gray-600'}`} />
                          One number
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-green-400' : 'text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? 'bg-green-400' : 'bg-gray-600'}`} />
                          One special char
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5 text-gray-500" />}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  loading={loading}
                  icon={<ArrowRight className="w-4.5 h-4.5" />}
                  iconPosition="right"
                >
                  Create Account
                </Button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-gray-500 text-xs">Already have an account? </span>
                <Link to="/login" className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-all">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
