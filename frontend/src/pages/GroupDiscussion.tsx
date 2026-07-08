import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, Send, Sparkles, AlertCircle, Loader2,
  Users, CheckCircle2, Award, Info, RefreshCw
} from 'lucide-react'
import apiClient from '../services/api'
import { useToast } from '../context/ToastContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Sidebar } from '../components/layout/Sidebar'

interface ChatMessage {
  speaker: string
  text: string
  isUser?: boolean
}

export const GroupDiscussion: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast()

  const [topic, setTopic] = useState('Generative AI Impact on Software Engineering Careers')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  // Input controls
  const [inputMsg, setInputMsg] = useState('')
  const [loadingTurn, setLoadingTurn] = useState(false)
  const [evaluationLoading, setEvaluationLoading] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)

  // Evaluation Metrics states
  const [confidence, setConfidence] = useState<number | null>(null)
  const [leadership, setLeadership] = useState<number | null>(null)
  const [communication, setCommunication] = useState<number | null>(null)
  const [relevance, setRelevance] = useState<number | null>(null)
  const [vocabulary, setVocabulary] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startSession = async () => {
    setMessages([])
    setSessionActive(true)
    setConfidence(null)
    setLoadingTurn(true)

    // Push initial Moderator message to kickoff discussion
    const initialText = `Welcome back everyone. Today we are exploring the topic: '${topic}'. Let's start with how generative AI tooling shifts our day-to-day work patterns. Candidate, what is your initial perspective?`
    setMessages([{ speaker: 'Moderator', text: initialText }])
    setLoadingTurn(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim()) return

    const userMsg = inputMsg.trim()
    setInputMsg('')

    // Append user turn
    const updatedMsgs = [...messages, { speaker: 'Candidate', text: userMsg, isUser: true }]
    setMessages(updatedMsgs)
    setLoadingTurn(true)

    try {
      // Fetch bot turn
      const res = await apiClient.post('/placement/discussion/chat', {
        topic,
        history: updatedMsgs.map(m => ({ speaker: m.speaker, text: m.text }))
      })

      setMessages(prev => [...prev, { speaker: res.data.bot_name, text: res.data.text }])
    } catch {
      toastError('Failed to retrieve bot response.')
      setMessages(prev => [...prev, { speaker: 'Moderator', text: 'Please check your connection and repeat your input.' }])
    } finally {
      setLoadingTurn(false)
    }
  }

  const handleEvaluate = async () => {
    if (messages.length < 2) return
    setEvaluationLoading(true)
    try {
      const res = await apiClient.post('/placement/discussion/evaluate', {
        topic,
        history: messages.map(m => ({ speaker: m.speaker, text: m.text }))
      })

      const evalData = res.data
      setConfidence(evalData.confidence)
      setLeadership(evalData.leadership)
      setCommunication(evalData.communication)
      setRelevance(evalData.relevance)
      setVocabulary(evalData.vocabulary)
      setFeedback(evalData.feedback)
      setSessionActive(false)
      toastSuccess('Placement group discussion evaluation score compiled!')
    } catch {
      toastError('Failed to evaluate session.')
    } finally {
      setEvaluationLoading(false)
    }
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
              <h1 className="text-2xl font-extrabold tracking-tight">AI Group Discussion Simulator</h1>
            </div>
            {!sessionActive && (
              <Button onClick={startSession} icon={<RefreshCw className="w-4 h-4" />}>
                Start Simulator
              </Button>
            )}
          </header>

          {!sessionActive && confidence === null ? (
            /* Configure Area */
            <Card className="p-8 border-white/5 bg-[#0d1226]/40 max-w-xl mx-auto text-center space-y-5 py-12">
              <Users className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase">Configure Discussion Topic</h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed">
                  Enter a discussion prompt. AI participants will calibrate to your input topic.
                </p>
              </div>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full bg-gray-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-700 outline-none focus:border-purple-500"
              />
              <Button onClick={startSession} className="w-full">Initiate Discussion Panel</Button>
            </Card>
          ) : (
            /* active simulation board */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Chat Window */}
              <div className="lg:col-span-2 space-y-4 flex flex-col h-[520px]">
                <Card className="flex-1 p-5 border-white/5 bg-black/25 flex flex-col justify-between overflow-hidden relative">
                  {/* Chat bubbles */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 select-text text-xs scrollbar-thin">
                    {messages.map((m, idx) => (
                      <div key={idx} className={`flex flex-col ${m.isUser ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
                          {m.speaker}
                        </span>
                        <div className={`p-3.5 rounded-2xl max-w-sm font-light leading-relaxed ${
                          m.isUser
                            ? 'bg-purple-600 text-white rounded-tr-none'
                            : 'bg-gray-950/90 border border-white/5 text-gray-200 rounded-tl-none'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {loadingTurn && (
                      <div className="flex items-center gap-2 text-[10px] text-purple-400 animate-pulse font-bold mt-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Bot persona typing response...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message Input form */}
                  {sessionActive && (
                    <form onSubmit={handleSendMessage} className="border-t border-white/5 pt-4 flex gap-2.5 mt-3 bg-[#0d1226]/10 shrink-0">
                      <input
                        type="text"
                        value={inputMsg}
                        onChange={e => setInputMsg(e.target.value)}
                        placeholder="Write your input argument here..."
                        className="flex-1 bg-gray-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500 font-light"
                      />
                      <button type="submit" className="p-3 rounded-xl bg-purple-650 hover:bg-purple-600 text-white transition-all cursor-pointer">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </Card>
              </div>

              {/* Right Sidebar stats or completed metrics */}
              <div className="space-y-6">
                {sessionActive && (
                  <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Simulator Actions</h3>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-light">
                      Participate in at least two speech rounds, then click evaluate to fetch granular metrics.
                    </p>
                    <Button
                      onClick={handleEvaluate}
                      className="w-full"
                      loading={evaluationLoading}
                      disabled={messages.length < 2}
                      icon={<Sparkles className="w-4 h-4" />}
                    >
                      Compile evaluation
                    </Button>
                  </Card>
                )}

                {confidence !== null && (
                  <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1 border-b border-white/5 pb-3">
                      <Award className="w-4.5 h-4.5 text-purple-400" /> Evaluation Metrics Score
                    </h3>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold">
                          <span>CONFIDENCE</span>
                          <span className="text-purple-400">{confidence}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-900 border border-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${confidence}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold">
                          <span>LEADERSHIP</span>
                          <span className="text-blue-400">{leadership}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-900 border border-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${leadership}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold">
                          <span>COMMUNICATION</span>
                          <span className="text-green-400">{communication}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-900 border border-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${communication}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold">
                          <span>RELEVANCE</span>
                          <span className="text-yellow-400">{relevance}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-900 border border-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${relevance}%` }} />
                        </div>
                      </div>
                    </div>

                    {feedback && (
                      <div className="p-4 rounded-xl border border-white/5 bg-black/30 text-[10px] text-gray-400 leading-relaxed font-light space-y-1">
                        <strong className="text-white block uppercase tracking-wider font-bold">Critique Feedback</strong>
                        <p>{feedback}</p>
                      </div>
                    )}

                    <Button size="sm" onClick={() => setConfidence(null)} className="w-full">Configure new prompt</Button>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
