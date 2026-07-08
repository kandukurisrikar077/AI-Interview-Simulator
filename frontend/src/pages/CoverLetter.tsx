import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Send, Sparkles, Download, FileText, Loader2, AlertCircle, Bookmark
} from 'lucide-react'
import apiClient from '../services/api'
import { useToast } from '../context/ToastContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Sidebar } from '../components/layout/Sidebar'

export const CoverLetter: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast()

  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  const [letterContent, setLetterContent] = useState('')
  const [strengths, setStrengths] = useState<string[]>([])
  
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company.trim() || !role.trim()) {
      toastError('Please fill out the Company and Job Role details first.')
      return
    }

    setLoading(true)
    setLetterContent('')
    setStrengths([])

    try {
      const res = await apiClient.post('/placement/cover-letter', {
        company,
        role,
        job_description: jobDescription
      })
      setLetterContent(res.data.content)
      setStrengths(res.data.strengths_highlighted || [])
      toastSuccess('Generated personalized cover letter using AI successfully!')
    } catch (err) {
      toastError('Failed to generate cover letter.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!letterContent) return
    setPdfLoading(true)
    try {
      const response = await apiClient.post('/placement/cover-letter/pdf', {
        company,
        role,
        job_description: jobDescription
      }, { responseType: 'blob' })

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cover_letter_${company.toLowerCase().replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toastSuccess('Downloaded cover letter PDF!')
    } catch (err) {
      toastError('Failed to generate PDF document.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl mx-auto w-full space-y-6">
          {/* Header */}
          <header className="flex justify-between items-center pb-4 border-b border-white/5">
            <div className="space-y-1">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tight">AI Cover Letter Generator</h1>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
            {/* Left: Input parameters */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 border-white/5 bg-[#0d1226]/40">
                <form onSubmit={handleGenerate} className="space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-3">
                    Target Opportunity
                  </h3>
                  <Input
                    label="Company Name"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Google, Microsoft"
                    required
                  />
                  <Input
                    label="Target Job Role"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Backend Software Engineer"
                    required
                  />
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Job Description (Optional)
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={e => setJobDescription(e.target.value)}
                      placeholder="Paste target job descriptions to customize cover letter match criteria..."
                      className="w-full h-32 bg-gray-950/60 border border-white/10 rounded-xl p-3 text-xs text-gray-200 placeholder-gray-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 resize-none font-light"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    loading={loading}
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    Generate with AI
                  </Button>
                </form>
              </Card>

              {strengths.length > 0 && (
                <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Bookmark className="w-4 h-4 text-purple-400" /> Key Strengths Highlighted
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {strengths.map((str, i) => (
                      <span key={i} className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold capitalize">
                        {str}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right: Cover Letter Preview */}
            <div className="lg:col-span-3 space-y-4 flex flex-col">
              <div className="flex justify-between items-center shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" /> Letter Canvas Preview
                </span>
                {letterContent && (
                  <Button
                    onClick={handleDownloadPDF}
                    size="sm"
                    loading={pdfLoading}
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download Letter PDF
                  </Button>
                )}
              </div>

              <div className="flex-1 bg-white rounded-2xl shadow-xl p-8 text-black min-h-[500px] flex flex-col justify-between font-sans select-text border-t-4 border-indigo-600">
                {letterContent ? (
                  <div className="space-y-4 text-xs leading-relaxed text-gray-800 whitespace-pre-wrap text-left">
                    {letterContent}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-20">
                    <AlertCircle className="w-8 h-8 text-gray-300" />
                    <p className="text-xs font-medium text-gray-400">No cover letter generated yet.</p>
                    <p className="text-[10px] text-gray-500 font-light max-w-xs leading-relaxed">
                      Complete inputs on the left to review custom career alignment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
