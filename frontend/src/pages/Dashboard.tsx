import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusCircle, FileText, BarChart3, Clock, Brain, TrendingUp,
  CheckCircle2, Circle, ChevronRight, Mic, User, Sparkles,
  ArrowRight, BookOpen, Trophy, Target, Calendar, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../services/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SkeletonLoader } from '../components/ui/SkeletonLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { Sidebar, MobileMenuButton } from '../components/layout/Sidebar'

// ─── Onboarding Step Config ────────────────────────────────────────────────────
interface OnboardingStep {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  href: string
  cta: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    label: 'Complete Profile',
    description: 'Add your name, education, target role and skills.',
    icon: <User className="w-4 h-4" />,
    href: '/profile',
    cta: 'Go to Profile'
  },
  {
    id: 'upload',
    label: 'Upload Resume',
    description: 'Upload your PDF or DOCX resume for AI analysis.',
    icon: <FileText className="w-4 h-4" />,
    href: '/resume',
    cta: 'Upload Resume'
  },
  {
    id: 'interview',
    label: 'Take First Mock Interview',
    description: 'Start your first AI-powered practice session.',
    icon: <Mic className="w-4 h-4" />,
    href: '/interview/setup',
    cta: 'Start Interview'
  }
]

interface InterviewSummary {
  id: number
  type: string
  difficulty: string
  score: number
  status: string
  created_at: string
}

interface ResumeInfo {
  id: number
  file_path?: string
  uploaded_at?: string
  resume_score?: number
  ats_score?: number
  skills?: string[]
  weaknesses?: string[]
  role_recommendations?: Array<{ role: string; match_percentage: number }>
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [interviews, setInterviews] = useState<InterviewSummary[]>([])
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fetch real data on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [interviewRes, resumeRes] = await Promise.allSettled([
          apiClient.get('/interviews'),
          apiClient.get('/resumes/me')
        ])

        if (interviewRes.status === 'fulfilled') {
          setInterviews(interviewRes.value.data ?? [])
        }
        if (resumeRes.status === 'fulfilled') {
          setResumeInfo(resumeRes.value.data ?? null)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard content', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Onboarding steps completion checks
  const hasProfile = !!user?.profile_completed
  const hasResume = !!resumeInfo?.file_path
  const hasInterview = interviews.some((i) => i.status === 'completed' || i.score > 0)

  const stepStatus: Record<string, boolean> = {
    profile: hasProfile,
    upload: hasResume,
    interview: hasInterview
  }

  const completedCount = Object.values(stepStatus).filter(Boolean).length
  const progressPercent = Math.round((completedCount / ONBOARDING_STEPS.length) * 100)
  const onboardingFinished = hasProfile && hasResume

  // Profile Completion Percent calculation (11 core fields)
  const totalProfileFields = 11
  let filledFields = 0
  if (user?.full_name) filledFields++
  if (user?.phone_number) filledFields++
  if (user?.country) filledFields++
  if (user?.city) filledFields++
  if (user?.college) filledFields++
  if (user?.degree) filledFields++
  if (user?.branch) filledFields++
  if (user?.graduation_year) filledFields++
  if (user?.current_status) filledFields++
  if (user?.preferred_role) filledFields++
  if (user?.skills_tags && user.skills_tags.length > 0) filledFields++
  const profileCompletionPercent = Math.round((filledFields / totalProfileFields) * 100)

  // Interview Readiness rating calculation
  // Factors: Profile completed + ATS Score + completed interviews
  const atsFactor = resumeInfo?.ats_score || 0
  const interviewBonus = hasInterview ? 25 : 0
  const readinessScore = Math.min(
    Math.round((profileCompletionPercent * 0.3) + (atsFactor * 0.5) + interviewBonus),
    100
  )

  const completedInterviews = interviews.filter((i) => i.score > 0)
  const averageScore =
    completedInterviews.length > 0
      ? Math.round(completedInterviews.reduce((a, c) => a + c.score, 0) / completedInterviews.length)
      : null

  const firstName = user?.full_name?.split(' ')[0] || 'there'

  // Extract recommended role from resume Recommendations
  const recommendedRole = resumeInfo?.role_recommendations && resumeInfo.role_recommendations.length > 0
    ? resumeInfo.role_recommendations[0].role
    : user?.preferred_role || 'Not Analyzed'

  // Extract weak skills from weaknesses list
  const weakSkills = resumeInfo?.weaknesses && resumeInfo.weaknesses.length > 0
    ? resumeInfo.weaknesses.slice(0, 3).map(w => w.replace(/^❌\s*/, ''))
    : []

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/5">
          <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
          <span className="text-sm font-black text-gradient-purple">IntervueAI</span>
          <div className="w-9" />
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {loading ? (
            <div className="space-y-8 max-w-5xl mx-auto">
              <SkeletonLoader variant="text" count={2} />
              <SkeletonLoader variant="card" count={4} />
              <SkeletonLoader variant="list" count={3} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-5xl mx-auto"
            >
              {/* Welcome Header */}
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    Welcome, {firstName} 👋
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {onboardingFinished
                      ? 'Your profile & resume are fully analyzed. Keep practicing to perfect your interview performance!'
                      : 'Let\'s get you interview-ready. Complete the profile & resume checkpoints to begin.'}
                  </p>
                </div>
                {onboardingFinished && (
                  <Link to="/interview/setup">
                    <Button icon={<PlusCircle className="w-4.5 h-4.5" />} iconPosition="left">
                      New Interview
                    </Button>
                  </Link>
                )}
              </header>

              {/* ── CASE A: RESUME NOT UPLOADED — ONBOARDING STEPS ── */}
              {!hasResume ? (
                <div className="space-y-8">
                  {/* Onboarding steps card */}
                  <Card className="p-6 border border-white/5 bg-[#0d1226]/60 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs">Onboarding Steps</h2>
                        <p className="text-xs text-gray-500 mt-1">{completedCount} of {ONBOARDING_STEPS.length} steps completed</p>
                      </div>
                      <span className="text-base font-bold text-purple-400">{progressPercent}%</span>
                    </div>

                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="space-y-3">
                      {ONBOARDING_STEPS.map((step, idx) => {
                        const done = stepStatus[step.id]
                        const prevDone = idx === 0 || stepStatus[ONBOARDING_STEPS[idx - 1].id]
                        const isCurrent = !done && prevDone

                        return (
                          <div
                            key={step.id}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                              isCurrent
                                ? 'border-purple-500/30 bg-purple-500/5'
                                : done
                                  ? 'border-green-500/10 bg-green-500/2'
                                  : 'border-white/5 bg-transparent opacity-40'
                            }`}
                          >
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                              done
                                ? 'bg-green-500/15 border-green-500/30 text-green-400'
                                : isCurrent
                                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400 animate-pulse'
                                  : 'bg-gray-900 border-white/10 text-gray-600'
                            }`}>
                              {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${done ? 'text-gray-400 line-through' : 'text-white'}`}>
                                {step.label}
                              </p>
                              {!done && (
                                <p className="text-[10px] text-gray-600 font-light mt-0.5">{step.description}</p>
                              )}
                            </div>

                            {isCurrent && (
                              <Link to={step.href}>
                                <button className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer">
                                  {step.cta} <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* Empty State message details */}
                  <Card className="p-12 text-center border-white/5 bg-[#101828]/10">
                    <EmptyState
                      icon={<Brain className="w-full h-full" />}
                      title="AI Mock Dashboard Locked"
                      description="To customize questions and view performance trackers, complete step 1 (Profile) and step 2 (Resume Upload)."
                      action={{ label: 'Upload Your Resume', href: '/resume' }}
                      size="lg"
                    />
                  </Card>
                </div>
              ) : (
                /* ── CASE B: RESUME UPLOADED — PREMIUM SAAS DASHBOARD ── */
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card hoverEffect className="p-5 flex flex-col justify-between h-32 border-white/5 bg-[#0d1226]/40">
                      <div>
                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Resume Quality</span>
                        <span className="text-3xl font-black text-white">{resumeInfo.resume_score || 70}%</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-light">Score parsed from CV structure</span>
                    </Card>

                    <Card hoverEffect className="p-5 flex flex-col justify-between h-32 border-white/5 bg-[#0d1226]/40">
                      <div>
                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">ATS Optimization</span>
                        <span className="text-3xl font-black text-purple-400">{resumeInfo.ats_score || 70}%</span>
                      </div>
                      <span className="text-[10px] text-purple-400 font-light flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Compatible with screening
                      </span>
                    </Card>

                    <Card hoverEffect className="p-5 flex flex-col justify-between h-32 border-white/5 bg-[#0d1226]/40">
                      <div>
                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Profile Completion</span>
                        <span className="text-3xl font-black text-indigo-400">{profileCompletionPercent}%</span>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-light">{filledFields} of 11 fields completed</span>
                    </Card>

                    <Card hoverEffect className="p-5 flex flex-col justify-between h-32 border-white/5 bg-[#0d1226]/40">
                      <div>
                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Interview Readiness</span>
                        <span className="text-3xl font-black text-green-400">{readinessScore}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400" style={{ width: `${readinessScore}%` }} />
                      </div>
                    </Card>
                  </div>

                  {/* Summary & Skills Blocks */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      {/* Career and Resume Info */}
                      <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-400" /> Career Profile Analysis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5 p-3.5 rounded-xl border border-white/5 bg-black/20">
                            <span className="text-gray-500 block">Recommended Career Role</span>
                            <span className="font-bold text-white text-sm capitalize">{recommendedRole}</span>
                          </div>
                          <div className="space-y-1.5 p-3.5 rounded-xl border border-white/5 bg-black/20">
                            <span className="text-gray-500 block">Resume Upload Date</span>
                            <span className="font-bold text-white text-sm">
                              {resumeInfo.uploaded_at ? new Date(resumeInfo.uploaded_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </Card>

                      {/* Skills Analysis */}
                      <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" /> Skills Intelligence
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-2">Top Skills Found</span>
                            <div className="flex flex-wrap gap-1.5">
                              {resumeInfo.skills && resumeInfo.skills.length > 0 ? (
                                resumeInfo.skills.slice(0, 8).map((skill, idx) => (
                                  <Badge key={idx} variant="primary">{skill}</Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-600">None parsed.</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-2">Weak Areas / Gaps</span>
                            <div className="flex flex-wrap gap-1.5">
                              {weakSkills.length > 0 ? (
                                weakSkills.map((weak, idx) => (
                                  <Badge key={idx} variant="danger">{weak}</Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-600">None detected.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* History List */}
                      <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-400" /> Previous Practice Sessions
                        </h3>

                        {interviews.length > 0 ? (
                          <div className="space-y-3.5">
                            {interviews.slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-[#101828]/35 hover:border-purple-500/20 transition-all cursor-pointer group"
                                onClick={() => navigate(item.score > 0 ? `/report?id=${item.id}` : `/interview/live?id=${item.id}`)}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="primary">{item.type}</Badge>
                                    <span className="text-[10px] text-gray-500 uppercase">{item.difficulty}</span>
                                  </div>
                                  <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors capitalize">
                                    {item.type} Interview
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className="text-right">
                                    <span className="text-[9px] text-gray-500 block uppercase">Score</span>
                                    <span className="text-xs font-bold text-white">
                                      {item.score > 0 ? `${item.score}%` : 'Pending'}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-gray-500 font-light">
                            No mock interviews completed yet. Choose a session to begin.
                          </div>
                        )}
                      </Card>
                    </div>

                    {/* Right column sidebar */}
                    <div className="space-y-5">
                      {/* Action buttons */}
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Simulations</h3>
                        {[
                          { label: 'Start Technical Mock', href: '/interview/setup', icon: <Mic className="w-4 h-4" /> },
                          { label: 'Upgraded Resume Center', href: '/resume', icon: <FileText className="w-4 h-4" /> },
                          { label: 'Performance Analytics', href: '/analytics', icon: <BarChart3 className="w-4 h-4" /> },
                          { label: 'Edit SaaS Profile', href: '/profile', icon: <User className="w-4 h-4" /> },
                        ].map((action, idx) => (
                          <Link key={idx} to={action.href}>
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-[#101828]/40 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group">
                              <span className="text-purple-400 group-hover:text-purple-300 transition-colors">
                                {action.icon}
                              </span>
                              <span className="text-xs text-gray-400 group-hover:text-white transition-colors font-medium">
                                {action.label}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 ml-auto transition-colors" />
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Performance Insight Card */}
                      {hasInterview ? (
                        <Card className="p-5 border border-white/5 bg-[#101828]/25 space-y-3">
                          <h3 className="text-xs font-bold text-white flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Career Readiness Analysis
                          </h3>
                          <p className="text-[10px] text-gray-500 font-light leading-relaxed">
                            Based on your completed mock sessions, your technical index is ready. View advanced charts and roadmaps.
                          </p>
                          <Link to="/analytics" className="block">
                            <Button variant="secondary" size="sm" className="w-full">
                              View Radar Analytics
                            </Button>
                          </Link>
                        </Card>
                      ) : (
                        <Card className="p-5 border border-white/5 bg-[#101828]/15 space-y-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                              <BarChart3 className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-bold text-white">Analytics Locked</h3>
                          </div>
                          <p className="text-[10px] text-gray-500 font-light leading-relaxed">
                            Take a mock interview to calibrate your technical radar charts and check skill alignments.
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
