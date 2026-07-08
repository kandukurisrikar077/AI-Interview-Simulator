import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Award, Download, ShieldCheck, Lock, 
  HelpCircle, AlertCircle, Loader2, Sparkles
} from 'lucide-react'
import apiClient from '../services/api'
import { useToast } from '../context/ToastContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Sidebar } from '../components/layout/Sidebar'

interface CertificateItem {
  id: number
  type: string
  title: string
  subtitle: string
  verification_code: string
  issued_at: string
}

export const CertificatesList: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast()

  const [certificates, setCertificates] = useState<CertificateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  // Fetch certificate list on mount
  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const res = await apiClient.get('/placement/certificates')
        setCertificates(res.data || [])
      } catch (err) {
        console.error('Failed to retrieve credentials:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCerts()
  }, [])

  const handleDownloadPDF = async (certId: number, code: string) => {
    setDownloadingId(certId)
    try {
      const response = await apiClient.get(`/placement/certificates/${certId}/pdf`, { responseType: 'blob' })

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `certificate_${code.toLowerCase()}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toastSuccess('Downloaded certificate credential PDF!')
    } catch {
      toastError('Failed to generate certificate document.')
    } finally {
      setDownloadingId(null)
    }
  }

  // Pre-seed static lock placeholder goals
  const lockedGoals = [
    { title: "Learning Roadmap Master", subtitle: "Complete all checkpoints in your 7-day study roadmap.", type: "roadmap_completion" },
    { title: "Verbal Excellence credential", subtitle: "Achieve speed score of 120+ WPM with no filler words.", type: "milestone" }
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col font-sans">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
          {/* Header */}
          <header className="flex justify-between items-center pb-4 border-b border-white/5">
            <div className="space-y-1">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tight">Earned Placements Credentials</h1>
            </div>
          </header>

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Earned list */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Unlocked Certificates</h3>
                {certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map(cert => (
                      <Card
                        key={cert.id}
                        className="p-6 border-purple-500/20 bg-[#0d1226]/50 shadow-lg shadow-purple-500/5 flex flex-col justify-between h-48 relative overflow-hidden"
                      >
                        {/* Background mesh decal */}
                        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                              <Award className="w-6 h-6 animate-pulse" />
                            </div>
                            <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono">
                              Verified
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-snug">{cert.title}</h4>
                            <p className="text-[10px] text-gray-500 mt-1 font-light leading-relaxed">{cert.subtitle}</p>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-3 mt-3 flex justify-between items-center text-[10px]">
                          <span className="text-gray-500 font-mono">ID: {cert.verification_code}</span>
                          <button
                            onClick={() => handleDownloadPDF(cert.id, cert.verification_code)}
                            disabled={downloadingId === cert.id}
                            className="flex items-center gap-1 font-bold text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            {downloadingId === cert.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                            Get PDF
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center border-white/5 bg-[#101828]/10 space-y-3 text-xs">
                    <AlertCircle className="w-8 h-8 text-gray-600 mx-auto" />
                    <div>
                      <p className="text-gray-400">No certificate credentials unlocked yet.</p>
                      <p className="text-[9px] text-gray-500 font-light mt-0.5 leading-relaxed">
                        Complete your mock interview setup or score above 80% to generate verified verification codes.
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Locked/Goal list */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Locked Targets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lockedGoals.map((goal, idx) => (
                    <Card
                      key={idx}
                      className="p-6 border-white/5 bg-gray-950/40 opacity-40 flex flex-col justify-between h-44"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="w-10 h-10 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center text-gray-600">
                            <Lock className="w-5 h-5" />
                          </div>
                          <span className="text-[9px] bg-white/5 text-gray-500 px-2 py-0.5 rounded font-mono">
                            Locked
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{goal.title}</h4>
                          <p className="text-[10px] text-gray-500 mt-1 font-light leading-relaxed">{goal.subtitle}</p>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-3 mt-3 text-[10px] text-gray-600">
                        Target Category: <span className="font-semibold text-gray-500 capitalize">{goal.type.replace('_', ' ')}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
