import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ClipboardList, ArrowLeft, Plus, ToggleLeft, ToggleRight, 
  Link as LinkIcon, AlertCircle, Check, Copy, HelpCircle, Briefcase 
} from 'lucide-react'
import apiClient from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

interface Job {
  id: number
  title: string
  company: string
}

interface Campaign {
  id: number
  title: string
  job_id: number | null
  interview_type: string
  difficulty: string
  coding_round_required: boolean
  resume_screening_required: boolean
  ai_evaluation_required: boolean
  status: string
}

export const HiringCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Creation State
  const [title, setTitle] = useState('')
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [interviewType, setInterviewType] = useState('technical')
  const [difficulty, setDifficulty] = useState('medium')
  const [codingRound, setCodingRound] = useState(false)
  const [resumeScreening, setResumeScreening] = useState(true)
  const [aiEvaluation, setAiEvaluation] = useState(true)

  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [campsRes, jobsRes] = await Promise.all([
        apiClient.get('/recruiter/campaigns'),
        apiClient.get('/recruiter/jobs')
      ])
      setCampaigns(campsRes.data)
      setJobs(jobsRes.data)
    } catch (err: any) {
      setError('Failed to fetch campaigns or job lists.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (campaignId: number) => {
    const link = `${window.location.origin}/setup?campaign_id=${campaignId}`
    navigator.clipboard.writeText(link)
    setCopiedId(campaignId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError('Please specify a title for the campaign.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title,
        job_id: selectedJobId ? Number(selectedJobId) : null,
        interview_type: interviewType,
        difficulty,
        coding_round_required: codingRound,
        resume_screening_required: resumeScreening,
        ai_evaluation_required: aiEvaluation,
        status: 'active'
      }

      await apiClient.post('/recruiter/campaigns', payload)
      setSuccess('Campaign template created successfully!')
      setTitle('')
      setSelectedJobId('')
      setCodingRound(false)
      fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create campaign template.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col font-sans py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto space-y-6 relative z-10">
        <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Hiring Campaigns & Custom Templates
            </h1>
            <p className="text-xs text-gray-400 mt-1">Calibrate specific hiring sequences, activate coding sandboxes, and export candidates invite links.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs">
            ✓ {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creator form */}
          <Card className="p-6 border-white/5 bg-[#080d1a]/60 shadow-xl h-fit">
            <h2 className="text-md font-bold text-white mb-4 flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-purple-400" /> New Campaign Template
            </h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <Input
                label="Campaign Title"
                placeholder="Q3 Software Engineer Intake"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={submitting}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Link to Job Opening</label>
                <Select
                  value={selectedJobId}
                  onChange={e => setSelectedJobId(e.target.value)}
                  options={[
                    { value: '', label: 'Select job post (optional)' },
                    ...jobs.map(j => ({ value: String(j.id), label: j.title }))
                  ]}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Interview Type</label>
                  <Select
                    value={interviewType}
                    onChange={e => setInterviewType(e.target.value)}
                    options={[
                      { value: 'technical', label: 'Technical' },
                      { value: 'hr', label: 'HR' },
                      { value: 'behavioral', label: 'Behavioral' },
                      { value: 'system_design', label: 'System Design' }
                    ]}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty</label>
                  <Select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    options={[
                      { value: 'easy', label: 'Easy' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'hard', label: 'Hard' }
                    ]}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Sequence Pipelines</label>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-gray-300">Resume Screening</span>
                  <button
                    type="button"
                    onClick={() => setResumeScreening(!resumeScreening)}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {resumeScreening ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-gray-300">Coding Sandbox Round</span>
                  <button
                    type="button"
                    onClick={() => setCodingRound(!codingRound)}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {codingRound ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-gray-300">AI Evaluation Agent</span>
                  <button
                    type="button"
                    onClick={() => setAiEvaluation(!aiEvaluation)}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {aiEvaluation ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-600" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={submitting}
                className="w-full mt-4"
              >
                Create Campaign
              </Button>
            </form>
          </Card>

          {/* List of campaigns */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Campaigns</h2>
            {loading ? (
              <div className="py-20 text-center text-gray-500">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                No custom campaigns configured yet. Fill out the creator form on the left.
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map(camp => {
                  const jobName = jobs.find(j => j.id === camp.job_id)?.title || 'Unlinked Campaign'
                  return (
                    <Card key={camp.id} className="p-6 border-white/5 bg-[#080d1a]/40 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-all">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase rounded border border-purple-500/25">
                            {camp.interview_type}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-500/25">
                            {camp.difficulty}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold uppercase ml-auto md:ml-0">
                            ID: {camp.id}
                          </span>
                        </div>
                        
                        <h3 className="text-md font-bold text-white">{camp.title}</h3>
                        
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                          Job Opening: <strong className="text-purple-300">{jobName}</strong>
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 text-[10px] text-gray-500 font-semibold">
                          <span>Resume Screening: <strong className={camp.resume_screening_required ? 'text-green-400' : 'text-gray-600'}>{camp.resume_screening_required ? 'ACTIVE' : 'OFF'}</strong></span>
                          <span>Coding Round: <strong className={camp.coding_round_required ? 'text-green-400' : 'text-gray-600'}>{camp.coding_round_required ? 'ACTIVE' : 'OFF'}</strong></span>
                          <span>AI Evaluation: <strong className={camp.ai_evaluation_required ? 'text-green-400' : 'text-gray-600'}>{camp.ai_evaluation_required ? 'ACTIVE' : 'OFF'}</strong></span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-stretch gap-2 shrink-0">
                        <button
                          onClick={() => handleCopyLink(camp.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all border border-purple-500/30 cursor-pointer shadow-lg shadow-purple-600/10"
                        >
                          {copiedId === camp.id ? (
                            <>
                              <Check className="w-4 h-4 text-green-300" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Invite Link
                            </>
                          )}
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
