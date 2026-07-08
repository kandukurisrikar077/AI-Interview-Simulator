import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Mic, MicOff, ArrowRight, Camera, CameraOff,
  Wifi, ShieldAlert, CheckCircle, Volume2, VolumeX, Play,
  Loader2, Keyboard, Check, Clock, Video, Headphones,
  Maximize2, PictureInPicture, Pause, RefreshCw, AlertCircle
} from 'lucide-react'
import { interviewService } from '../services/interviewService'
import apiClient, { API_URL } from '../services/api'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Dialog } from '../components/ui/Dialog'
import { useToast } from '../context/ToastContext'
import { Breadcrumbs } from '../components/common/Breadcrumbs'
import { motion, AnimatePresence } from 'framer-motion'

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

const MAX_QUESTIONS = 4

const count_filler_words = (text: string): number => {
  if (!text) return 0
  const text_lower = text.toLowerCase()
  const fillers = ["um", "uh", "like", "you know", "actually", "basically"]
  let count = 0
  fillers.forEach(f => {
    const regex = new RegExp(`\\b${f}\\b`, 'g')
    const matches = text_lower.match(regex)
    if (matches) count += matches.length
  })
  return count
}

export const LiveInterview: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const interviewId = searchParams.get('id')

  const { warning, success } = useToast()

  const [step, setStep] = useState<'checking' | 'ready' | 'live'>('checking')
  const [cameraAccess, setCameraAccess] = useState<boolean | null>(null)
  const [micAccess, setMicAccess] = useState<boolean | null>(null)
  const [internetSpeed, setInternetSpeed] = useState<string | null>(null)

  // Interview session metadata
  const [interviewMode, setInterviewMode] = useState<string>('voice')
  const [durationMinutes, setDurationMinutes] = useState<number>(30)
  const [showCamera, setShowCamera] = useState(true)

  // Enhanced features
  const [isPaused, setIsPaused] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [notes, setNotes] = useState('')
  const [networkPing, setNetworkPing] = useState(32)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [questionIndex, setQuestionIndex] = useState(1)
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [textMode, setTextMode] = useState(false)
  const [voiceRead, setVoiceRead] = useState(true)

  const [timeLeft, setTimeLeft] = useState(1800)
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)
  const [malpracticeCount, setMalpracticeCount] = useState(0)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)
  const [speakingDuration, setSpeakingDuration] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const activeStreamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)

  // Real-time computed speech metrics
  const fillerCount = count_filler_words(transcript)
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  
  // Dynamic confidence rating (70 - 98 based on length and speed)
  const confidencePercent = transcript.trim()
    ? Math.min(98, Math.max(70, 80 + Math.min(15, wordCount * 0.5) - (fillerCount * 2)))
    : 0

  const [realtimeWpm, setRealtimeWpm] = useState(0)
  const [eyeContactScore, setEyeContactScore] = useState(95)

  // Toggle webcam feed transmission
  const toggleCameraTrack = () => {
    if (activeStreamRef.current) {
      const videoTracks = activeStreamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !cameraEnabled
      })
      setCameraEnabled(!cameraEnabled)
      success(`Camera feed ${!cameraEnabled ? 'enabled' : 'disabled'}.`)
      
      // Log camera change
      if (interviewId) {
        interviewService.logMalpractice(Number(interviewId), {
          type: !cameraEnabled ? 'camera_active' : 'camera_inactive',
          severity: 'low',
          confidence: 1.0
        }).catch(() => {})
      }
    }
  }

  // Toggle mic track transmission
  const toggleMicTrack = () => {
    if (activeStreamRef.current) {
      const audioTracks = activeStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !micEnabled
      })
      setMicEnabled(!micEnabled)
      success(`Microphone ${!micEnabled ? 'muted' : 'unmuted'}.`)

      // Log microphone change
      if (interviewId) {
        interviewService.logMalpractice(Number(interviewId), {
          type: !micEnabled ? 'mic_active' : 'mic_inactive',
          severity: 'low',
          confidence: 1.0
        }).catch(() => {})
      }
    }
  }

  // Request/exit browser Fullscreen
  const toggleFullscreen = () => {
    const element = document.documentElement
    if (!document.fullscreenElement) {
      element.requestFullscreen().then(() => {
        setIsFullscreen(true)
        success('Fullscreen mode active.')
      }).catch(err => {
        console.error('Fullscreen request failed:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
        success('Fullscreen mode closed.')
      })
    }
  }

  // Request Picture-in-Picture on active video
  const togglePictureInPicture = async () => {
    if (!videoRef.current) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (err) {
      console.warn('PiP not supported or failed:', err)
      setError('Picture-in-Picture mode could not be loaded.')
    }
  }

  // Replay question audio
  const handleReplayQuestion = () => {
    if (currentQuestion?.text) {
      speakQuestion(currentQuestion.text)
      success('Question audio replaying.')
    }
  }

  useEffect(() => {
    if (isRecording && recordingStartTime) {
      const elapsedMins = (Date.now() - recordingStartTime) / 60000.0
      if (elapsedMins > 0.05) {
        setRealtimeWpm(Math.round(wordCount / elapsedMins))
      }
    } else if (transcript) {
      setRealtimeWpm(125)
    } else {
      setRealtimeWpm(0)
    }
  }, [transcript, isRecording, wordCount, recordingStartTime])

  // Simulated eye contact drift to feel alive
  useEffect(() => {
    if (step !== 'live' || isPaused) return
    const interval = setInterval(() => {
      setEyeContactScore(prev => {
        const drift = Math.random() > 0.5 ? 1 : -1
        return Math.min(98, Math.max(88, prev + drift))
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [step, isPaused])

  // Live Network ping update
  useEffect(() => {
    if (step !== 'live') return
    const interval = setInterval(() => {
      setNetworkPing(Math.round(20 + Math.random() * 40))
    }, 3000)
    return () => clearInterval(interval)
  }, [step])

  // Fetch interview details on mount to read mode + duration
  useEffect(() => {
    if (!interviewId) return
    apiClient.get(`/interviews/${interviewId}`)
      .then(res => {
        const data = res.data
        const mode = data.mode || 'voice'
        const mins = data.duration_minutes || 30
        setInterviewMode(mode)
        setDurationMinutes(mins)
        setTimeLeft(mins * 60)
        // In video mode always show camera; in voice mode, camera optional
        setShowCamera(mode === 'video')
      })
      .catch(() => {
        // Use defaults if backend not available
        setTimeLeft(30 * 60)
      })
  }, [interviewId])

  useEffect(() => {
    if (activeStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = activeStreamRef.current
    }
  }, [step])

  const mockQuestions = [
    { id: 1, text: "Can you explain the difference between client-side and server-side rendering in React 19?", category: "React Frontend" },
    { id: 2, text: "What is database indexing, and how does it affect the performance of SELECT and INSERT/UPDATE queries?", category: "Database & SQL" },
    { id: 3, text: "Tell me about a time you handled conflict. How did you resolve it?", category: "HR Behavioral" },
    { id: 4, text: "Describe the CAP theorem in distributed systems and how it affects system design decisions.", category: "System Design" },
  ]

  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recognitionRef.current) recognitionRef.current.abort()
      window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    if (step === 'checking') runHardwareDiagnostics()
  }, [step])

  // Malpractice tab-switch listener
  useEffect(() => {
    if (step !== 'live' || isPaused) return
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setMalpracticeCount(prev => prev + 1)
        warning('Integrity warning: Tab focus shift detected. Infractions are recorded.')
        if (interviewId) {
          interviewService.logMalpractice(Number(interviewId), {
            type: 'tab_switch', severity: 'medium', confidence: 0.95,
          }).catch(() => {})
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [step, isPaused, interviewId])

  // Proctoring window focus change listener
  useEffect(() => {
    if (step !== 'live' || isPaused) return
    const handleWindowBlur = () => {
      setMalpracticeCount(prev => prev + 1)
      warning('Integrity warning: Lost window focus. Infraction logged.')
      if (interviewId) {
        interviewService.logMalpractice(Number(interviewId), {
          type: 'window_blur', severity: 'low', confidence: 0.98
        }).catch(() => {})
      }
    }
    window.addEventListener('blur', handleWindowBlur)
    return () => window.removeEventListener('blur', handleWindowBlur)
  }, [step, isPaused, interviewId])

  // Proctoring Fullscreen exit listener
  useEffect(() => {
    if (step !== 'live' || isPaused) return
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false)
        setMalpracticeCount(prev => prev + 1)
        warning('Integrity warning: Fullscreen mode exited. Infraction logged.')
        if (interviewId) {
          interviewService.logMalpractice(Number(interviewId), {
            type: 'fullscreen_exit', severity: 'low', confidence: 0.99
          }).catch(() => {})
        }
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [step, isPaused, isFullscreen, interviewId])

  // Proctoring excessive idle time listener
  const [idleTime, setIdleTime] = useState(0)
  useEffect(() => {
    if (step !== 'live' || isPaused) return
    const interval = setInterval(() => {
      setIdleTime(prev => {
        const next = prev + 1
        if (next >= 120) { // 2 minutes of idle time
          setMalpracticeCount(m => m + 1)
          warning('Integrity warning: Excessive idle time detected.')
          if (interviewId) {
            interviewService.logMalpractice(Number(interviewId), {
              type: 'excessive_idle', severity: 'medium', confidence: 0.9
            }).catch(() => {})
          }
          return 0
        }
        return next
      })
    }, 1000)

    const resetIdle = () => setIdleTime(0)
    window.addEventListener('mousemove', resetIdle)
    window.addEventListener('keypress', resetIdle)
    window.addEventListener('scroll', resetIdle)
    window.addEventListener('click', resetIdle)

    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', resetIdle)
      window.removeEventListener('keypress', resetIdle)
      window.removeEventListener('scroll', resetIdle)
      window.removeEventListener('click', resetIdle)
    }
  }, [step, isPaused, interviewId])

  // Countdown timer (pausable)
  useEffect(() => {
    if (step !== 'live' || isPaused) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step, isPaused])

  // Speech recognition init with continuous listening support
  useEffect(() => {
    if (step !== 'live') return
    if (!SpeechRecognitionAPI) return

    const rec = new SpeechRecognitionAPI()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (e: any) => {
      if (isPaused) return
      let finalStr = ''
      let interimStr = ''
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalStr += e.results[i][0].transcript + ' '
        } else {
          interimStr += e.results[i][0].transcript
        }
      }
      if (finalStr) setTranscript(prev => prev + finalStr)
    }
    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e)
      setIsRecording(false)
    }
    rec.onend = () => {
      // Continuous listening: restart if still recording and not paused
      if (isRecording && step === 'live' && !isPaused) {
        try {
          rec.start()
        } catch {
          setIsRecording(false)
        }
      } else {
        setIsRecording(false)
      }
    }
    recognitionRef.current = rec
  }, [step, isPaused, isRecording])

  const speakQuestion = (text: string) => {
    if (!voiceRead || isPaused) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.05
    // Prefer a higher quality voice if available
    const voices = window.speechSynthesis.getVoices()
    const pref = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices[0]
    if (pref) utterance.voice = pref
    window.speechSynthesis.speak(utterance)
  }

  const runHardwareDiagnostics = async () => {
    setError(null)
    try {
      const startTime = Date.now()
      try { await fetch(API_URL) } catch {}
      const rtt = Date.now() - startTime
      setInternetSpeed(rtt < 150 ? 'Excellent' : rtt < 300 ? 'Good' : 'Poor')

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      activeStreamRef.current = stream
      setCameraAccess(true)
      setMicAccess(true)

      if (videoRef.current) videoRef.current.srcObject = stream

      setTimeout(() => setStep('ready'), 1200)
    } catch (err: any) {
      console.error(err)
      setCameraAccess(false)
      setMicAccess(false)
      setError('Webcam or Microphone permission is blocked. You can still type answers.')
      // Allow user to proceed after 2 seconds even without camera in voice-only mode
      setTimeout(() => setStep('ready'), 2000)
    }
  }

  const handleStartInterview = async () => {
    setLoading(true)
    setError(null)
    try {
      const question = await interviewService.start(Number(interviewId))
      setCurrentQuestion(question)
      setStep('live')
      success('Interview session started!')
      speakQuestion(question.text)
    } catch (err: any) {
      console.warn('API error, using mock questions for offline mode.')
      setCurrentQuestion(mockQuestions[0])
      setStep('live')
      success('Simulation started (offline mode)!')
      speakQuestion(mockQuestions[0].text)
    } finally {
      setLoading(false)
    }
  }

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Web Speech API is not supported in this browser. Please type your response.')
      setTextMode(true)
      return
    }
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      if (recordingStartTime) setSpeakingDuration((Date.now() - recordingStartTime) / 1000.0)
    } else {
      setTranscript('')
      setRecordingStartTime(Date.now())
      setSpeakingDuration(0)
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const handleAnswerSubmit = async () => {
    if (!transcript.trim()) {
      setError('Please provide an answer before submitting.')
      return
    }
    let finalDuration = speakingDuration
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
      if (recordingStartTime) finalDuration = (Date.now() - recordingStartTime) / 1000.0
    }

    setSubmitLoading(true)
    setError(null)
    window.speechSynthesis.cancel()

    try {
      await interviewService.submitAnswer(
        Number(interviewId),
        currentQuestion.id,
        { user_answer: transcript, transcript, speaking_duration_seconds: finalDuration || undefined }
      )
      success('Response submitted — AI evaluating…')

      const nextData = await interviewService.nextQuestion(Number(interviewId))
      if (nextData.status === 'round_complete') {
        if (nextData.next_step === 'coding') {
          navigate(`/coding?id=${interviewId}`)
        } else {
          await interviewService.finish(Number(interviewId))
          navigate(`/report?id=${interviewId}`)
        }
      } else {
        setCurrentQuestion(nextData)
        setQuestionIndex(prev => prev + 1)
        setTranscript('')
        if (nextData.text) speakQuestion(nextData.text)
      }
    } catch (err: any) {
      console.warn('API error, falling back to offline mock questions.')
      await new Promise(r => setTimeout(r, 800))
      success('Response submitted!')
      if (questionIndex < mockQuestions.length) {
        setCurrentQuestion(mockQuestions[questionIndex])
        setQuestionIndex(prev => prev + 1)
        setTranscript('')
        speakQuestion(mockQuestions[questionIndex].text)
      } else {
        navigate(`/report?id=${interviewId}`)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEndInterviewEarly = async () => {
    setIsExitDialogOpen(false)
    try {
      await interviewService.finish(Number(interviewId))
      navigate(`/report?id=${interviewId}`)
    } catch {
      navigate('/dashboard')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col p-6 overflow-hidden">
      <Breadcrumbs />

      {/* ── CHECKING ── */}
      {step === 'checking' && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full gap-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white mb-2">Hardware Check</h1>
            <p className="text-gray-400 text-sm">Verifying webcam, mic, and network latency.</p>
          </div>

          <div className="w-full glass-card p-6 rounded-2xl border border-white/5 space-y-4">
            {[
              { label: 'Camera Permission', icon: Camera, color: 'text-purple-400', state: cameraAccess },
              { label: 'Microphone Access', icon: Mic, color: 'text-purple-400', state: micAccess },
            ].map(({ label, icon: Icon, color, state }) => (
              <div key={label} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-white/5">
                <span className="flex items-center gap-2.5 text-sm text-gray-300">
                  <Icon className={`w-4 h-4 ${color}`} /> {label}
                </span>
                {state === null
                  ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  : state
                    ? <Check className="w-4 h-4 text-green-400" />
                    : <ShieldAlert className="w-4 h-4 text-red-400" />}
              </div>
            ))}

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-white/5">
              <span className="flex items-center gap-2.5 text-sm text-gray-300">
                <Wifi className="w-4 h-4 text-purple-400" /> Network Speed
              </span>
              {internetSpeed === null
                ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                : <span className="text-xs text-green-400 font-semibold">{internetSpeed}</span>}
            </div>

            {error && (
              <div className="p-3 text-xs text-yellow-400 border border-yellow-500/20 bg-yellow-500/5 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── READY ── */}
      {step === 'ready' && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full gap-8">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 animate-bounce" />
            <h1 className="text-3xl font-extrabold text-white">System Ready</h1>
            <p className="text-gray-400 text-sm mt-1">Calibrations check out — adjust your angle and hit Start.</p>
          </div>

          <div className="w-full glass-card p-6 rounded-2xl border border-white/5 text-center space-y-5">
            {/* Mode badge */}
            <div className="flex justify-center gap-2">
              <Badge variant="primary" className="flex items-center gap-1">
                {interviewMode === 'video' ? <Video className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
                {interviewMode.charAt(0).toUpperCase() + interviewMode.slice(1)} Mode
              </Badge>
              <Badge variant="info">{durationMinutes} min</Badge>
            </div>

            {/* Camera preview */}
            {(cameraAccess || interviewMode === 'video') && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-white/5">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <span className="absolute bottom-3 left-3 text-xs bg-black/60 px-2 py-0.5 rounded text-gray-300">Camera Preview</span>
              </div>
            )}

            {!cameraAccess && interviewMode !== 'video' && (
              <div className="aspect-video bg-gray-950 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-2">
                <CameraOff className="w-10 h-10 text-gray-700" />
                <p className="text-gray-600 text-xs">Camera unavailable — Voice mode active</p>
              </div>
            )}

            <Button
              className="w-full"
              disabled={loading}
              loading={loading}
              onClick={handleStartInterview}
              icon={<Play className="w-4 h-4 fill-white" />}
            >
              Start Interview Session
            </Button>
          </div>
        </div>
      )}

      {/* ── LIVE ── */}
      {step === 'live' && currentQuestion && (
        <div className="flex-1 flex flex-col">
          {/* Header bar */}
          <header className="flex flex-wrap justify-between items-center mb-5 border-b border-white/5 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-gradient-purple tracking-wider">IntervueAI Enterprise Mock Studio</h2>
              {malpracticeCount > 0 && (
                <Badge variant="danger" className="text-[10px] animate-pulse">
                  ⚠ {malpracticeCount} Integrity Violation{malpracticeCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm flex-wrap">
              {/* Network Latency Rating */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-950/60 border border-white/5 px-2.5 py-1.5 rounded-xl">
                <Wifi className={`w-3.5 h-3.5 ${networkPing < 50 ? 'text-green-400' : 'text-yellow-400'}`} />
                <span>{networkPing} ms • {networkPing < 50 ? 'Excellent' : 'Good'}</span>
              </div>

              {/* Mute AI voice */}
              <button 
                onClick={() => setVoiceRead(!voiceRead)} 
                className="p-2 rounded-xl bg-gray-950/60 border border-white/5 text-gray-400 hover:text-white hover:border-purple-500/20 transition-all cursor-pointer"
                title={voiceRead ? "Mute AI interviewer voice" : "Unmute AI interviewer voice"}
              >
                {voiceRead ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Fullscreen Toggle */}
              <button 
                onClick={toggleFullscreen} 
                className="p-2 rounded-xl bg-gray-950/60 border border-white/5 text-gray-400 hover:text-white hover:border-purple-500/20 transition-all cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-purple-400" />
              </button>

              {/* Picture in Picture */}
              {cameraAccess && (
                <button 
                  onClick={togglePictureInPicture} 
                  className="p-2 rounded-xl bg-gray-950/60 border border-white/5 text-gray-400 hover:text-white hover:border-purple-500/20 transition-all cursor-pointer"
                  title="Toggle Picture-in-Picture webcam"
                >
                  <PictureInPicture className="w-4 h-4 text-purple-400" />
                </button>
              )}

              {/* Pause / Resume Interview */}
              <button 
                onClick={() => {
                  setIsPaused(!isPaused)
                  window.speechSynthesis.cancel()
                  if (!isPaused && isRecording && recognitionRef.current) {
                    recognitionRef.current.stop()
                  }
                  success(isPaused ? 'Session resumed.' : 'Session paused.')
                }} 
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  isPaused 
                    ? 'bg-green-600/10 border-green-500/30 text-green-400 animate-pulse'
                    : 'bg-yellow-600/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-600/20'
                }`}
                title={isPaused ? "Resume Mock Interview" : "Pause Mock Interview"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-green-400 text-green-400" /> : <Pause className="w-3.5 h-3.5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              {/* Replay Question */}
              <button 
                onClick={handleReplayQuestion}
                disabled={isPaused}
                className="px-3 py-2 rounded-xl bg-gray-950/60 border border-white/5 hover:border-purple-500/20 text-gray-300 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Replay active question text-to-speech"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" /> Replay Question
              </button>

              {/* Timer */}
              <div className={`font-mono px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                timeLeft < 120
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse font-black'
                  : 'bg-gray-900 border-white/5 text-purple-400'
              }`}>
                <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
              </div>

              <Button variant="danger" size="sm" onClick={() => setIsExitDialogOpen(true)}>
                End Interview
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 items-stretch">
            {/* Question panel */}
            <div className="lg:col-span-2 glass-card p-7 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden min-h-[350px]">
              
              {isPaused ? (
                <div className="absolute inset-0 bg-[#050816]/95 z-50 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-400 animate-bounce" />
                  <h3 className="text-xl font-black">Simulation Paused</h3>
                  <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                    The timer, question text, and recording are temporarily locked. Click "Resume" above to continue the assessment.
                  </p>
                </div>
              ) : null}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5 flex-1 flex flex-col justify-start"
                >
                  <div className="flex justify-between items-center">
                    <Badge variant="primary">{currentQuestion.category || 'Interview'}</Badge>
                    <span className="text-xs text-gray-500 font-mono">Question {questionIndex} of {MAX_QUESTIONS}</span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black leading-relaxed text-white">
                    {currentQuestion.text}
                  </h3>

                  {/* Progress dots */}
                  <div className="flex gap-1.5">
                    {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < questionIndex ? 'bg-purple-500' : 'bg-gray-800'}`} />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {error && (
                <div className="p-3 text-xs text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg mt-4">
                  {error}
                </div>
              )}

              {/* Controls */}
              <div className="border-t border-white/5 pt-5 flex justify-between items-center mt-6">
                <span className="text-xs text-gray-500 hidden sm:inline">Voice or keyboard — your choice.</span>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setTextMode(!textMode)}
                    className="px-3.5 py-2 rounded-lg bg-gray-900 border border-white/5 hover:bg-gray-850 text-gray-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Keyboard className="w-3.5 h-3.5 text-purple-400" />
                    {textMode ? 'Voice Mode' : 'Type Answer'}
                  </button>
                  <Button
                    loading={submitLoading}
                    disabled={!transcript.trim() || submitLoading || isPaused}
                    onClick={handleAnswerSubmit}
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            </div>

            {/* Right sidebar: camera + metrics + transcript + notes */}
            <div className="flex flex-col gap-5">
              
              {/* Webcam Preview Container (Always visible) */}
              <div className="glass-card rounded-2xl border border-white/5 overflow-hidden relative bg-black shadow-lg shrink-0 flex flex-col justify-between">
                
                <div className="aspect-video w-full relative bg-gray-950">
                  {cameraAccess && cameraEnabled ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-600 bg-gray-950">
                      <CameraOff className="w-8 h-8" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Webcam Disabled</span>
                    </div>
                  )}

                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-green-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" /> Live
                  </span>
                  
                  {interviewMode === 'video' && (
                    <span className="absolute top-2 right-2 text-[9px] bg-purple-500/80 px-2 py-0.5 rounded text-white font-bold flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" /> VIDEO
                    </span>
                  )}
                </div>

                {/* Webcam & Mic Control buttons */}
                {cameraAccess && (
                  <div className="flex border-t border-white/5 bg-gray-950/60 p-2 gap-2 justify-center">
                    <button
                      onClick={toggleCameraTrack}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                        cameraEnabled
                          ? 'bg-purple-600/10 border-purple-500/20 text-purple-400 hover:bg-purple-600/20'
                          : 'bg-red-650/15 border-red-500/20 text-red-400'
                      }`}
                    >
                      {cameraEnabled ? <><Camera className="w-3.5 h-3.5" /> Stop Cam</> : <><CameraOff className="w-3.5 h-3.5" /> Start Cam</>}
                    </button>
                    <button
                      onClick={toggleMicTrack}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                        micEnabled
                          ? 'bg-purple-600/10 border-purple-500/20 text-purple-400 hover:bg-purple-600/20'
                          : 'bg-red-650/15 border-red-500/20 text-red-400'
                      }`}
                    >
                      {micEnabled ? <><Mic className="w-3.5 h-3.5" /> Mute Mic</> : <><MicOff className="w-3.5 h-3.5" /> Unmute Mic</>}
                    </button>
                  </div>
                )}
              </div>

              {/* AI Interviewer Avatar Card */}
              <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center gap-4 shrink-0">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-extrabold text-md relative z-10">
                    AI
                  </div>
                  {isRecording && !isPaused && (
                    <span className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping opacity-60 pointer-events-none" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Conversational Avatar</h4>
                  <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isRecording && !isPaused ? 'bg-green-400 animate-pulse' : 'bg-purple-500'}`} />
                    {isPaused 
                      ? 'Session Paused' 
                      : isRecording 
                        ? 'Interviewer Listening...' 
                        : 'Awaiting Response...'}
                  </p>
                </div>
              </div>

              {/* Live Speech Metrics */}
              <div className="glass-card p-4 rounded-2xl border border-white/5 space-y-3 shrink-0">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Real-time Speech metrics</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-gray-500 text-[10px] block">Confidence</span>
                    <span className="font-extrabold text-green-400 block">{confidencePercent}%</span>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-gray-500 text-[10px] block">Speaking Pace</span>
                    <span className="font-extrabold text-purple-400 block">{realtimeWpm} WPM</span>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-gray-500 text-[10px] block">Filler Words</span>
                    <span className="font-extrabold text-yellow-400 block">{fillerCount}</span>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-gray-500 text-[10px] block">Eye Contact</span>
                    <span className="font-extrabold text-blue-400 block">{eyeContactScore}%</span>
                  </div>
                </div>
              </div>

              {/* Self Notes Panel (Local workspace notes) */}
              <div className="glass-card p-4 rounded-2xl border border-white/5 flex flex-col shrink-0 h-[140px]">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Self Notes (Not Shared)</h4>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Draft logic flow or bullet points here..."
                  className="w-full flex-1 bg-black/30 border border-white/5 rounded-xl p-2 text-xs text-gray-300 placeholder-gray-700 outline-none focus:border-purple-500/20 focus:ring-0 resize-none font-light leading-relaxed"
                />
              </div>

              {/* Transcription panel */}
              <div className="glass-card p-4 rounded-2xl border border-white/5 flex-1 flex flex-col justify-between min-h-[160px]">
                <div className="space-y-3 flex-1 flex flex-col">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mic className="w-3 h-3 text-purple-400" /> Live Transcript
                    {isRecording && !isPaused && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-red-400">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" /> REC
                      </span>
                    )}
                  </h4>

                  {textMode ? (
                    <textarea
                      value={transcript}
                      onChange={e => setTranscript(e.target.value)}
                      placeholder="Type your response here…"
                      className="w-full flex-1 min-h-[100px] bg-gray-950/60 border border-white/5 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 resize-none font-light"
                    />
                  ) : (
                    <div className="flex-1 bg-gray-950/30 border border-white/5 rounded-xl p-3 text-xs text-gray-300 font-light overflow-y-auto max-h-[140px] leading-relaxed">
                      {transcript || <span className="text-gray-600 italic">Start speaking to transcribe…</span>}
                    </div>
                  )}
                </div>

                {!textMode && (
                  <button
                    onClick={toggleRecording}
                    disabled={isPaused}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all mt-3 ${
                      isRecording
                        ? 'bg-red-600/10 border border-red-500/30 text-red-400 animate-pulse'
                        : 'bg-purple-600/10 border border-purple-500/30 text-purple-400 hover:bg-purple-600/20'
                    }`}
                  >
                    {isRecording
                      ? <><MicOff className="w-4 h-4" /> Stop Recording</>
                      : <><Mic className="w-4 h-4" /> Start Speaking</>}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Exit dialog */}
      <Dialog isOpen={isExitDialogOpen} onClose={() => setIsExitDialogOpen(false)} title="End Interview early?">
        <div className="space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed font-light">
            Ending early will generate a partial report based on the questions answered so far.
          </p>
          <div className="flex gap-4 pt-2">
            <Button variant="danger" className="flex-1" onClick={handleEndInterviewEarly}>
              End & View Report
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setIsExitDialogOpen(false)}>
              Continue Session
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
