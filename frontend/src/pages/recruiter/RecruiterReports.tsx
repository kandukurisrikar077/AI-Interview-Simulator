import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Award, Download, Search, RefreshCw, FileText, Loader2 } from 'lucide-react'
import apiClient from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

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

export const RecruiterReports: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/recruiter/candidates')
      // Only show candidates who have completed interview
      const completed = res.data.filter((c: any) => c.interview_id !== null)
      setCandidates(completed)
    } catch (err: any) {
      setError('Failed to fetch assessed candidates.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async (cand: Candidate) => {
    if (!cand.interview_id) return
    
    setDownloadingId(cand.interview_id)
    try {
      const response = await apiClient.get(`/interviews/${cand.interview_id}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `intervue_recruitment_report_${cand.candidate_name.replace(/\s+/g, '_')}_${cand.interview_id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Failed to download PDF:', err)
      alert('Could not download PDF report.')
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredCandidates = candidates.filter(c => 
    c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.campaign_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.candidate_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col font-sans py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <button 
            onClick={fetchCandidates} 
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Interview Reports Console
          </h1>
          <p className="text-xs text-gray-400 mt-1">Download and print ReportLab PDF assessment files containing transcripts and AI category grades.</p>
        </div>

        <Card className="p-6 border-white/5 bg-[#080d1a]/60 shadow-xl space-y-4">
          <div className="relative">
            <Input
              label="Search Completed Assessments"
              placeholder="Search by candidate name, email, or campaign..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-500">Querying completed reports database...</div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            No completed interview reports available. Candidates must complete their scheduled loop to show up here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map(cand => (
              <Card key={cand.id} className="p-6 border-white/5 bg-[#080d1a]/40 hover:border-white/10 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{cand.candidate_name}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{cand.candidate_email}</p>
                    </div>
                    {cand.score !== null && (
                      <span className={`inline-block font-black px-2 py-0.5 rounded text-[10px] ${
                        cand.score >= 85 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        cand.score >= 70 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {cand.score}% Score
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-400 pt-2 border-t border-white/5">
                    <p className="text-[10px]">Campaign: <strong className="text-purple-300">{cand.campaign_title}</strong></p>
                    <p className="text-[10px]">Date Completed: <strong className="text-gray-300">{cand.date}</strong></p>
                  </div>
                </div>

                {cand.interview_id && (
                  <button
                    onClick={() => handleDownloadPdf(cand)}
                    disabled={downloadingId === cand.interview_id}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/40 disabled:text-emerald-400/50 text-white font-bold text-xs rounded-xl transition-all border border-emerald-500/30 cursor-pointer shadow-lg shadow-emerald-600/10"
                  >
                    {downloadingId === cand.interview_id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Report PDF
                      </>
                    )}
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
