import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, Loader2, AlertCircle, 
  CheckCircle2, HelpCircle, ShieldAlert, Award, Compass, BookOpen
} from 'lucide-react'
import apiClient from '../services/api'
import { useToast } from '../context/ToastContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Sidebar } from '../components/layout/Sidebar'

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

export const SocialAnalyzer: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast()

  const [activeTab, setActiveTab] = useState<'linkedin' | 'github'>('linkedin')
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)

  // LinkedIn Analysis Results state
  const [liScore, setLiScore] = useState<number | null>(null)
  const [liHeadline, setLiHeadline] = useState('')
  const [liSummary, setLiSummary] = useState('')
  const [liMissing, setLiMissing] = useState<string[]>([])
  const [liSuggestions, setLiSuggestions] = useState<string[]>([])

  // GitHub Analysis Results state
  const [ghScore, setGhScore] = useState<number | null>(null)
  const [ghRepos, setGhRepos] = useState<string[]>([])
  const [ghReadme, setGhReadme] = useState('')
  const [ghCommit, setGhCommit] = useState('')
  const [ghSuggestions, setGhSuggestions] = useState<string[]>([])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setLoading(true)
    try {
      if (activeTab === 'linkedin') {
        // Reset old LinkedIn metrics
        setLiScore(null)
        const res = await apiClient.post('/placement/linkedin', { url: urlInput })
        const data = res.data
        setLiScore(data.score)
        setLiHeadline(data.headline_suggestion || '')
        setLiSummary(data.summary_suggestion || '')
        setLiMissing(data.missing_sections || [])
        setLiSuggestions(data.suggestions || [])
        toastSuccess('LinkedIn profile parsed successfully!')
      } else {
        // Reset old GitHub metrics
        setGhScore(null)
        const res = await apiClient.post('/placement/github', { url: urlInput })
        const data = res.data
        setGhScore(data.score)
        setGhRepos(data.repos_analyzed || [])
        setGhReadme(data.readme_quality || '')
        setGhCommit(data.commit_activity_feedback || '')
        setGhSuggestions(data.portfolio_suggestions || [])
        toastSuccess('GitHub repositories audited successfully!')
      }
    } catch (err) {
      toastError('Failed to run profile index audit.')
    } finally {
      setLoading(false)
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
              <h1 className="text-2xl font-extrabold tracking-tight">Social Profile Optimizer</h1>
            </div>
          </header>

          {/* Mode Switch Tabs */}
          <div className="flex bg-gray-950/80 border border-white/5 p-0.5 rounded-xl text-xs max-w-sm">
            <button
              onClick={() => { setActiveTab('linkedin'); setUrlInput(''); setLoading(false) }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-center flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeTab === 'linkedin' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Linkedin className="w-4 h-4" /> LinkedIn Analyzer
            </button>
            <button
              onClick={() => { setActiveTab('github'); setUrlInput(''); setLoading(false) }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-center flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeTab === 'github' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Github className="w-4 h-4" /> GitHub Portfolio
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: paste form */}
            <div className="space-y-6">
              <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider block">
                      {activeTab === 'linkedin' ? 'Profile URL Link' : 'GitHub User URL'}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                      Our parser processes layout configurations to verify tech alignments.
                    </p>
                  </div>
                  <Input
                    label=""
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder={activeTab === 'linkedin' ? 'https://linkedin.com/in/username' : 'https://github.com/username'}
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    loading={loading}
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    Analyze Assets
                  </Button>
                </form>
              </Card>

              {/* Help tip */}
              <Card className="p-4 border-indigo-500/10 bg-[#0d1226]/20 flex items-start gap-2.5 text-[10px] text-gray-400 leading-relaxed font-light">
                <HelpCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <div>
                  <strong>Why verify social indices?</strong> Recruiters verify Github repository commit consistency and check LinkedIn Taglines first. An optimized dashboard boosts response metrics by up to 40%.
                </div>
              </Card>
            </div>

            {/* Right: Results dashboards */}
            <div className="lg:col-span-2 space-y-6">
              {/* --- LinkedIn Results --- */}
              {activeTab === 'linkedin' && liScore !== null && (
                <div className="space-y-6">
                  {/* Gauge card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5 border-white/5 bg-[#0d1226]/40 text-center flex flex-col justify-center items-center h-36">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Profile Score</span>
                      <div className="relative w-16 h-16 rounded-full border-4 border-purple-500/20 flex items-center justify-center">
                        <span className="text-lg font-black text-white">{liScore}%</span>
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent" />
                      </div>
                    </Card>
                    <Card className="p-5 border-white/5 bg-[#0d1226]/40 text-center col-span-2 flex flex-col justify-center items-start h-36 space-y-1">
                      <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Status Ready</span>
                      <h4 className="text-xs font-bold text-white">Profile calibrated successfully</h4>
                      <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                        Your headline matches target roles. Implement Suggestions below to max out search visibility.
                      </p>
                    </Card>
                  </div>

                  {/* Suggestions Detail */}
                  <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-5">
                    {liHeadline && (
                      <div className="space-y-1.5 border-b border-white/5 pb-4">
                        <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">Tagline/Headline Critique</span>
                        <p className="text-xs text-gray-300 italic">"{liHeadline}"</p>
                      </div>
                    )}

                    {liSummary && (
                      <div className="space-y-1.5 border-b border-white/5 pb-4">
                        <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">Summary Biography Review</span>
                        <p className="text-xs text-gray-300 font-light leading-relaxed">{liSummary}</p>
                      </div>
                    )}

                    {liMissing.length > 0 && (
                      <div className="space-y-2 border-b border-white/5 pb-4">
                        <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider block">Missing Bio Sections</span>
                        <div className="flex flex-wrap gap-1.5">
                          {liMissing.map((m, i) => (
                            <span key={i} className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {liSuggestions.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider block">Optimization Steps Checklist</span>
                        <div className="space-y-2 text-xs font-light">
                          {liSuggestions.map((s, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                              <p className="text-gray-300 leading-relaxed">{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* --- GitHub Results --- */}
              {activeTab === 'github' && ghScore !== null && (
                <div className="space-y-6">
                  {/* Gauge card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5 border-white/5 bg-[#0d1226]/40 text-center flex flex-col justify-center items-center h-36">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-2">GitHub Index</span>
                      <div className="relative w-16 h-16 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                        <span className="text-lg font-black text-white">{ghScore}%</span>
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent" />
                      </div>
                    </Card>
                    <Card className="p-5 border-white/5 bg-[#0d1226]/40 text-center col-span-2 flex flex-col justify-center items-start h-36 space-y-1">
                      <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Audited</span>
                      <h4 className="text-xs font-bold text-white">Repository checklist compiled</h4>
                      <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                        Analyzed code architectures. Verify repository details below.
                      </p>
                    </Card>
                  </div>

                  {/* Suggestions Detail */}
                  <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-5">
                    {ghRepos.length > 0 && (
                      <div className="space-y-2 border-b border-white/5 pb-4">
                        <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider block">Audited Repositories</span>
                        <div className="flex flex-wrap gap-1.5">
                          {ghRepos.map((r, i) => (
                            <span key={i} className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {ghReadme && (
                      <div className="space-y-1.5 border-b border-white/5 pb-4">
                        <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Documentation Critique
                        </span>
                        <p className="text-xs text-gray-300 font-light leading-relaxed">{ghReadme}</p>
                      </div>
                    )}

                    {ghCommit && (
                      <div className="space-y-1.5 border-b border-white/5 pb-4">
                        <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5" /> Contribution Activity Metrics
                        </span>
                        <p className="text-xs text-gray-300 font-light leading-relaxed">{ghCommit}</p>
                      </div>
                    )}

                    {ghSuggestions.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider block">Portfolio Optimization Steps</span>
                        <div className="space-y-2 text-xs font-light">
                          {ghSuggestions.map((s, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                              <p className="text-gray-300 leading-relaxed">{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Empty state when no analysis yet */}
              {((activeTab === 'linkedin' && liScore === null) || (activeTab === 'github' && ghScore === null)) && (
                <Card className="p-12 text-center border-white/5 bg-[#101828]/10 space-y-4 py-24">
                  <AlertCircle className="w-8 h-8 text-gray-600 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Waiting for inputs</h4>
                    <p className="text-[10px] text-gray-500 font-light mt-1 max-w-xs mx-auto leading-relaxed">
                      Paste a profile url in the form and click analyze to audit your placement credentials.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
