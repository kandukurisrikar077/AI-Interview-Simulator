import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, Check, X, RefreshCw, Star, Mail, Calendar, Award } from 'lucide-react'
import apiClient from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

interface Candidate {
  id: number
  candidate_name: string
  candidate_email: string
  campaign_title: string
  status: string
  score: number | null
  interview_id: number | null
  date: string
}

const PIPELINE_STATUSES = [
  { id: 'applied', label: 'Applied' },
  { id: 'resume_received', label: 'Resume Received' },
  { id: 'interview_scheduled', label: 'Scheduled' },
  { id: 'interview_completed', label: 'Assessed' },
  { id: 'selected', label: 'Selected' },
  { id: 'rejected', label: 'Rejected' }
]

export const CandidatePipeline: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<string>('All')

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/recruiter/candidates')
      setCandidates(res.data)
    } catch (err: any) {
      setError('Failed to fetch candidate list.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (candId: number, newStatus: string) => {
    try {
      await apiClient.patch(`/recruiter/candidates/${candId}/status`, { status: newStatus })
      setCandidates(prev => 
        prev.map(c => c.id === candId ? { ...c, status: newStatus } : c)
      )
    } catch (err: any) {
      alert('Failed to update candidate status.')
    }
  }

  const campaignsList = ['All', ...Array.from(new Set(candidates.map(c => c.campaign_title)))]

  const filteredCandidates = selectedCampaign === 'All' 
    ? candidates 
    : candidates.filter(c => c.campaign_title === selectedCampaign)

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col font-sans py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <button 
            onClick={fetchCandidates} 
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh pipeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Talent Pipeline Manager
            </h1>
            <p className="text-xs text-gray-400 mt-1">Review, transition, and shortlist candidates throughout different recruitment milestones.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Filter Campaign:</span>
            <select
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
              className="bg-[#080d1a] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {campaignsList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading pipeline boards...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
            {PIPELINE_STATUSES.map(statusCol => {
              const colCandidates = filteredCandidates.filter(c => {
                // Normalize status to lowercase checks
                const currentStatus = (c.status || 'applied').toLowerCase()
                return currentStatus === statusCol.id
              })

              return (
                <div key={statusCol.id} className="bg-[#080d1a]/60 border border-white/5 rounded-2xl p-4 min-w-[200px] flex flex-col space-y-4 shadow-lg min-h-[450px]">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{statusCol.label}</span>
                    <span className="text-[10px] bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded text-purple-400 font-extrabold">
                      {colCandidates.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] scrollbar-thin">
                    {colCandidates.length === 0 ? (
                      <div className="py-12 text-center text-gray-600 text-[10px]">No candidates</div>
                    ) : (
                      colCandidates.map(cand => (
                        <div 
                          key={cand.id} 
                          className="p-3 rounded-xl bg-black/30 border border-white/5 hover:border-purple-500/20 transition-all space-y-2 group relative"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight">{cand.candidate_name}</h4>
                            <p className="text-[9px] text-gray-500 truncate">{cand.candidate_email}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] text-purple-400 font-semibold block truncate">
                              💼 {cand.campaign_title}
                            </span>
                            {cand.score !== null ? (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black ${
                                cand.score >= 85 ? 'bg-green-500/10 text-green-400 border border-green-500/25' :
                                cand.score >= 70 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                                'bg-red-500/10 text-red-400 border border-red-500/25'
                              }`}>
                                <Award className="w-2.5 h-2.5" /> {cand.score}% Score
                              </span>
                            ) : (
                              <span className="text-[8px] text-gray-500 italic block">No score yet</span>
                            )}
                          </div>

                          {/* Quick Actions inside Card */}
                          <div className="flex gap-1.5 justify-end pt-2 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {statusCol.id !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateStatus(cand.id, 'rejected')}
                                className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all cursor-pointer"
                                title="Reject candidate"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}

                            {/* State transitions */}
                            <select
                              value={cand.status}
                              onChange={e => handleUpdateStatus(cand.id, e.target.value)}
                              className="text-[9px] bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-gray-300 focus:outline-none cursor-pointer"
                            >
                              {PIPELINE_STATUSES.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
