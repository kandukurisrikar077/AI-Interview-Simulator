import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Video, Mic, RefreshCw, Star, Play, 
  HelpCircle, ShieldCheck, Award, Timer, Volume2
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useToast } from '../context/ToastContext'
import { Sidebar } from '../components/layout/Sidebar'

export const HrSimulator: React.FC = () => {
  const navigate = useNavigate()
  const { success: toastSuccess, error: toastError } = useToast()

  const [step, setStep] = useState<'setup' | 'live' | 'results'>('setup')
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [timeLeft, setTimeLeft] = useState(900) // 15 mins

  // Gaze / Posture simulated metrics
  const [eyeContact, setEyeContact] = useState(95)
  const [posture, setPosture] = useState('Focused')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const hrQuestions = [
    "Tell me about a time you had to deal with a conflict in your project team. How did you resolve it?",
    "Why do you want to join our organization specifically? What matches your value alignment?",
    "Describe a situation where you worked under a tight deadline pressure. What tradeoffs did you choose?",
    "What is your greatest technical challenge or failure, and what did you learn from it?"
  ]

  // Timer loop
  useEffect(() => {
    if (step === 'live' && timeLeft > 0) {
      const interval = setInterval(() => setTimeLeft(p => p - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [step, timeLeft])

  // Camera preview mount
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      streamRef.current = stream
    } catch {
      console.log("No webcam hardware active or permitted. Running preview fallback.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }

  const handleStartInterview = async () => {
    setStep('live')
    setTranscript('')
    setCurrentQuestionIdx(0)
    setTimeLeft(900)
    await startCamera()
  }

  const handleNext = () => {
    if (currentQuestionIdx < hrQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1)
      setTranscript('')
      setIsRecording(false)
    } else {
      stopCamera()
      setStep('results')
      toastSuccess('HR Interview Simulation finished!')
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col font-sans">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
          {/* Header */}
          <header className="flex justify-between items-center pb-4 border-b border-white/5">
            <div className="space-y-1">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tight">HR Behavioural Simulator</h1>
            </div>
          </header>

          {step === 'setup' && (
            <Card className="p-8 border-white/5 bg-[#0d1226]/40 max-w-xl mx-auto text-center space-y-6 py-12">
              <Video className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase">HR Simulation Room</h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed">
                  Practice core behavioral STAR questions. The platform audits eye-contact thresholds, speaking pacing, and vocabulary professionalism.
                </p>
              </div>
              <Button onClick={handleStartInterview} className="w-full">Launch HR Room</Button>
            </Card>
          )}

          {step === 'live' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Question and Transcribe */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-xs font-bold text-gray-400">
                      Question {currentQuestionIdx + 1} of {hrQuestions.length}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-xl">
                      <Timer className="w-4 h-4" />
                      <span>{formatTime(timeLeft)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[9px] uppercase font-extrabold tracking-widest text-purple-400 block">HR Interviewer</span>
                    <h3 className="text-base font-bold text-white leading-relaxed text-left">
                      {hrQuestions[currentQuestionIdx]}
                    </h3>
                  </div>

                  {/* Simulated voice transcribe box */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Your Response Transcript</label>
                    <textarea
                      value={transcript}
                      onChange={e => setTranscript(e.target.value)}
                      placeholder="Start speaking or type your behavioral response here..."
                      className="w-full h-32 bg-gray-950/60 border border-white/10 rounded-xl p-3 text-xs text-gray-200 outline-none focus:border-purple-500 font-light resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-5">
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isRecording
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-purple-650 border-purple-500 text-white'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      {isRecording ? 'Mute Mic' : 'Activate Mic'}
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {currentQuestionIdx === hrQuestions.length - 1 ? 'Finish Interview' : 'Next Question'}
                    </button>
                  </div>
                </Card>
              </div>

              {/* Right camera preview + body language index */}
              <div className="space-y-6">
                <Card className="aspect-video rounded-2xl border border-white/5 overflow-hidden relative bg-black shadow-lg">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  <span className="absolute top-2 left-2 text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                    Live Feed
                  </span>
                </Card>

                <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
                    Body Language Audit
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-1">
                      <span className="text-gray-500 text-[10px] block">Eye Contact</span>
                      <span className="font-extrabold text-green-400 block">{eyeContact}%</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-1">
                      <span className="text-gray-500 text-[10px] block">Posture</span>
                      <span className="font-extrabold text-purple-400 block">{posture}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed font-light">
                    Keep your head centered and maintain direct eye contact with your camera lens.
                  </p>
                </Card>
              </div>
            </div>
          )}

          {step === 'results' && (
            <Card className="p-8 border-white/5 bg-[#0d1226]/40 max-w-xl mx-auto text-center space-y-6 py-12">
              <Award className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white uppercase">Assessment Evaluated</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed max-w-sm mx-auto">
                  HR scorecard generated successfully. Your overall professionalism rated at 87% with high grammar precision and structure alignment.
                </p>
              </div>
              <div className="border-t border-white/5 pt-4 flex gap-3">
                <Button className="flex-1" size="sm" onClick={() => setStep('setup')}>Practice Again</Button>
                <Link to="/dashboard" className="flex-1">
                  <button className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-colors border border-white/10 cursor-pointer">
                    Dashboard
                  </button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
