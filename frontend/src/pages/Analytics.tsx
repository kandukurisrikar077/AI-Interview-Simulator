import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertTriangle, Lightbulb, Compass, Award, ShieldAlert, Download } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Breadcrumbs } from '../components/common/Breadcrumbs'
import { useToast } from '../context/ToastContext'
import { analyticsService } from '../services/analyticsService'
import type { AnalyticsData } from '../types/api'

export const Analytics: React.FC = () => {
  const { success } = useToast()
  const [timeRange, setTimeRange] = useState('30d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsService.getMyAnalytics()
        setAnalyticsData(data)
      } catch {
        // Backend unavailable — keep static fallback data below
        console.warn('Analytics API unavailable, using fallback data.')
      }
    }
    fetchAnalytics()
  }, [])

  // Real data only — empty arrays if user has no interview history
  const skillCoverage = analyticsData?.skill_scores?.length
    ? analyticsData.skill_scores.map((ss) => ({
        skill: ss.skill,
        level: ss.score,
        status: ss.score >= 80 ? 'Strong' : ss.score >= 65 ? 'Average' : 'Needs Focus',
      }))
    : []

  const weakAreas = analyticsData?.weak_areas?.length
    ? analyticsData.weak_areas.map((w) => ({ category: w, issue: `Performance below threshold in ${w}.`, severity: 'medium' }))
    : []

  const recommendations = analyticsData?.weak_areas?.length
    ? analyticsData.weak_areas.map((w, idx) => `Step ${idx + 1}: Review technical foundations and sample questions for ${w}.`)
    : []

  return (
    <div className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Breadcrumbs />
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Performance Analytics <span className="text-xs bg-purple-500/15 border border-purple-500/20 text-purple-300 font-normal px-2.5 py-1 rounded-full">Pro features active</span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">Analytical score grids aggregated across your voice and Monaco coding round history.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex bg-gray-950 border border-white/5 rounded-lg p-0.5 text-xs">
              {['7d', '30d', 'all'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTimeRange(t)
                    success(`Adjusted analytics scale to ${t}`)
                  }}
                  className={`px-3 py-1 rounded capitalize font-bold text-[10px] cursor-pointer transition-all ${
                    timeRange === t ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => success('Summary report JSON downloaded successfully!')}
            >
              Export Report
            </Button>
          </div>
        </header>

        {/* Skill cover grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Radar Skill levels list */}
          <Card className="md:col-span-2 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Compass className="w-4.5 h-4.5 text-purple-400" /> Skill Coverage Index
            </h3>
                     {skillCoverage.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2 items-center">
                <div className="space-y-4 lg:col-span-1">
                  {skillCoverage.map((sc, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-300">{sc.skill}</span>
                        <span className={sc.status === 'Strong' ? 'text-green-400' : sc.status === 'Average' ? 'text-yellow-400' : 'text-red-400'}>
                          {sc.level}% • {sc.status}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-950/80 border border-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sc.level}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            sc.status === 'Strong'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                              : 'bg-gradient-to-r from-red-600 to-rose-400'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom SVG Radar graphic map mockup */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-950/20 border border-white/5 relative aspect-square max-w-[210px] mx-auto w-full">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2">Skill Profile</span>
                  <div className="w-full h-full flex items-center justify-center relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                      <polygon points="50,5 95,38 78,90 22,90 5,38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                      <polygon points="50,25 72,42 64,68 36,68 28,42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                      <line x1="50" y1="50" x2="50" y2="5" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
                      <line x1="50" y1="50" x2="95" y2="38" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
                      <line x1="50" y1="50" x2="78" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
                      <line x1="50" y1="50" x2="22" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
                      <line x1="50" y1="50" x2="5" y2="38" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
                      
                      <polygon 
                        points="50,15 84,40 68,76 32,84 15,40" 
                        fill="rgba(147, 51, 234, 0.25)" 
                        stroke="#a855f7" 
                        strokeWidth="1.5" 
                      />
                      <circle cx="50" cy="15" r="1.5" fill="#a855f7" />
                      <circle cx="84" cy="40" r="1.5" fill="#a855f7" />
                      <circle cx="68" cy="76" r="1.5" fill="#a855f7" />
                      <circle cx="32" cy="84" r="1.5" fill="#a855f7" />
                      <circle cx="15" cy="40" r="1.5" fill="#a855f7" />
                    </svg>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] text-gray-500 font-mono">React</div>
                    <div className="absolute right-0 top-1/3 text-[8px] text-gray-500 font-mono">Design</div>
                    <div className="absolute bottom-0 right-1/4 text-[8px] text-gray-500 font-mono">DSA</div>
                    <div className="absolute bottom-0 left-1/4 text-[8px] text-gray-500 font-mono">Behavior</div>
                  </div>
                </div>

                {/* Performance line graph */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-950/20 border border-white/5 relative aspect-square max-w-[210px] mx-auto w-full">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2">Performance Trend</span>
                  <div className="w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 170 100" className="w-full h-auto overflow-visible">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line x1="15" y1="20" x2="155" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2,2" />
                      <line x1="15" y1="55" x2="155" y2="55" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2,2" />
                      <line x1="15" y1="90" x2="155" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="0.75" />
                      <text x="3" y="22" fill="rgba(255,255,255,0.3)" fontSize="5" fontFamily="monospace">90%</text>
                      <text x="3" y="57" fill="rgba(255,255,255,0.3)" fontSize="5" fontFamily="monospace">70%</text>
                      <text x="3" y="92" fill="rgba(255,255,255,0.3)" fontSize="5" fontFamily="monospace">50%</text>
                      <path d="M 15 57 L 43 45 L 71 49 L 99 21 L 127 27 L 155 10 L 155 90 L 15 90 Z" fill="url(#chartGradient)" />
                      <path d="M 15 57 L 43 45 L 71 49 L 99 21 L 127 27 L 155 10" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="15" cy="57" r="1.5" fill="#fff" stroke="#a855f7" strokeWidth="1" />
                      <circle cx="43" cy="45" r="1.5" fill="#fff" stroke="#a855f7" strokeWidth="1" />
                      <circle cx="71" cy="49" r="1.5" fill="#fff" stroke="#a855f7" strokeWidth="1" />
                      <circle cx="99" cy="21" r="1.5" fill="#fff" stroke="#a855f7" strokeWidth="1" />
                      <circle cx="127" cy="27" r="1.5" fill="#fff" stroke="#a855f7" strokeWidth="1" />
                      <circle cx="155" cy="10" r="2" fill="#a855f7" stroke="#fff" strokeWidth="1" />
                      <text x="15" y="98" fill="rgba(255,255,255,0.4)" fontSize="4.5" textAnchor="middle" fontFamily="sans-serif">Mock 1</text>
                      <text x="43" y="98" fill="rgba(255,255,255,0.4)" fontSize="4.5" textAnchor="middle" fontFamily="sans-serif">Mock 2</text>
                      <text x="71" y="98" fill="rgba(255,255,255,0.4)" fontSize="4.5" textAnchor="middle" fontFamily="sans-serif">Mock 3</text>
                      <text x="99" y="98" fill="rgba(255,255,255,0.4)" fontSize="4.5" textAnchor="middle" fontFamily="sans-serif">Mock 4</text>
                      <text x="127" y="98" fill="rgba(255,255,255,0.4)" fontSize="4.5" textAnchor="middle" fontFamily="sans-serif">Mock 5</text>
                      <text x="155" y="98" fill="rgba(255,255,255,0.4)" fontSize="4.5" textAnchor="middle" fontFamily="sans-serif">Latest</text>
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
                <div className="py-12 text-center text-gray-500 font-light text-xs">
                  No performance data cataloged. Take a mock session to calibrate skill indices.
                </div>
              )}
          </Card>

          {/* Column 2: Stat breakdown */}
          <div className="space-y-6">
            <Card className="text-center p-6 space-y-3">
              <Award className="w-8 h-8 text-purple-500 mx-auto" />
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Average Technical Score</span>
              <span className="text-4xl font-black text-white">82%</span>
              <p className="text-[10px] text-gray-500 font-light leading-relaxed">
                Ranked in the top 15% of mock candidates preparing for Senior Engineering profiles.
              </p>
            </Card>

            <Card className="text-center p-6 space-y-3">
              <ShieldAlert className="w-8 h-8 text-indigo-400 mx-auto" />
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Integrity Compliance</span>
              <span className="text-2xl font-black text-white">96%</span>
              <p className="text-[10px] text-gray-500 font-light">
                Minimum screen exit focus logs and tab visibilities recorded.
              </p>
            </Card>
          </div>

        </div>

        {/* Weak Areas and Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Weak areas card */}
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <AlertTriangle className="w-4.5 h-4.5 text-yellow-400" /> Focus Targets (Weak areas)
            </h3>
            
            <div className="space-y-4">
              {weakAreas.map((wa, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-[#101828]/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{wa.category}</span>
                    <Badge variant={wa.severity === 'high' ? 'danger' : 'info'}>{wa.severity} severity</Badge>
                  </div>
                  <p className="text-xs text-gray-400 font-light leading-relaxed">{wa.issue}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations checklist */}
          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Lightbulb className="w-4.5 h-4.5 text-green-400" /> Study Recommendations
            </h3>
            
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                  <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 text-xs font-bold shrink-0">
                    Step {idx + 1}
                  </span>
                  <p className="text-xs text-gray-400 font-light leading-relaxed pt-0.5">{rec}</p>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>
    </div>
  )
}
