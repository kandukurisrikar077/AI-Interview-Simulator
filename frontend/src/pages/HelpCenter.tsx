import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HelpCircle, ArrowLeft, Send, CheckCircle2, ChevronDown, ChevronUp,
  Mail, MessageSquare, AlertTriangle, Loader2
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Sidebar, MobileMenuButton } from '../components/layout/Sidebar'
import { useToast } from '../context/ToastContext'

interface FaqItem {
  q: string
  a: string
}

export const HelpCenter: React.FC = () => {
  const { success: toastSuccess } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Forms state
  const [activeTab, setActiveTab] = useState<'contact' | 'feedback' | 'bug'>('contact')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const faqs: FaqItem[] = [
    {
      q: "How does the AI dynamic question engine formulate questions?",
      a: "Once you upload a resume or input a preferred job role, our generative AI parses tech stacks, projects, and certifications. Questions are dynamically generated to fit your specific background, meaning no two interviews are identical."
    },
    {
      q: "How are the speaking metrics (WPM, filler words) tracked?",
      a: "Verbal mocks utilize the browser's native Web Speech API (SpeechRecognition). While transcribing your responses, the backend computes words-per-minute pacing and audits occurrences of common filler pauses like 'um', 'uh', and 'like'."
    },
    {
      q: "Can I take mock interviews without setting custom API keys?",
      a: "Yes! IntervueAI has server-level keys preconfigured. However, to guarantee uninterrupted access or utilize specific model upgrades (like GPT-4o-mini), you can input your personal API key under settings."
    },
    {
      q: "How is the integrity monitor computed?",
      a: "Our mock rooms use visibility listeners to audit window/tab context switches. Switching tabs or opening dev tools generates high-confidence alerts that are recorded directly in your report dashboard to maintain mock integrity."
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !message) return
    setLoading(true)
    setSuccess(false)
    
    // Simulate support ticket creation
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSuccess(true)
    toastSuccess('Message submitted successfully!')
    setEmail('')
    setSubject('')
    setMessage('')
    setTimeout(() => setSuccess(false), 3500)
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
          <span className="text-sm font-black text-gradient-purple font-sans">IntervueAI</span>
          <div className="w-9" />
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Help Center & FAQs
                </h1>
                <p className="text-gray-400 text-xs mt-1">Get support, report system bugs, or review frequently asked questions.</p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: FAQs */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-6 border-white/5 bg-[#0d1226]/40">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-1.5 border-b border-white/5 pb-4">
                    <HelpCircle className="w-4.5 h-4.5 text-purple-400" /> Frequently Asked Questions
                  </h3>

                  <div className="space-y-3">
                    {faqs.map((faq, idx) => {
                      const expanded = expandedFaq === idx
                      return (
                        <div
                          key={idx}
                          className="border-b border-white/5 last:border-0 pb-3"
                        >
                          <button
                            onClick={() => setExpandedFaq(expanded ? null : idx)}
                            className="w-full text-left py-2 flex justify-between items-center text-xs font-semibold text-gray-200 hover:text-white cursor-pointer"
                          >
                            <span>{faq.q}</span>
                            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                          </button>
                          {expanded && (
                            <p className="text-gray-400 text-[11px] leading-relaxed font-light mt-1.5 whitespace-pre-wrap pl-1.5">
                              {faq.a}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>

              {/* Right Column: Support Form */}
              <div className="space-y-6">
                <Card className="p-6 border-white/5 bg-[#0d1226]/40">
                  <div className="flex bg-gray-950 border border-white/5 rounded-xl p-0.5 text-xs mb-6">
                    <button
                      onClick={() => { setActiveTab('contact'); setSuccess(false) }}
                      className={`flex-1 py-2 rounded-lg font-bold text-[10px] text-center cursor-pointer transition-all ${
                        activeTab === 'contact' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Support
                    </button>
                    <button
                      onClick={() => { setActiveTab('feedback'); setSuccess(false) }}
                      className={`flex-1 py-2 rounded-lg font-bold text-[10px] text-center cursor-pointer transition-all ${
                        activeTab === 'feedback' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Feedback
                    </button>
                    <button
                      onClick={() => { setActiveTab('bug'); setSuccess(false) }}
                      className={`flex-1 py-2 rounded-lg font-bold text-[10px] text-center cursor-pointer transition-all ${
                        activeTab === 'bug' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Bug Report
                    </button>
                  </div>

                  {success && (
                    <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-xs mb-5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {activeTab === 'contact' && 'Support request queued!'}
                        {activeTab === 'feedback' && 'Thank you for your feedback!'}
                        {activeTab === 'bug' && 'Bug report cataloged successfully.'}
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Your Email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@email.com"
                      required
                    />

                    {activeTab !== 'feedback' && (
                      <Input
                        label="Subject"
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="e.g. Mic connection, layout issue"
                      />
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Message Content
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Write details here..."
                        required
                        className="w-full min-h-[100px] bg-gray-950/60 border border-white/10 rounded-xl p-3 text-xs text-gray-200 placeholder-gray-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 resize-none font-light"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      loading={loading}
                      icon={<Send className="w-3.5 h-3.5" />}
                    >
                      Submit Ticket
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
