import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Building, Users, Activity } from 'lucide-react'
import apiClient from '../../services/api'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Button } from '../../components/ui/Button'

export const RecruiterSignup: React.FC = () => {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Recruiter specific fields
  const [companyName, setCompanyName] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [industry, setIndustry] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false)

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
    setEmailAlreadyExists(false)
    setError(null)
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
    if (!fullName || !email || !password || !confirmPassword || !companyName) {
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
        role: 'recruiter',
        company_name: companyName
      })
      setSuccess(true)
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`)
      }, 2000)
    } catch (err: any) {
      console.error(err)
      const detail = err.response?.data?.detail
      let errorMsg = 'Registration failed. Please try again.'
      let isExistingEmail = false

      if (
        err.response?.status === 409 || 
        (err.response?.status === 400 && 
         typeof detail === 'string' && 
         (detail.toLowerCase().includes('already exists') || 
          detail.toLowerCase().includes('already registered')))
      ) {
        isExistingEmail = true
        errorMsg = typeof detail === 'string' ? detail : 'An account with this email already exists.'
      } else if (err.response?.status === 422 && Array.isArray(detail)) {
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

      setEmailAlreadyExists(isExistingEmail)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-[#050816] text-white">
      {/* Background glow animations */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl relative z-10"
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
          <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20 mt-2.5 inline-block">
            Recruiter Workspace Registration
          </span>
        </div>

        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-2 text-center font-sans">Get Started as a Recruiter</h2>
          <p className="text-gray-400 text-xs text-center mb-6">Create interview templates, evaluate candidates, and run assessments.</p>

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
                <p className="text-gray-400 text-xs font-light">Redirecting you to the verification screen...</p>
              </div>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs mb-5"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {emailAlreadyExists && (
                    <div className="pl-6">
                      <Link
                        to="/recruiter/login"
                        className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 transition-colors"
                      >
                        Sign in to your existing workspace →
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    id="full_name"
                    name="name"
                    autoComplete="name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    icon={<User className="w-5 h-5 text-gray-500" />}
                    disabled={loading}
                  />

                  <Input
                    label="Work Email Address"
                    id="email"
                    name="email"
                    autoComplete="username"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    error={emailError || undefined}
                    placeholder="jane@company.com"
                    icon={<Mail className="w-5 h-5 text-gray-500" />}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    id="company_name"
                    name="company_name"
                    autoComplete="organization"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    icon={<Building className="w-5 h-5 text-gray-500" />}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PasswordInput
                    label="Security Password"
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock className="w-5 h-5 text-gray-500" />}
                    disabled={loading}
                  />

                  <PasswordInput
                    label="Confirm Password"
                    id="confirm_password"
                    name="confirm_password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock className="w-5 h-5 text-gray-500" />}
                    disabled={loading}
                  />
                </div>

                {/* Password Strength Checklist */}
                {password.length > 0 && (
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5 text-xs text-gray-400">
                    <span className="font-semibold text-[10px] uppercase text-gray-500 tracking-wider">Password Requirements:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-green-400' : 'bg-gray-500'}`} />
                        At least 8 chars
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasUpperCase ? 'bg-green-400' : 'bg-gray-500'}`} />
                        1 uppercase letter
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasLowerCase ? 'bg-green-400' : 'bg-gray-500'}`} />
                        1 lowercase letter
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-green-400' : 'bg-gray-500'}`} />
                        1 digit
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? 'bg-green-400' : 'bg-gray-500'}`} />
                        1 special character
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full mt-2"
                  loading={loading}
                  icon={<ArrowRight className="w-4.5 h-4.5" />}
                  iconPosition="right"
                >
                  Create Workspace
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-gray-500">
                <span>Already have a recruiter workspace? </span>
                <Link to="/recruiter/login" className="text-purple-400 hover:text-purple-300 font-medium transition-all">
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
