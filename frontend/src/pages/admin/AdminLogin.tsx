import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Button } from '../../components/ui/Button'
import { motion } from 'framer-motion'
import apiClient from '../../services/api'

export const AdminLogin: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const res = await apiClient.post('/auth/login', { email, password, role: 'admin' })
      const { access_token, user } = res.data
      
      login(access_token, user, false) // Admin sessions are not persistent across device restarts
      navigate('/admin/dashboard')
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.detail || 
        'Incorrect admin credentials or unauthorized role access.'
      )
    } finally {
      setLoading(false)
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
        {/* Back to Landing */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Landing Page
        </Link>

        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-gradient-purple flex items-center justify-center gap-2">
            <ShieldCheck className="w-8 h-8 text-purple-500" /> IntervueAI
          </Link>
          <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20 mt-2.5 inline-block">
            Administrative Access Gate
          </span>
        </div>

        <div className="glass-card p-8 rounded-2xl shadow-xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-wider">Admin Sign In</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5 text-gray-500" />}
              disabled={loading}
            />

            <PasswordInput
              label="Security Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Enter Console
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-500 hover:text-white text-xs transition-colors">
              Return to Landing Portal
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
