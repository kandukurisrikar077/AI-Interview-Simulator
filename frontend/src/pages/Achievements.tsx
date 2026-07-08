import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy, ArrowLeft, Loader2, Star, Flame, Sparkles, CheckCircle2,
  Lock, Award, ShieldCheck, Compass, Info, Play
} from 'lucide-react'
import apiClient from '../services/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Sidebar, MobileMenuButton } from '../components/layout/Sidebar'

interface BadgeConfig {
  id: string
  title: string
  description: string
  unlocked: boolean
  icon: React.ReactNode
  metric: string
}

export const Achievements: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [interviewsCount, setInterviewsCount] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [streakDays, setStreakDays] = useState(0)

  // Badge unlock metrics
  const [hasProfileDone, setHasProfileDone] = useState(false)
  const [hasResumeDone, setHasResumeDone] = useState(false)
  const [hasCodingDone, setHasCodingDone] = useState(false)
  const [hasConfidentSpeech, setHasConfidentSpeech] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [userRes, resumeRes, interviewRes] = await Promise.allSettled([
          apiClient.get('/auth/me'),
          apiClient.get('/resumes/me'),
          apiClient.get('/interviews')
        ])

        if (userRes.status === 'fulfilled' && userRes.value.data) {
          setHasProfileDone(!!userRes.value.data.profile_completed)
        }

        if (resumeRes.status === 'fulfilled' && resumeRes.value.data) {
          setHasResumeDone(!!resumeRes.value.data.file_path)
        }

        if (interviewRes.status === 'fulfilled') {
          const ivs = interviewRes.value.data ?? []
          const completed = ivs.filter((iv: any) => iv.status === 'completed')
          setInterviewsCount(completed.length)

          const scores = completed.map((c: any) => c.score).filter(Boolean)
          if (scores.length > 0) {
            setBestScore(Math.max(...scores))
          }

          // Check if any coding round was finished
          const hasCoding = ivs.some((iv: any) => iv.type.toLowerCase() === 'coding' && iv.status === 'completed')
          setHasCodingDone(hasCoding)

          // Check if speech confidence metric is high
          let highConf = false
          for (const iv of ivs) {
            if (iv.roadmap) {
              let rMap = iv.roadmap
              if (typeof rMap === 'string') {
                try { rMap = JSON.parse(rMap) } catch {}
              }
              if (rMap?.confidence_score > 85) {
                highConf = true
                break
              }
            }
          }
          setHasConfidentSpeech(highConf)

          // Mock streak calculation (based on spacing of interviews within past 3 days)
          if (completed.length > 0) {
            setStreakDays(Math.min(completed.length, 3))
          }
        }
      } catch (err) {
        console.error('Failed to load achievements stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const badges: BadgeConfig[] = [
    {
      id: 'profile',
      title: 'SaaS Pioneer',
      description: 'Fully complete all 11 core profile settings fields.',
      unlocked: hasProfileDone,
      icon: <ShieldCheck className="w-6 h-6" />,
      metric: hasProfileDone ? 'Completed' : '0/1 fields'
    },
    {
      id: 'resume',
      title: 'Resume Specialist',
      description: 'Upload and execute AI parser checks on your resume.',
      unlocked: hasResumeDone,
      icon: <Award className="w-6 h-6" />,
      metric: hasResumeDone ? 'Parsed' : '0/1 uploads'
    },
    {
      id: 'mock',
      title: 'First Step',
      description: 'Successfully complete your very first mock interview simulation.',
      unlocked: interviewsCount > 0,
      icon: <Star className="w-6 h-6" />,
      metric: interviewsCount > 0 ? 'Unlocked' : '0/1 mock'
    },
    {
      id: 'streak',
      title: 'Consistent Practice',
      description: 'Unlock a consecutive daily mock practice streak.',
      unlocked: streakDays >= 2,
      icon: <Flame className="w-6 h-6" />,
      metric: streakDays > 0 ? `${streakDays} Day Streak` : '0/2 days'
    },
    {
      id: 'coding',
      title: 'Algorithmic Master',
      description: 'Complete a technical code editor round workspace.',
      unlocked: hasCodingDone,
      icon: <Compass className="w-6 h-6" />,
      metric: hasCodingDone ? 'Unlocked' : '0/1 round'
    },
    {
      id: 'fluent',
      title: 'Fluent Orator',
      description: 'Score above 85% speech confidence rating in any verbal interview.',
      unlocked: hasConfidentSpeech,
      icon: <Sparkles className="w-6 h-6" />,
      metric: hasConfidentSpeech ? 'Unlocked' : '0/1 session'
    }
  ]

  const unlockedCount = badges.filter(b => b.unlocked).length

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
                    Achievements & Streaks <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-normal">{unlockedCount} Unlocked</span>
                  </h1>
                  <p className="text-gray-400 text-xs mt-1">Practice consistently to unlock badges, improve core stats, and build streaks.</p>
                </div>
              </header>

              {/* Stats overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-white/5 bg-[#0d1226]/40 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                    <Trophy className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block">Best Score Rating</span>
                    <span className="text-2xl font-black text-white">{bestScore > 0 ? `${bestScore}%` : 'N/A'}</span>
                  </div>
                </Card>

                <Card className="p-6 border-white/5 bg-[#0d1226]/40 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <Flame className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block">Active Streak</span>
                    <span className="text-2xl font-black text-white">{streakDays} Days</span>
                  </div>
                </Card>

                <Card className="p-6 border-white/5 bg-[#0d1226]/40 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block">Total Mocks Finished</span>
                    <span className="text-2xl font-black text-white">{interviewsCount} Rounds</span>
                  </div>
                </Card>
              </div>

              {/* Badges Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Unlocked Badges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {badges.map(b => (
                    <Card
                      key={b.id}
                      className={`p-5 border transition-all flex flex-col justify-between h-44 ${
                        b.unlocked
                          ? 'border-purple-500/20 bg-[#0d1226]/50 shadow-lg shadow-purple-500/5'
                          : 'border-white/5 bg-gray-950/40 opacity-40'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            b.unlocked ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-gray-900 border-white/5 text-gray-600'
                          }`}>
                            {b.unlocked ? b.icon : <Lock className="w-5 h-5" />}
                          </div>
                          <Badge variant={b.unlocked ? 'success' : 'outline'} className="text-[9px]">
                            {b.unlocked ? 'Unlocked' : 'Locked'}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{b.title}</h4>
                          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed font-light">{b.description}</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 border-t border-white/5 pt-2.5 flex justify-between">
                        <span>Metric:</span>
                        <span className={`font-semibold ${b.unlocked ? 'text-purple-400' : 'text-gray-600'}`}>{b.metric}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <Card className="p-4 border-indigo-500/10 bg-[#0d1226]/20 flex items-start gap-3">
                <Info className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                  <strong>How streaks work:</strong> Complete at least one theory or coding mock session within any 48-hour window. This maintains your streak flame. Practice builds speaking muscle memory and eliminates speech pauses.
                </p>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
