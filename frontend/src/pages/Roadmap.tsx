import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Map, Calendar, BookOpen, AlertCircle, Loader2, CheckCircle2,
  ListTodo, Bookmark, Sparkles, Code, Compass, ArrowRight, Check
} from 'lucide-react'
import apiClient from '../services/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Sidebar, MobileMenuButton } from '../components/layout/Sidebar'

export const Roadmap: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Roadmap Data states
  const [sprintDays, setSprintDays] = useState<string[]>([])
  const [checkpoints, setCheckpoints] = useState<string[]>([])
  const [skillGaps, setSkillGaps] = useState<string[]>([])
  const [recommendedTech, setRecommendedTech] = useState<string[]>([])
  const [resources, setResources] = useState<string[]>([])
  const [sourceTitle, setSourceTitle] = useState('Dynamic Profile Analysis')

  // Checkbox state persisted in localStorage
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        // Attempt to fetch latest completed interview roadmap first, fallback to resume roadmap
        const [interviewRes, resumeRes] = await Promise.allSettled([
          apiClient.get('/interviews'),
          apiClient.get('/resumes/me')
        ])

        let hasData = false

        // Check interviews
        if (interviewRes.status === 'fulfilled') {
          const completed = (interviewRes.value.data ?? []).filter((iv: any) => iv.status === 'completed' && iv.roadmap)
          if (completed.length > 0) {
            const latest = completed[0]
            let rMap = latest.roadmap
            if (typeof rMap === 'string') {
              try { rMap = JSON.parse(rMap) } catch {}
            }
            if (rMap) {
              setSprintDays(rMap.roadmap_7_day || [])
              setCheckpoints(rMap.roadmap_30_day || [])
              setSkillGaps(rMap.skill_gaps || [])
              setRecommendedTech(rMap.recommended_technologies || [])
              setResources(rMap.learning_resources || [])
              setSourceTitle(`Mock Interview Analysis (Session #${latest.id})`)
              hasData = true
            }
          }
        }

        // If no interview data, check resume roadmap
        if (!hasData && resumeRes.status === 'fulfilled' && resumeRes.value.data) {
          const rData = resumeRes.value.data
          let rMap = rData.learning_roadmap
          if (typeof rMap === 'string') {
            try { rMap = JSON.parse(rMap) } catch {}
          }
          if (rMap) {
            setSprintDays(rMap.roadmap_7_day || rMap.sprint_7_day || [])
            setCheckpoints(rMap.roadmap_30_day || rMap.milestones_30_day || [])
            setSkillGaps(rData.missing_skills || rMap.skill_gaps || [])
            setRecommendedTech(rData.role_recommendations?.map((r: any) => r.role) || rMap.recommended_technologies || [])
            setResources(rMap.learning_resources || [])
            setSourceTitle('Resume Intelligence Analysis')
            hasData = true
          }
        }

        // Persistent checklist load
        const stored = localStorage.getItem('roadmap_completed')
        if (stored) {
          setCompletedItems(JSON.parse(stored))
        }
      } catch (err) {
        console.error('Roadmap fetch failure:', err)
        setError('Failed to fetch personal learning roadmap.')
      } finally {
        setLoading(false)
      }
    }
    fetchRoadmap()
  }, [])

  const toggleItem = (key: string) => {
    const updated = { ...completedItems, [key]: !completedItems[key] }
    setCompletedItems(updated)
    localStorage.setItem('roadmap_completed', JSON.stringify(updated))
  }

  // Fallbacks if user has no data yet
  const displaySprintDays = sprintDays.length > 0 ? sprintDays : [
    "Upload your resume to generate a personalized roadmap.",
    "Complete a mock interview to identify technical gaps.",
    "Configure API keys in settings to generate AI questions.",
    "Practice coding challenges in the Monaco workspace.",
    "Track speed and filler words in live voice rounds.",
    "Inspect evaluation feedback to target weak areas.",
    "Download PDF reports for career profile updates."
  ]

  const displayCheckpoints = checkpoints.length > 0 ? checkpoints : [
    "Week 1: Foundations check. Verify core syntax and algorithmic complexity constraints.",
    "Week 2: Advanced designs. Focus on sharding, caching architectures, and scaling.",
    "Week 3: Behavioral calibration. Practice STAR methodologies for HR situations.",
    "Week 4: Live round calibration. Perform mock sessions under time limits."
  ]

  const totalTasks = displaySprintDays.length + displayCheckpoints.length
  const completedCount = Object.keys(completedItems).filter(k => completedItems[k]).length
  const progressPercent = Math.min(100, Math.round((completedCount / totalTasks) * 100))

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
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
                    Learning Roadmap <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-normal">Active</span>
                  </h1>
                  <p className="text-gray-400 text-xs mt-1">Calibrated from: <span className="text-purple-400 font-medium">{sourceTitle}</span></p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="text-[9px] text-gray-500 block uppercase">Roadmap Progress</span>
                    <span className="text-sm font-bold text-white">{progressPercent}% Completed</span>
                  </div>
                  <div className="w-24 h-2 bg-gray-900 border border-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </header>

              {error && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* Skills Gap Analysis */}
              {(skillGaps.length > 0 || recommendedTech.length > 0) && (
                <Card className="p-6 border-white/5 bg-[#0d1226]/40">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Compass className="w-4.5 h-4.5 text-purple-400" /> Competency Gap Index
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-2">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Areas Needing Focus</span>
                      <div className="flex flex-wrap gap-1.5">
                        {skillGaps.map((gap, i) => (
                          <Badge key={i} variant="danger">{gap}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Recommended Tech Expansion</span>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendedTech.map((tech, i) => (
                          <Badge key={i} variant="primary">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Interactive Sprints */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-Day Sprint Checklist */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="p-6 border-white/5 bg-[#0d1226]/40">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-4 flex items-center gap-1.5">
                      <ListTodo className="w-4.5 h-4.5 text-indigo-400" /> 7-Day Sprint Roadmap
                    </h3>
                    <div className="space-y-4">
                      {displaySprintDays.map((step, idx) => {
                        const key = `sprint-${idx}`
                        const done = !!completedItems[key]
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleItem(key)}
                            className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                              done
                                ? 'border-green-500/10 bg-green-500/2 opacity-70'
                                : 'border-white/5 bg-black/20 hover:border-white/10'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                              done
                                ? 'bg-green-500 border-green-400 text-white'
                                : 'border-white/10 bg-white/5 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block">Day {idx + 1}</span>
                              <p className={`text-xs leading-relaxed font-light ${done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                {step}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* 30-Day Checkpoint */}
                  <Card className="p-6 border-white/5 bg-[#0d1226]/40">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-4 flex items-center gap-1.5">
                      <Calendar className="w-4.5 h-4.5 text-fuchsia-400" /> 30-Day Milestone Checklist
                    </h3>
                    <div className="space-y-4">
                      {displayCheckpoints.map((step, idx) => {
                        const key = `milestone-${idx}`
                        const done = !!completedItems[key]
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleItem(key)}
                            className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                              done
                                ? 'border-green-500/10 bg-green-500/2 opacity-70'
                                : 'border-white/5 bg-black/20 hover:border-white/10'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                              done
                                ? 'bg-green-500 border-green-400 text-white'
                                : 'border-white/10 bg-white/5 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Checkpoint Week {idx + 1}</span>
                              <p className={`text-xs leading-relaxed font-light ${done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                {step}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </div>

                {/* Sidebar study resources */}
                <div className="space-y-6">
                  <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4.5 h-4.5 text-pink-400" /> Suggested Resources
                    </h3>
                    <div className="space-y-4 text-xs font-light leading-relaxed">
                      {resources.length > 0 ? (
                        resources.map((res, i) => (
                          <div key={i} className="flex gap-2 items-start border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <Bookmark className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                            <p className="text-gray-300">{res}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-600 text-xs italic">
                          No direct textbooks mapped. Try reading system design sharding structures and Leetcode recursion patterns.
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6 border border-white/5 bg-[#0d1226]/20 text-center space-y-4">
                    <Sparkles className="w-8 h-8 text-yellow-400 mx-auto animate-pulse" />
                    <h4 className="text-xs font-bold text-white uppercase">Practice Mock Interviews</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-light">
                      Mock sessions automatically calibrate this roadmap for your profile targets.
                    </p>
                    <Link to="/interview/setup" className="block">
                      <button className="w-full py-2.5 rounded-xl bg-purple-650 hover:bg-purple-600 font-bold text-xs text-white transition-all cursor-pointer flex items-center justify-center gap-1">
                        Enter Room <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
