import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarClock, ArrowLeft, Loader2, ChevronRight, Award, Clock,
  Search, Filter, ShieldAlert, BadgeInfo, Play, ArrowRight
} from 'lucide-react'
import apiClient from '../services/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Sidebar, MobileMenuButton } from '../components/layout/Sidebar'

interface InterviewSummary {
  id: number
  type: string
  difficulty: string
  score: number | null
  status: string
  created_at: string
  job_role?: string
  mode?: string
}

export const History: React.FC = () => {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState<InterviewSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterMode, setFilterMode] = useState('all')

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await apiClient.get('/interviews')
        setInterviews(res.data ?? [])
      } catch (err) {
        console.error('Failed to load history list:', err)
        setError('Unable to load mock interview history records.')
      } finally {
        setLoading(false)
      }
    }
    fetchInterviews()
  }, [])

  // Filter logic
  const filtered = interviews.filter(item => {
    const matchesSearch = item.job_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || item.type.toLowerCase() === filterType.toLowerCase()
    const matchesDiff = filterDifficulty === 'all' || item.difficulty.toLowerCase() === filterDifficulty.toLowerCase()
    const matchesMode = filterMode === 'all' || (item.mode || 'voice').toLowerCase() === filterMode.toLowerCase()
    return matchesSearch && matchesType && matchesDiff && matchesMode
  })

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
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    Mock Interview History <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-normal">{interviews.length} Sessions</span>
                  </h1>
                  <p className="text-gray-400 text-xs mt-1">Review all your previous AI practice sessions, logic ratings, and roadmaps.</p>
                </div>
                <Link to="/interview/setup">
                  <Button size="sm" icon={<Play className="w-4 h-4" />}>Start New Interview</Button>
                </Link>
              </header>

              {error && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* Filters Block */}
              <Card className="p-5 border-white/5 bg-[#0d1226]/40 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative col-span-1 sm:col-span-2">
                    <Search className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by job role or category..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all font-light"
                    />
                  </div>

                  {/* Filter Type */}
                  <div className="relative">
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="w-full bg-gray-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="technical">Technical</option>
                      <option value="hr">HR Behavioral</option>
                      <option value="mixed">Mixed Round</option>
                      <option value="coding">Coding Challenge</option>
                    </select>
                    <Filter className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Filter Difficulty */}
                  <div className="relative">
                    <select
                      value={filterDifficulty}
                      onChange={e => setFilterDifficulty(e.target.value)}
                      className="w-full bg-gray-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <Filter className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </Card>

              {/* Listings */}
              {filtered.length > 0 ? (
                <div className="space-y-4">
                  {filtered.map(item => {
                    const isCompleted = item.status === 'completed' && (item.score || 0) > 0
                    const scoreColor = (item.score || 0) >= 80 ? 'text-green-400' : (item.score || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(isCompleted ? `/report?id=${item.id}` : `/interview/live?id=${item.id}`)}
                        className="glass-card p-5 rounded-2xl border border-white/5 bg-[#0d1226]/20 hover:border-purple-500/30 transition-all cursor-pointer flex justify-between items-center group"
                      >
                        <div className="flex gap-4 items-center">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                            isCompleted ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                          }`}>
                            {isCompleted ? <Award className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="primary" className="text-[10px] capitalize">{item.type}</Badge>
                              <span className="text-[10px] text-gray-500 font-mono">#{item.id}</span>
                              <span className="text-[10px] text-gray-600">•</span>
                              <span className="text-[10px] text-gray-500 font-mono">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-sm font-bold text-white capitalize group-hover:text-purple-400 transition-colors">
                              {item.job_role || `${item.type} Interview`}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 capitalize">
                              <span>Difficulty: <strong className="text-gray-400 font-semibold">{item.difficulty}</strong></span>
                              <span>•</span>
                              <span>Mode: <strong className="text-gray-400 font-semibold">{item.mode || 'voice'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {isCompleted ? (
                              <>
                                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Score</span>
                                <span className={`text-sm font-extrabold ${scoreColor}`}>{Math.round(item.score!)}%</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[9px] text-yellow-500 block uppercase font-bold tracking-wider animate-pulse">Incomplete</span>
                                <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5 mt-0.5">Resume Room <ArrowRight className="w-3 h-3" /></span>
                              </>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Card className="p-12 text-center border-white/5 bg-[#101828]/10 space-y-4">
                  <BadgeInfo className="w-10 h-10 text-gray-600 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-white">No Mock Records Found</h4>
                    <p className="text-xs text-gray-500 font-light mt-1 max-w-sm mx-auto">
                      Adjust your search or category filters, or launch your very first practice round today.
                    </p>
                  </div>
                  <Link to="/interview/setup" className="inline-block mt-2">
                    <Button size="sm">Configure Interview Setup</Button>
                  </Link>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
