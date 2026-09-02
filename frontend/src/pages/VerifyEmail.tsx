import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import apiClient from '../services/api'

export const VerifyEmail: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)
    setLoading(true)

    const verificationCode = code.join('')
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit pin.')
      setLoading(false)
      return
    }

    try {
      await apiClient.post('/auth/verify-email', {
        email,
        code: verificationCode
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Verification failed. Please check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return
    setError(null)
    setInfoMessage(null)
    setResending(true)
    try {
      await apiClient.post('/auth/resend-verification', { email })
      setInfoMessage('Verification code sent. Please check your email.')
      setCooldown(60)
      setCode(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to resend verification code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#050816] text-white">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-gradient-purple">
            IntervueAI
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Verify your signup email address.</p>
        </div>

        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Verify Email</h2>
          
          {success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Verification Complete!</h3>
                <p className="text-gray-400 text-xs font-light">Redirecting you to login...</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs mb-4"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {infoMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg border border-green-500/20 bg-green-500/5 text-green-400 text-xs mb-4"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{infoMessage}</span>
                </motion.div>
              )}

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                We have dispatched a 6-digit confirmation pin to <br />
                <strong className="text-purple-300">{email}</strong>. Enter the code to activate your assessment workspace.
              </p>

              <div className="flex justify-between gap-2">
                {code.map((num, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={num}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-12 text-center rounded-lg border border-gray-800 bg-gray-950/60 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 text-white outline-none font-bold text-lg transition-all"
                  />
                ))}
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Confirm Verification Code
              </Button>

              <div className="text-center text-xs text-gray-500">
                Didn't receive the pin?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className={`font-semibold select-none transition-colors ${
                    cooldown > 0 || resending
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-purple-400 hover:text-purple-300 cursor-pointer'
                  }`}
                >
                  {resending ? 'Sending...' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Email'}
                </button>
              </div>

              <div className="text-center">
                <Link to="/login" className="text-gray-400 hover:text-white text-xs inline-flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
