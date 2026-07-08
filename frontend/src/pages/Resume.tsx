import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, FileText, Upload, CheckCircle, AlertCircle, Loader2, Sparkles, 
  Building, GraduationCap, Briefcase, Plus, X, Check, ExternalLink, Calendar, 
  MapPin, User, Mail, Phone, Globe, Award, BookOpen, AlertTriangle
} from 'lucide-react'
import apiClient from '../services/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useToast } from '../context/ToastContext'
import { Breadcrumbs } from '../components/common/Breadcrumbs'

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

interface Experience {
  company: string
  role: string
  duration: string
  description: string
}

interface Internship {
  company: string
  role: string
  duration: string
  description: string
}

interface Education {
  institution: string
  degree: string
  branch: string
  year: string
}

interface Project {
  name: string
  description: string
  technologies: string[]
}

interface Certificate {
  name: string
  issuer: string
  year: string
}

interface AIImprovement {
  original: string
  improved: string
  reason: string
}

interface RoleRecommendation {
  role: string
  match_percentage: number
}

interface RoadmapWeek {
  week: string
  topic: string
  details: string
}

interface ResumeData {
  id: number
  name?: string
  email?: string
  phone?: string
  college?: string
  degree?: string
  branch?: string
  graduation_year?: number
  github?: string
  linkedin?: string
  portfolio?: string
  
  skills: string[]
  experience: Experience[]
  education: Education[]
  projects: Project[]
  internships: Internship[]
  certificates: Certificate[]
  achievements: string[]
  languages: string[]
  
  resume_score?: number
  ats_score?: number
  strengths?: string[]
  weaknesses?: string[]
  missing_skills?: string[]
  ai_improvements?: AIImprovement[]
  role_recommendations?: RoleRecommendation[]
  learning_roadmap?: RoadmapWeek[]
  
  file_path: string
  uploaded_at: string
}

export const Resume: React.FC = () => {
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  
  // Tabs: 'parsed' or 'analysis'
  const [activeTab, setActiveTab] = useState<'parsed' | 'analysis'>('analysis')

  const { success: toastSuccess, error: toastError } = useToast()

  // Fetch current active resume on mount
  const fetchResume = async () => {
    try {
      const res = await apiClient.get('/resumes/me')
      setResumeData(res.data)
    } catch (err) {
      // Empty state
      setResumeData(null)
    }
  }

  useEffect(() => {
    fetchResume()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndUpload(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      validateAndUpload(selectedFile)
    }
  }

  const validateAndUpload = async (selectedFile: File) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setUploadProgress(0)

    const nameLower = selectedFile.name.toLowerCase()
    const isPDF = selectedFile.type === 'application/pdf' || nameLower.endsWith('.pdf')
    const isDOCX = selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || nameLower.endsWith('.docx')

    if (!isPDF && !isDOCX) {
      toastError('Only PDF and DOCX resume formats are supported.')
      setError('Only PDF and DOCX resume formats are supported.')
      setLoading(false)
      setUploadProgress(null)
      return
    }

    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (selectedFile.size > MAX_SIZE) {
      toastError('File size exceeds the 10MB limit.')
      setError('File size exceeds the 10MB limit.')
      setLoading(false)
      setUploadProgress(null)
      return
    }

    // Simulate progress while uploading and parsing
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => {
        if (p === null) return 0
        if (p >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return p + 8
      })
    }, 180)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await apiClient.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      clearInterval(progressInterval)
      setUploadProgress(100)
      setResumeData(res.data)
      setSuccess(true)
      toastSuccess('Resume parsed and calibrated successfully!')
      setTimeout(() => setUploadProgress(null), 800)
    } catch (err: any) {
      clearInterval(progressInterval)
      setError(err.response?.data?.detail || 'Failed to upload and parse resume.')
      toastError(err.response?.data?.detail || 'Failed to process resume.')
      setUploadProgress(null)
    } finally {
      setLoading(false)
    }
  }

  // Helper to render circle progress meter
  const CircleMeter: React.FC<{ score: number; label: string; color: string }> = ({ score, label, color }) => {
    const radius = 32
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r={radius} className="stroke-gray-800" strokeWidth="6" fill="transparent" />
            <circle 
              cx="40" 
              cy="40" 
              r={radius} 
              className={color} 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-black text-white">{score}%</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs />
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <header>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Resume Center <span className="text-xs bg-purple-500/15 border border-purple-500/20 text-purple-300 font-normal px-2.5 py-1 rounded-full">AI Parser Active</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">Upload your resume to calibrate and custom-tailor simulated interview questions.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Widget Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="space-y-6">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Parser Controls</h2>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-purple-500 bg-purple-500/5'
                    : 'border-white/5 bg-gray-950/40 hover:border-white/10'
                }`}
              >
                <input
                  type="file"
                  id="resume-upload"
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  className="hidden"
                  disabled={loading}
                />
                <label htmlFor="resume-upload" className="cursor-pointer w-full h-full block">
                  {loading ? (
                    <div className="py-6 flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
                      <p className="text-sm font-semibold text-white">Extracting & Calibrating...</p>
                      {uploadProgress !== null && (
                        <div className="w-full max-w-[150px] space-y-1.5 mt-3">
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-purple-500 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono block">{uploadProgress}%</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center">
                      <Upload className="w-10 h-10 text-purple-400 mb-4" />
                      <p className="text-sm font-semibold text-white">Drag & drop resume PDF or DOCX</p>
                      <p className="text-xs text-gray-500 mt-2">Maximum 10MB limit</p>
                    </div>
                  )}
                </label>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-2.5 p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-2.5 p-3.5 rounded-lg border border-green-500/20 bg-green-500/5 text-green-400 text-xs"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Resume parsed and saved successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {resumeData && (
                <div className="border-t border-white/5 pt-4 text-[10px] text-gray-500 flex justify-between items-center">
                  <span className="truncate max-w-[140px]">File: {resumeData.file_path}</span>
                  <span>Uploaded: {new Date(resumeData.uploaded_at).toLocaleDateString()}</span>
                </div>
              )}
            </Card>

            {resumeData && (
              <Card className="p-6 space-y-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Scoring Panel</h3>
                <div className="flex justify-around items-center pt-2">
                  <CircleMeter score={resumeData.resume_score || 70} label="Resume Quality" color="stroke-indigo-400" />
                  <CircleMeter score={resumeData.ats_score || 70} label="ATS Score" color="stroke-purple-500" />
                </div>
                <p className="text-[10px] text-gray-500 font-light leading-relaxed text-center">
                  These metrics reflect overall profile clarity, key technology mentions, and formatting alignment.
                </p>
              </Card>
            )}
          </div>

          {/* Parsed / AI Report Details View */}
          <div className="lg:col-span-2 space-y-6">
            {resumeData ? (
              <div className="space-y-6">
                {/* View Selector Tabs */}
                <div className="flex border-b border-white/5 space-x-6">
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`flex items-center gap-2 pb-4 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'analysis'
                        ? 'border-b-2 border-purple-500 text-purple-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" /> AI Resume Intelligence
                  </button>
                  <button
                    onClick={() => setActiveTab('parsed')}
                    className={`flex items-center gap-2 pb-4 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'parsed'
                        ? 'border-b-2 border-purple-500 text-purple-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Parsed Resume Details
                  </button>
                </div>

                {/* Tab content 1: Parsed Details */}
                {activeTab === 'parsed' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Header Details */}
                    <Card className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Parsed Contact Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light text-gray-400">
                        {resumeData.name && <div className="flex items-center gap-2 text-white font-semibold"><User className="w-4 h-4 text-purple-400" /> {resumeData.name}</div>}
                        {resumeData.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-purple-400" /> {resumeData.email}</div>}
                        {resumeData.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-purple-400" /> {resumeData.phone}</div>}
                        {resumeData.github && <div className="flex items-center gap-2"><Github className="w-4 h-4 text-purple-400" /> <a href={resumeData.github} target="_blank" rel="noreferrer" className="hover:text-purple-400 underline transition-colors">{resumeData.github}</a></div>}
                        {resumeData.linkedin && <div className="flex items-center gap-2"><Linkedin className="w-4 h-4 text-purple-400" /> <a href={resumeData.linkedin} target="_blank" rel="noreferrer" className="hover:text-purple-400 underline transition-colors">{resumeData.linkedin}</a></div>}
                        {resumeData.portfolio && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-purple-400" /> <a href={resumeData.portfolio} target="_blank" rel="noreferrer" className="hover:text-purple-400 underline transition-colors">{resumeData.portfolio}</a></div>}
                      </div>
                    </Card>

                    {/* Skills */}
                    <Card className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-purple-400" /> Extracted Skills Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.length > 0 ? (
                          resumeData.skills.map((skill, index) => (
                            <Badge key={index} variant="primary">{skill}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-600 font-light">No skills extracted.</span>
                        )}
                      </div>
                    </Card>

                    {/* Professional Experience */}
                    <Card className="space-y-6">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <Briefcase className="w-4.5 h-4.5 text-indigo-400" /> Professional Experience
                      </h3>
                      <div className="space-y-6 border-l border-white/5 ml-2.5 pl-5">
                        {resumeData.experience && resumeData.experience.length > 0 ? (
                          resumeData.experience.map((exp, idx) => (
                            <div key={idx} className="relative space-y-1">
                              <div className="absolute left-[-26px] top-1.5 w-3 h-3 rounded-full bg-purple-500 border border-[#050816]" />
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="text-sm font-bold text-white">{exp.role}</h4>
                                  <p className="text-xs text-gray-500 font-medium">{exp.company}</p>
                                </div>
                                <span className="text-[10px] text-gray-500 font-semibold">{exp.duration}</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-2 font-light leading-relaxed">{exp.description}</p>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-600 font-light block">No parsed experience details found.</span>
                        )}
                      </div>
                    </Card>

                    {/* Projects */}
                    <Card className="space-y-6">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <FileText className="w-4.5 h-4.5 text-purple-400" /> Extracted Projects
                      </h3>
                      <div className="space-y-6">
                        {resumeData.projects && resumeData.projects.length > 0 ? (
                          resumeData.projects.map((proj, idx) => (
                            <div key={idx} className="border-b border-white/5 last:border-b-0 pb-4 last:pb-0 space-y-2">
                              <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                              <p className="text-xs text-gray-400 font-light leading-relaxed">{proj.description}</p>
                              {proj.technologies && proj.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {proj.technologies.map((tech, tIdx) => (
                                    <span key={tIdx} className="text-[9px] bg-gray-900 border border-white/5 px-2 py-0.5 rounded text-gray-400 font-medium">
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-600 font-light block">No parsed projects found.</span>
                        )}
                      </div>
                    </Card>

                    {/* Academic education */}
                    <Card className="space-y-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <GraduationCap className="w-4.5 h-4.5 text-indigo-400" /> Education
                      </h3>
                      <div className="space-y-4">
                        {resumeData.education && resumeData.education.length > 0 ? (
                          resumeData.education.map((edu, idx) => (
                            <div key={idx} className="space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-white text-sm">{edu.degree} {edu.branch ? `in ${edu.branch}` : ''}</h4>
                                <span className="text-gray-500 font-semibold">Class of {edu.year}</span>
                              </div>
                              <p className="text-gray-400">{edu.institution}</p>
                            </div>
                          ))
                        ) : (
                          <div className="space-y-1 text-xs font-light text-gray-400">
                            {resumeData.college && <div><span className="font-semibold text-white">College:</span> {resumeData.college}</div>}
                            {resumeData.degree && <div><span className="font-semibold text-white">Degree:</span> {resumeData.degree} {resumeData.branch ? `(${resumeData.branch})` : ''}</div>}
                            {resumeData.graduation_year && <div><span className="font-semibold text-white">Graduation:</span> {resumeData.graduation_year}</div>}
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Certificates, achievements, languages */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><Award className="w-4 h-4 text-purple-400" /> Certifications</h4>
                        <div className="space-y-2">
                          {resumeData.certificates && resumeData.certificates.length > 0 ? (
                            resumeData.certificates.map((cert, idx) => (
                              <div key={idx} className="text-[11px] leading-relaxed">
                                <span className="font-semibold text-white block">{cert.name}</span>
                                <span className="text-gray-500">{cert.issuer} ({cert.year})</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-600 block">None found.</span>
                          )}
                        </div>
                      </Card>

                      <Card className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-purple-400" /> Achievements</h4>
                        <ul className="list-disc pl-4 text-[11px] text-gray-400 space-y-1">
                          {resumeData.achievements && resumeData.achievements.length > 0 ? (
                            resumeData.achievements.map((ach, idx) => (
                              <li key={idx}>{ach}</li>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-600 block ml-[-16px]">None found.</span>
                          )}
                        </ul>
                      </Card>

                      <Card className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><Globe className="w-4 h-4 text-purple-400" /> Languages</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {resumeData.languages && resumeData.languages.length > 0 ? (
                            resumeData.languages.map((lang, idx) => (
                              <span key={idx} className="text-[10px] bg-gray-900 border border-white/5 px-2 py-0.5 rounded text-gray-400 font-semibold">{lang}</span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-600 block">None found.</span>
                          )}
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                )}

                {/* Tab content 2: AI Report & Roadmap */}
                {activeTab === 'analysis' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="space-y-4 border-green-500/10 bg-green-500/2">
                        <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle className="w-4.5 h-4.5 shrink-0" /> Resume Strengths
                        </h3>
                        <ul className="space-y-2.5 text-xs text-gray-300 font-light leading-relaxed">
                          {resumeData.strengths && resumeData.strengths.length > 0 ? (
                            resumeData.strengths.map((str, index) => (
                              <li key={index} className="flex items-start gap-2.5">
                                <span className="text-green-500 shrink-0 mt-0.5">✔</span>
                                <span>{str.replace(/^✔\s*/, '')}</span>
                              </li>
                            ))
                          ) : (
                            <span className="text-xs text-gray-600 block">No strengths metrics generated.</span>
                          )}
                        </ul>
                      </Card>

                      <Card className="space-y-4 border-red-500/10 bg-red-500/2">
                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle className="w-4.5 h-4.5 shrink-0" /> Areas of Improvement
                        </h3>
                        <ul className="space-y-2.5 text-xs text-gray-300 font-light leading-relaxed">
                          {resumeData.weaknesses && resumeData.weaknesses.length > 0 ? (
                            resumeData.weaknesses.map((weak, index) => (
                              <li key={index} className="flex items-start gap-2.5">
                                <span className="text-red-500 shrink-0 mt-0.5">❌</span>
                                <span>{weak.replace(/^❌\s*/, '')}</span>
                              </li>
                            ))
                          ) : (
                            <span className="text-xs text-gray-600 block">No weaknesses metrics generated.</span>
                          )}
                        </ul>
                      </Card>
                    </div>

                    {/* Missing Skills */}
                    <Card className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-4.5 h-4.5 text-purple-400" /> Target Role Skill Gaps
                      </h3>
                      <p className="text-xs text-gray-400 font-light leading-relaxed">
                        According to industry expectations for your target career role, you should consider acquiring the following skills:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {resumeData.missing_skills && resumeData.missing_skills.length > 0 ? (
                          resumeData.missing_skills.map((skill, index) => (
                            <div key={index} className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-3 py-1 rounded-full">
                              {skill}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-600 block font-light">No gap analysis compiled.</span>
                        )}
                      </div>
                    </Card>

                    {/* AI Improvements Bullet Point Rewriter */}
                    <Card className="space-y-5">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-purple-400" /> AI Resume Content Enhancements
                      </h3>
                      <p className="text-xs text-gray-400 font-light leading-relaxed">
                        Optimizing passive statements into metric-driven action bullet points will increase screening callback indices:
                      </p>

                      <div className="space-y-4 pt-1">
                        {resumeData.ai_improvements && resumeData.ai_improvements.length > 0 ? (
                          resumeData.ai_improvements.map((imp, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-white/5 bg-gray-950/40 space-y-3 text-xs leading-relaxed">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Before</span>
                                  <p className="text-gray-400 line-through pl-3 border-l-2 border-red-500/40 font-light">{imp.original}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Suggested Rewrite</span>
                                  <p className="text-white font-semibold pl-3 border-l-2 border-purple-500">{imp.improved}</p>
                                </div>
                              </div>
                              <div className="text-[10px] text-purple-300 font-light pt-2 border-t border-white/5 flex gap-1.5 items-center">
                                <span className="font-bold uppercase tracking-widest text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded shrink-0">Reason</span>
                                <span>{imp.reason}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-600 block font-light">No bullet re-writes generated.</span>
                        )}
                      </div>
                    </Card>

                    {/* Role Recommendations */}
                    <Card className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4.5 h-4.5 text-purple-400" /> Career Alignment Index
                      </h3>
                      <p className="text-xs text-gray-400 font-light leading-relaxed">
                        Based on technologies, experience depth, and formatting, here is your compatibility score for popular roles:
                      </p>
                      
                      <div className="space-y-3.5 pt-2">
                        {resumeData.role_recommendations && resumeData.role_recommendations.length > 0 ? (
                          resumeData.role_recommendations.map((rec, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-white">{rec.role}</span>
                                <span className="font-bold text-purple-400">{rec.match_percentage}%</span>
                              </div>
                              <div className="h-2 bg-gray-900 border border-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" 
                                  style={{ width: `${rec.match_percentage}%` }} 
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-600 block font-light">No role index calibrated.</span>
                        )}
                      </div>
                    </Card>

                    {/* Personalized Roadmap */}
                    <Card className="space-y-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4.5 h-4.5 text-purple-400" /> Personalized Learning Roadmap
                      </h3>
                      
                      <div className="space-y-6 border-l border-white/5 ml-2.5 pl-5 pt-1">
                        {resumeData.learning_roadmap && resumeData.learning_roadmap.length > 0 ? (
                          resumeData.learning_roadmap.map((week, idx) => (
                            <div key={idx} className="relative space-y-1 text-xs">
                              <div className="absolute left-[-26px] top-1.5 w-3 h-3 rounded-full bg-purple-500 border border-[#050816] flex items-center justify-center text-[7px] text-white font-bold" />
                              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block">{week.week}</span>
                              <h4 className="text-sm font-bold text-white">{week.topic}</h4>
                              <p className="text-gray-400 font-light leading-relaxed mt-1.5">{week.details}</p>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-600 block font-light">No roadmap generated.</span>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>
            ) : (
              <Card className="text-center py-24 bg-gray-950/20">
                <FileText className="w-14 h-14 text-gray-800 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Active Resume Profile</h3>
                <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed font-light">
                  Upload your CV in PDF or DOCX format. The mock engine will calibrate interview questions specifically to your profile.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
