import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, Award, Download, RefreshCw, Loader2, Sparkles, 
  ShieldAlert, AlignLeft, History as HistoryIcon, CheckCircle2, 
  XCircle, BookOpen, AlertTriangle, Milestone, Compass, HelpCircle
} from 'lucide-react'
import { interviewService } from '../services/interviewService'
import apiClient from '../services/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

interface Question {
  id: number
  text: string
  type: string
  expected_answer: string
  user_answer: string | null
  transcript: string | null
  score: number | null
  feedback: string | null
  category: string | null
  grammar_score?: number | null
  confidence_score?: number | null
  filler_words_count?: number | null
  speaking_speed?: number | null
  response_length?: number | null
}

interface MalpracticeLog {
  id: number
  type: string
  timestamp: string
  confidence: number
  severity: string
}

interface SkillScore {
  skill: string
  score: number
}

interface RoadmapData {
  suggestions: string[]
  roadmap_7_day?: string[]
  roadmap_30_day?: string[]
  skill_gaps?: string[]
  recommended_technologies?: string[]
  learning_resources?: string[]
  next_interview_recommendation?: string
  technical_score?: number
  communication_score?: number
  problem_solving_score?: number
  confidence_score?: number
  grammar_score?: number
  code_quality_score?: number
  strengths?: string[]
  weaknesses?: string[]
  skill_scores?: SkillScore[]
}

interface InterviewDetail {
  id: number
  type: string
  difficulty: string
  duration_minutes: number
  score: number | null
  status: string
  created_at: string
  questions: Question[]
  malpractice_logs: MalpracticeLog[]
  roadmap: RoadmapData | null
}

export const Report: React.FC = () => {
  const [searchParams] = useSearchParams()
  const interviewId = searchParams.get('id')

  const [detail, setDetail] = useState<InterviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRoadmapTab, setActiveRoadmapTab] = useState<'7d' | '30d'>('7d')

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await interviewService.get(Number(interviewId))
        setDetail(data as any)
      } catch (err: any) {
        console.error(err)
        setError('Failed to retrieve evaluation report. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    if (interviewId) fetchReport()
    else setError('No interview ID provided.')
  }, [interviewId])

  const handleDownloadPdf = async () => {
    if (!interviewId) return
    setDownloadLoading(true)
    try {
      const response = await apiClient.get(`/interviews/${interviewId}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `intervue_report_${interviewId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      setError('Could not download PDF report.')
    } finally {
      setDownloadLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center p-6">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Report</h2>
        <p className="text-gray-400 text-sm mb-6">{error || 'Session details could not be found.'}</p>
        <Link to="/dashboard" className="px-5 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-white hover:bg-gray-800 transition-all">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const score = detail.score || 0
  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = score >= 80 ? 'bg-green-500/5 border-green-500/10' : score >= 60 ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-red-500/5 border-red-500/10'

  return (
    <div className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header Block */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Simulation Evaluation Report <span className="text-xs bg-purple-500/15 border border-purple-500/20 text-purple-300 font-normal px-2.5 py-1 rounded-full">AI Calibrated</span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">Review speaking metrics, coding logic audits, and customized roadmaps.</p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadLoading}
            className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer self-start md:self-auto text-sm"
          >
            {downloadLoading ? (
              <><Loader2 className="w-4.5 h-4.5 animate-spin" /> Generating PDF...</>
            ) : (
              <><Download className="w-4.5 h-4.5" /> Download PDF Report</>
            )}
          </button>
        </header>

        {/* Score Summary Block */}
        <div className={`glass-card p-8 rounded-3xl border flex flex-col md:flex-row items-center gap-8 ${scoreBg}`}>
          <div className="w-28 h-28 rounded-full bg-black/40 border border-white/5 flex items-center justify-center relative shrink-0">
            <Award className={`w-12 h-12 ${scoreColor}`} />
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-purple-500/10 animate-spin pointer-events-none" style={{ animationDuration: '8s' }} />
          </div>
          <div className="text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Overall Mock Performance</span>
            <h3 className={`text-4xl md:text-5xl font-black ${scoreColor} mt-1`}>{score}%</h3>
            <p className="text-gray-300 text-xs mt-3 leading-relaxed font-light">
              This score aggregates performance indices from your verbal explanations, logic constraints, coding rounds, and response pacing. Keep practicing to improve technical benchmarks.
            </p>
          </div>
        </div>

        {/* Competency Metric Cards Grid */}
        {detail.roadmap && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: 'Technical', val: detail.roadmap.technical_score, color: 'text-purple-400' },
              { label: 'Communication', val: detail.roadmap.communication_score, color: 'text-blue-400' },
              { label: 'Problem Solving', val: detail.roadmap.problem_solving_score, color: 'text-indigo-400' },
              { label: 'Confidence', val: detail.roadmap.confidence_score, color: 'text-green-400' },
              { label: 'Grammar', val: detail.roadmap.grammar_score, color: 'text-yellow-400' },
              { label: 'Code Quality', val: detail.roadmap.code_quality_score, color: 'text-pink-400' },
            ].map((m, idx) => (
              <Card key={idx} className="p-4 text-center space-y-1 bg-gray-950/40 border border-white/5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">{m.label}</span>
                <span className={`text-xl font-extrabold block ${m.color}`}>{m.val !== undefined ? `${Math.round(m.val)}%` : 'N/A'}</span>
              </Card>
            ))}
          </div>
        )}

        {/* Strengths & Weaknesses side-by-side */}
        {detail.roadmap && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-4.5 h-4.5 text-green-400" /> Key Strengths
              </h3>
              <div className="space-y-3">
                {detail.roadmap.strengths?.map((str, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5" />
                    <p className="text-xs text-gray-300 leading-relaxed font-light">{str}</p>
                  </div>
                )) || <p className="text-xs text-gray-500 italic">No specific strengths indexed.</p>}
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4.5 h-4.5 text-yellow-500" /> Improvement Targets
              </h3>
              <div className="space-y-3">
                {detail.roadmap.weaknesses?.map((wk, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 mt-1.5" />
                    <p className="text-xs text-gray-300 leading-relaxed font-light">{wk}</p>
                  </div>
                )) || <p className="text-xs text-gray-500 italic">No targets indexed.</p>}
              </div>
            </Card>
          </div>
        )}

        {/* Interactive Roadmaps */}
        {detail.roadmap && (detail.roadmap.roadmap_7_day || detail.roadmap.roadmap_30_day) && (
          <Card className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Milestone className="w-4.5 h-4.5 text-purple-400" /> Learning Path Plan
              </h3>
              
              <div className="flex bg-gray-950 border border-white/5 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setActiveRoadmapTab('7d')}
                  className={`px-3 py-1 rounded capitalize font-bold text-[10px] cursor-pointer transition-all ${
                    activeRoadmapTab === '7d' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  7-Day Sprint
                </button>
                <button
                  onClick={() => setActiveRoadmapTab('30d')}
                  className={`px-3 py-1 rounded capitalize font-bold text-[10px] cursor-pointer transition-all ${
                    activeRoadmapTab === '30d' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  30-Day Checklist
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {activeRoadmapTab === '7d' ? (
                <div className="space-y-4">
                  {detail.roadmap.roadmap_7_day?.map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold shrink-0">
                        Sprint Day {idx + 1}
                      </span>
                      <p className="text-xs text-gray-300 font-light leading-relaxed pt-0.5">{step}</p>
                    </div>
                  )) || <p className="text-xs text-gray-500 italic">No 7-day path available.</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {detail.roadmap.roadmap_30_day?.map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold shrink-0">
                        Week Checkpoint {idx + 1}
                      </span>
                      <p className="text-xs text-gray-300 font-light leading-relaxed pt-0.5">{step}</p>
                    </div>
                  )) || <p className="text-xs text-gray-500 italic">No 30-day checklist available.</p>}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Skill gaps & Tech recommendations */}
        {detail.roadmap && (detail.roadmap.skill_gaps || detail.roadmap.recommended_technologies) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Compass className="w-4.5 h-4.5 text-indigo-400" /> Tech Gaps & Recommendations
              </h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">Competency Gaps</span>
                  <div className="flex flex-wrap gap-2">
                    {detail.roadmap.skill_gaps?.map((gap, idx) => (
                      <Badge key={idx} variant="danger">{gap}</Badge>
                    )) || <span className="text-xs text-gray-500 italic">None identified</span>}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">Recommended Stack Expansion</span>
                  <div className="flex flex-wrap gap-2">
                    {detail.roadmap.recommended_technologies?.map((tech, idx) => (
                      <Badge key={idx} variant="primary">{tech}</Badge>
                    )) || <span className="text-xs text-gray-500 italic">None identified</span>}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <BookOpen className="w-4.5 h-4.5 text-pink-400" /> Core Study Resources
              </h3>
              
              <div className="space-y-3">
                {detail.roadmap.learning_resources?.map((res, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0 mt-1.5" />
                    <p className="text-xs text-gray-300 leading-relaxed font-light">{res}</p>
                  </div>
                )) || <p className="text-xs text-gray-500 italic">No resources suggested.</p>}
                
                {detail.roadmap.next_interview_recommendation && (
                  <div className="pt-3 mt-3 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Recommended Next Session</span>
                    <p className="text-xs text-purple-300 font-semibold">{detail.roadmap.next_interview_recommendation}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Malpractice logs */}
        {detail.malpractice_logs && detail.malpractice_logs.length > 0 && (
          <div className="glass-card p-6 rounded-2xl border border-red-500/10 bg-red-500/5 space-y-4">
            <h3 className="text-md font-bold text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-red-500" /> Integrity Monitor Warnings
            </h3>
            <p className="text-xs text-red-400/80 font-light">The webcam/visibility listeners logged anomalies during this mock simulation:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {detail.malpractice_logs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-black/40 border border-red-500/10 flex flex-col gap-1">
                  <span className="text-[10px] text-red-400 uppercase font-semibold tracking-wider">{log.type.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-300 font-medium">Severity: {log.severity}</span>
                  <span className="text-[10px] text-gray-500">Confidence: {Math.round(log.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Breakdown List */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-purple-400" /> Question-by-Question Breakdown
          </h2>

          <div className="space-y-6">
            {detail.questions.map((q, idx) => {
              const qScore = q.score || 0
              const qColor = qScore >= 80 ? 'text-green-400' : qScore >= 60 ? 'text-yellow-400' : 'text-red-400'
              const answerText = q.user_answer || q.transcript || 'No response recorded.'
              
              return (
                <div key={q.id} className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded bg-gray-900 border border-white/5 text-[10px] font-semibold uppercase text-purple-300">
                        Q{idx + 1} • {q.type}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1.5">{q.text}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">Rating</span>
                      <span className={`text-md font-bold ${qColor}`}>{qScore}/100</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-950/60 border border-white/5 space-y-2">
                    <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wide">Candidate Response</span>
                    {q.type === 'coding' ? (
                      <pre className="font-mono text-xs text-gray-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                        {answerText}
                      </pre>
                    ) : (
                      <p className="text-xs text-gray-300 leading-relaxed font-light">{answerText}</p>
                    )}
                  </div>

                  {/* Audio live metrics */}
                  {q.type !== 'coding' && (q.grammar_score || q.confidence_score || q.speaking_speed || q.filler_words_count) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-950/20 border border-white/5 rounded-xl text-[10px]">
                      <div>
                        <span className="text-gray-500 block">Speech Confidence</span>
                        <span className="text-green-400 font-bold">{q.confidence_score ? `${Math.round(q.confidence_score)}%` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Grammatical Score</span>
                        <span className="text-purple-400 font-bold">{q.grammar_score ? `${Math.round(q.grammar_score)}%` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Speaking Pace</span>
                        <span className="text-blue-400 font-bold">{q.speaking_speed ? `${Math.round(q.speaking_speed)} WPM` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Filler Words Counts</span>
                        <span className="text-yellow-400 font-bold">{q.filler_words_count ?? 0} instances</span>
                      </div>
                    </div>
                  )}

                  <div className="pl-4 border-l-2 border-purple-500/30">
                    <span className="text-[10px] text-purple-400 font-semibold block mb-1 uppercase tracking-wide">Critique Feedback</span>
                    <p className="text-xs text-gray-400 leading-relaxed font-light italic">
                      {q.feedback || 'AI was unable to formulate a critique for this answer.'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Action Buttons */}
        <footer className="text-center py-10 mt-6">
          <Link
            to="/interview/setup"
            className="px-6 py-3.5 rounded-xl font-bold bg-gray-900 border border-white/5 hover:bg-gray-850 text-white transition-all flex inline-flex items-center gap-2 cursor-pointer text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Start Another Simulation
          </Link>
        </footer>
      </div>
    </div>
  )
}

