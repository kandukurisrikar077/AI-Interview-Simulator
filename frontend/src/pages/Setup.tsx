import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Play, Loader2, Code, UserCheck, Shield, Layers,
  Camera, Mic, Network, Video, Headphones, BrainCircuit,
  ChevronRight, CheckCircle2, AlertCircle, Briefcase, Gauge, Clock
} from 'lucide-react'
import apiClient from '../services/api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'

type AccessStatus = 'pending' | 'success' | 'failed'

export const Setup: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Configuration state
  const [jobRole, setJobRole] = useState((user as any)?.preferred_role || '')
  const [type, setType] = useState('technical')
  const [difficulty, setDifficulty] = useState('medium')
  const [mode, setMode] = useState<'voice' | 'video' | 'coding'>('voice')
  const [duration, setDuration] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hardware prep
  const [cameraAccess, setCameraAccess] = useState<AccessStatus>('pending')
  const [micAccess, setMicAccess] = useState<AccessStatus>('pending')
  const [networkPing, setNetworkPing] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Camera check
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        setCameraAccess('success')
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setCameraAccess('failed'))

    // Mic check
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setMicAccess('success'))
      .catch(() => setMicAccess('failed'))

    // Simulated network latency check
    const start = Date.now()
    fetch('/favicon.ico').catch(() => {}).finally(() => {
      setNetworkPing(Math.min(Math.round(Date.now() - start), 299))
    })

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const handleSubmit = async () => {
    if (!jobRole.trim()) {
      setError('Please enter a Job Role to target.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await apiClient.post('/interviews/', {
        type,
        difficulty,
        duration_minutes: duration,
        job_role: jobRole.trim(),
        mode,
      })
      const interviewId = res.data.id

      if (mode === 'coding') {
        // For coding mode: start the interview first to create a session, then go to coding round
        await apiClient.post(`/interviews/${interviewId}/start`)
        navigate(`/coding?id=${interviewId}`)
      } else {
        navigate(`/interview/live?id=${interviewId}`)
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create interview session. Ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const interviewTypes = [
    { id: 'technical', label: 'Technical', desc: 'System design, frameworks, programming concepts.', icon: Code },
    { id: 'hr', label: 'HR Behavioral', desc: 'Situational logic, leadership, workplace scenarios.', icon: UserCheck },
    { id: 'mixed', label: 'Mixed Round', desc: 'Blends both programming and behavioral questions.', icon: Layers },
    { id: 'coding', label: 'Coding Challenge', desc: 'Direct algorithmic assignments in Monaco editor.', icon: Shield },
  ]

  const difficulties = [
    { id: 'easy', label: 'Easy', color: 'text-green-400', desc: 'Foundational concepts, beginner friendly' },
    { id: 'medium', label: 'Medium', color: 'text-yellow-400', desc: 'Intermediate problems, industry standard' },
    { id: 'hard', label: 'Hard', color: 'text-red-400', desc: 'Advanced, FAANG-level difficulty' },
  ]

  const modes = [
    { id: 'voice', label: 'Voice Mode', desc: 'Answer questions verbally using the microphone.', icon: Headphones },
    { id: 'video', label: 'Video Mode', desc: 'Full webcam + mic simulation like a real interview.', icon: Video },
    { id: 'coding', label: 'Coding Mode', desc: 'Algorithmic coding challenges in Monaco editor.', icon: BrainCircuit },
  ]

  const durations = [15, 30, 45, 60]

  const CheckIcon = ({ status }: { status: AccessStatus }) => {
    if (status === 'pending') return <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
    if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-green-400" />
    return <AlertCircle className="w-4 h-4 text-red-400" />
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10 space-y-8">
        {/* Back link */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Configure Interview Room</h1>
          <p className="text-gray-400 text-sm mt-1">Set your job target, interview style, and calibrate your devices.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== Left / Main Config ===== */}
          <div className="lg:col-span-2 space-y-6">

            {/* Job Role */}
            <Card className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Job Role</h3>
              </div>
              <input
                type="text"
                value={jobRole}
                onChange={e => setJobRole(e.target.value)}
                placeholder="e.g. Frontend Engineer, Data Scientist, Product Manager…"
                className="w-full bg-gray-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
              <p className="text-[10px] text-gray-600">AI will tailor every question to this specific role.</p>
            </Card>

            {/* Interview Type */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interview Category</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {interviewTypes.map(t => {
                  const Icon = t.icon
                  const active = type === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setType(t.id)
                        if (t.id === 'coding') setMode('coding')
                        else if (mode === 'coding') setMode('voice')
                      }}
                      className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] cursor-pointer flex gap-3 ${
                        active
                          ? 'border-purple-500/60 bg-purple-500/8 shadow-lg shadow-purple-500/5'
                          : 'border-white/5 bg-gray-950 hover:border-white/10'
                      }`}
                    >
                      <Icon className={`w-7 h-7 shrink-0 mt-0.5 ${active ? 'text-purple-400' : 'text-gray-600'}`} />
                      <div>
                        <h4 className={`font-bold text-sm ${active ? 'text-white' : 'text-gray-300'}`}>{t.label}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{t.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Difficulty */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Difficulty Level</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`p-4 rounded-xl border text-center cursor-pointer transition-all hover:scale-[1.01] ${
                      difficulty === d.id
                        ? 'border-purple-500/60 bg-purple-500/8'
                        : 'border-white/5 bg-gray-950 hover:border-white/10'
                    }`}
                  >
                    <span className={`font-extrabold text-sm capitalize block ${difficulty === d.id ? d.color : 'text-gray-400'}`}>
                      {d.label}
                    </span>
                    <span className="text-[9px] text-gray-600 mt-1 block leading-tight">{d.desc}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Interview Mode */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interview Mode</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {modes.map(m => {
                  const Icon = m.icon
                  const active = mode === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as any)}
                      className={`p-4 rounded-xl border text-center cursor-pointer transition-all hover:scale-[1.01] flex flex-col items-center gap-2 ${
                        active
                          ? 'border-purple-500/60 bg-purple-500/8'
                          : 'border-white/5 bg-gray-950 hover:border-white/10'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${active ? 'text-purple-400' : 'text-gray-600'}`} />
                      <span className={`font-bold text-xs ${active ? 'text-white' : 'text-gray-400'}`}>{m.label}</span>
                      <span className="text-[9px] text-gray-600 leading-tight text-center">{m.desc}</span>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Duration */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Session Duration</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {durations.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-3 rounded-xl border text-center cursor-pointer transition-all hover:scale-[1.01] ${
                      duration === d
                        ? 'border-purple-500/60 bg-purple-500/8 text-white'
                        : 'border-white/5 bg-gray-950 text-gray-400 hover:border-white/10'
                    }`}
                  >
                    <span className="font-extrabold text-sm block">{d}</span>
                    <span className="text-[9px] text-gray-500">min</span>
                  </button>
                ))}
              </div>
            </Card>

          </div>

          {/* ===== Right: Device Check + Launch ===== */}
          <div className="space-y-6">
            <Card className="space-y-5 sticky top-6">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Device Diagnostics</h3>
              </div>

              {/* Camera live preview */}
              <div className="aspect-video rounded-xl bg-gray-950 border border-white/5 relative overflow-hidden flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                {cameraAccess === 'pending' && (
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin z-10" />
                )}
                {cameraAccess === 'failed' && (
                  <div className="z-10 text-center">
                    <Camera className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                    <span className="text-red-400 text-xs">Camera unavailable</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 z-10">
                  <Camera className="w-3 h-3 text-purple-400" /> Preview
                </div>
              </div>

              {/* Diagnostics list */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="flex items-center gap-2 text-gray-400">
                    <Camera className="w-3.5 h-3.5 text-purple-400" /> Camera Feed
                  </span>
                  <CheckIcon status={cameraAccess} />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="flex items-center gap-2 text-gray-400">
                    <Mic className="w-3.5 h-3.5 text-indigo-400" /> Microphone
                  </span>
                  <CheckIcon status={micAccess} />
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="flex items-center gap-2 text-gray-400">
                    <Network className="w-3.5 h-3.5 text-fuchsia-400" /> Network Latency
                  </span>
                  {networkPing !== null ? (
                    <Badge variant={networkPing < 150 ? 'success' : 'danger'}>{networkPing} ms</Badge>
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                  )}
                </div>
              </div>

              {/* Config summary */}
              <div className="bg-gray-950 border border-white/5 rounded-xl p-4 space-y-2 text-xs">
                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Session Summary</h4>
                {[
                  { label: 'Role', value: jobRole || '—' },
                  { label: 'Type', value: type },
                  { label: 'Difficulty', value: difficulty },
                  { label: 'Mode', value: mode },
                  { label: 'Duration', value: `${duration} min` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="text-gray-200 font-semibold capitalize">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Launch button */}
              <Button
                className="w-full"
                disabled={loading}
                loading={loading}
                onClick={handleSubmit}
                icon={<ChevronRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Enter Interview Room
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
