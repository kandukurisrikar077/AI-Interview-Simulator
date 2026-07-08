import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, FileText, Download, Sparkles, Plus, Trash2, 
  Check, Loader2, Edit3, Eye, Smartphone, Monitor
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import apiClient from '../services/api'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Sidebar } from '../components/layout/Sidebar'

interface Experience {
  company: string
  role: string
  duration: string
  description: string
}

interface Project {
  title: string
  tech: string
  description: string
}

export const ResumeBuilder: React.FC = () => {
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()

  // State values for custom resume fields
  const [name, setName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone_number || '')
  const [college, setCollege] = useState(user?.college || '')
  const [degree, setDegree] = useState(user?.degree || '')
  const [branch, setBranch] = useState(user?.branch || '')
  
  const [skillsText, setSkillsText] = useState('')
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [achievementsText, setAchievementsText] = useState('')

  // Template select
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'minimal' | 'creative'>('modern')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)

  // Load from existing parsed resume on mount if available
  useEffect(() => {
    const fetchExistingResume = async () => {
      try {
        const res = await apiClient.get('/resumes/me')
        if (res.data) {
          const rData = res.data
          if (rData.name) setName(rData.name)
          if (rData.email) setEmail(rData.email)
          if (rData.phone) setPhone(rData.phone)
          if (rData.college) setCollege(rData.college)
          if (rData.degree) setDegree(rData.degree)
          if (rData.branch) setBranch(rData.branch)
          
          if (rData.skills) {
            const parsedSkills = typeof rData.skills === 'string' ? JSON.parse(rData.skills) : rData.skills
            setSkillsText(Array.isArray(parsedSkills) ? parsedSkills.join(', ') : '')
          }
          if (rData.experience) {
            const parsedExp = typeof rData.experience === 'string' ? JSON.parse(rData.experience) : rData.experience
            setExperiences(Array.isArray(parsedExp) ? parsedExp : [])
          }
          if (rData.projects) {
            const parsedPrj = typeof rData.projects === 'string' ? JSON.parse(rData.projects) : rData.projects
            setProjects(Array.isArray(parsedPrj) ? parsedPrj : [])
          }
          if (rData.achievements) {
            const parsedAch = typeof rData.achievements === 'string' ? JSON.parse(rData.achievements) : rData.achievements
            setAchievementsText(Array.isArray(parsedAch) ? parsedAch.join('\n') : '')
          }
        }
      } catch (err) {
        console.log('No existing resume found, starting from scratch.')
      }
    }
    fetchExistingResume()
  }, [])

  // AI Optimizer
  const handleAIOptimize = async (fieldKey: string, value: string, updateFn: (v: string) => void) => {
    if (!value.trim()) {
      toastError('Field content is empty. Type some details first.')
      return
    }
    setAiLoading(fieldKey)
    try {
      const res = await apiClient.post('/placement/resume-builder/improve', {
        field_name: fieldKey,
        field_value: value,
        target_role: user?.preferred_role || 'Software Engineer'
      })
      updateFn(res.data.improved_text)
      toastSuccess('Optimized resume field using AI successfully!')
    } catch (err) {
      toastError('Failed to run AI optimizer.')
    } finally {
      setAiLoading(null)
    }
  }

  // AI list item optimize helpers
  const handleAIOptimizeExperience = async (idx: number) => {
    const item = experiences[idx]
    if (!item.description.trim()) return
    setAiLoading(`exp-${idx}`)
    try {
      const res = await apiClient.post('/placement/resume-builder/improve', {
        field_name: 'Experience Description',
        field_value: item.description,
        target_role: user?.preferred_role || 'Software Engineer'
      })
      const updated = [...experiences]
      updated[idx].description = res.data.improved_text
      setExperiences(updated)
      toastSuccess('Enhanced experience bullet points using AI!')
    } catch {
      toastError('AI enhance failed.')
    } finally {
      setAiLoading(null)
    }
  }

  const handleAIOptimizeProject = async (idx: number) => {
    const item = projects[idx]
    if (!item.description.trim()) return
    setAiLoading(`prj-${idx}`)
    try {
      const res = await apiClient.post('/placement/resume-builder/improve', {
        field_name: 'Project Description',
        field_value: item.description,
        target_role: user?.preferred_role || 'Software Engineer'
      })
      const updated = [...projects]
      updated[idx].description = res.data.improved_text
      setProjects(updated)
      toastSuccess('Enhanced project bullet points using AI!')
    } catch {
      toastError('AI enhance failed.')
    } finally {
      setAiLoading(null)
    }
  }

  // Experience handlers
  const addExperience = () => {
    setExperiences([...experiences, { company: '', role: '', duration: '', description: '' }])
  }

  const updateExperience = (idx: number, key: keyof Experience, val: string) => {
    const updated = [...experiences]
    updated[idx] = { ...updated[idx], [key]: val }
    setExperiences(updated)
  }

  const removeExperience = (idx: number) => {
    setExperiences(experiences.filter((_, i) => i !== idx))
  }

  // Project handlers
  const addProject = () => {
    setProjects([...projects, { title: '', tech: '', description: '' }])
  }

  const updateProject = (idx: number, key: keyof Project, val: string) => {
    const updated = [...projects]
    updated[idx] = { ...updated[idx], [key]: val }
    setProjects(updated)
  }

  const removeProject = (idx: number) => {
    setProjects(projects.filter((_, i) => i !== idx))
  }

  // Download PDF
  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean)
      const achievements = achievementsText.split('\n').map(a => a.trim()).filter(Boolean)

      const response = await apiClient.post('/placement/resume-builder/pdf', {
        name,
        email,
        phone,
        college,
        degree,
        branch,
        skills,
        experience: experiences,
        projects,
        achievements
      }, { responseType: 'blob' })

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'resume_builder_export.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toastSuccess('Downloaded formatted resume PDF!')
    } catch (err) {
      toastError('Failed to generate resume PDF.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <header className="flex justify-between items-center pb-4 border-b border-white/5">
            <div className="space-y-1">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tight">AI Resume Builder</h1>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value as any)}
                className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="modern">Modern Classic</option>
                <option value="minimal">Minimal Elegant</option>
                <option value="creative">Creative Tech</option>
              </select>
              <Button onClick={handleDownloadPDF} loading={pdfLoading} icon={<Download className="w-4 h-4" />}>
                Download PDF
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Side: Editor Form */}
            <div className="space-y-6">
              <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">1. Contact & Academic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
                  <Input label="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                  <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
                  <Input label="College/University" value={college} onChange={e => setCollege(e.target.value)} />
                  <Input label="Degree" value={degree} onChange={e => setDegree(e.target.value)} />
                  <Input label="Branch/Specialization" value={branch} onChange={e => setBranch(e.target.value)} />
                </div>
              </Card>

              {/* Skills */}
              <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">2. Technical Skills</h3>
                  <button
                    onClick={() => handleAIOptimize('skills', skillsText, setSkillsText)}
                    disabled={aiLoading === 'skills'}
                    className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {aiLoading === 'skills' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Optimize with AI
                  </button>
                </div>
                <textarea
                  value={skillsText}
                  onChange={e => setSkillsText(e.target.value)}
                  placeholder="React, TypeScript, Node.js, Python, PostgreSQL..."
                  className="w-full h-16 bg-gray-950/60 border border-white/10 rounded-xl p-3 text-xs text-gray-300 placeholder-gray-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 resize-none font-light"
                />
              </Card>

              {/* Experience list */}
              <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">3. Work Experience</h3>
                  <Button size="sm" onClick={addExperience} icon={<Plus className="w-3 h-3" />}>Add Item</Button>
                </div>
                <div className="space-y-6">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-4 relative">
                      <button onClick={() => removeExperience(idx)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Company" value={exp.company} onChange={e => updateExperience(idx, 'company', e.target.value)} />
                        <Input label="Role" value={exp.role} onChange={e => updateExperience(idx, 'role', e.target.value)} />
                        <Input label="Duration" value={exp.duration} onChange={e => updateExperience(idx, 'duration', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-gray-500 uppercase font-bold">Bullet Description</label>
                          <button
                            onClick={() => handleAIOptimizeExperience(idx)}
                            disabled={aiLoading === `exp-${idx}`}
                            className="flex items-center gap-1 text-[9px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
                          >
                            {aiLoading === `exp-${idx}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Enhance bullets
                          </button>
                        </div>
                        <textarea
                          value={exp.description}
                          onChange={e => updateExperience(idx, 'description', e.target.value)}
                          placeholder="Describe your technical contributions, deployment architectures, and engineering metrics..."
                          className="w-full h-20 bg-gray-950/60 border border-white/10 rounded-xl p-3 text-xs text-gray-300 outline-none focus:border-purple-500 font-light resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Projects */}
              <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">4. Personal Projects</h3>
                  <Button size="sm" onClick={addProject} icon={<Plus className="w-3 h-3" />}>Add Project</Button>
                </div>
                <div className="space-y-6">
                  {projects.map((prj, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-4 relative">
                      <button onClick={() => removeProject(idx)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Project Title" value={prj.title} onChange={e => updateProject(idx, 'title', e.target.value)} />
                        <Input label="Technologies Used" value={prj.tech} onChange={e => updateProject(idx, 'tech', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-gray-500 uppercase font-bold">Project Details</label>
                          <button
                            onClick={() => handleAIOptimizeProject(idx)}
                            disabled={aiLoading === `prj-${idx}`}
                            className="flex items-center gap-1 text-[9px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
                          >
                            {aiLoading === `prj-${idx}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Enhance project details
                          </button>
                        </div>
                        <textarea
                          value={prj.description}
                          onChange={e => updateProject(idx, 'description', e.target.value)}
                          placeholder="Propose detailed architectural patterns, APIs used, and performance metrics accomplished..."
                          className="w-full h-20 bg-gray-950/60 border border-white/10 rounded-xl p-3 text-xs text-gray-300 outline-none focus:border-purple-500 font-light resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Achievements */}
              <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">5. Achievements</h3>
                  <button
                    onClick={() => handleAIOptimize('achievements', achievementsText, setAchievementsText)}
                    disabled={aiLoading === 'achievements'}
                    className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    {aiLoading === 'achievements' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Optimize details
                  </button>
                </div>
                <textarea
                  value={achievementsText}
                  onChange={e => setAchievementsText(e.target.value)}
                  placeholder="Secured 1st rank in Hackathon...&#10;Contributed core fixes to open-source libraries..."
                  className="w-full h-20 bg-gray-950/60 border border-white/10 rounded-xl p-3 text-xs text-gray-300 outline-none focus:border-purple-500 font-light resize-none"
                />
              </Card>
            </div>

            {/* Right Side: Live preview */}
            <div className="space-y-4 lg:sticky lg:top-8 h-fit">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-400" /> Live Resume View
                </span>
                <span className="text-[10px] text-gray-500">ATS friendly layout calibrated</span>
              </div>

              {/* Render dynamic canvas mimicking paper sheets */}
              <div className={`w-full bg-white rounded-2xl shadow-2xl p-8 text-black min-h-[750px] font-sans border-t-4 select-none ${
                selectedTemplate === 'modern' ? 'border-purple-650' : selectedTemplate === 'creative' ? 'border-fuchsia-600' : 'border-gray-900'
              }`}>
                {/* Header */}
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 leading-tight">{name || 'Your Full Name'}</h2>
                  <p className="text-[10px] text-gray-500">
                    {email || 'name@email.com'} {phone && `| ${phone}`} {college && `| ${college}`}
                  </p>
                  {degree && (
                    <p className="text-[9px] text-gray-400 italic">
                      {degree} {branch && `in ${branch}`}
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-5 text-left text-xs">
                  {/* Skills Section */}
                  {skillsText && (
                    <div className="space-y-1">
                      <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${
                        selectedTemplate === 'modern' ? 'text-purple-600' : selectedTemplate === 'creative' ? 'text-fuchsia-600' : 'text-gray-900'
                      }`}>Technical Skills</h4>
                      <p className="text-[10px] text-gray-700 leading-normal">{skillsText}</p>
                    </div>
                  )}

                  {/* Experiences Section */}
                  {experiences.length > 0 && (
                    <div className="space-y-3">
                      <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${
                        selectedTemplate === 'modern' ? 'text-purple-600' : selectedTemplate === 'creative' ? 'text-fuchsia-600' : 'text-gray-900'
                      }`}>Work Experience</h4>
                      <div className="space-y-2">
                        {experiences.map((exp, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between font-bold text-gray-900 text-[10px]">
                              <span>{exp.role || 'Role Title'} {exp.company && `at ${exp.company}`}</span>
                              <span className="font-normal text-gray-500">{exp.duration || 'Duration'}</span>
                            </div>
                            <p className="text-[9px] text-gray-600 leading-relaxed">{exp.description || 'Description bullet details'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects Section */}
                  {projects.length > 0 && (
                    <div className="space-y-3">
                      <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${
                        selectedTemplate === 'modern' ? 'text-purple-600' : selectedTemplate === 'creative' ? 'text-fuchsia-600' : 'text-gray-900'
                      }`}>Personal Projects</h4>
                      <div className="space-y-2">
                        {projects.map((prj, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between font-bold text-gray-900 text-[10px]">
                              <span>{prj.title || 'Project Title'}</span>
                              <span className="font-normal text-gray-500 italic">{prj.tech || 'Techstack'}</span>
                            </div>
                            <p className="text-[9px] text-gray-600 leading-relaxed">{prj.description || 'Project details bullet point description'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {achievementsText && (
                    <div className="space-y-1">
                      <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${
                        selectedTemplate === 'modern' ? 'text-purple-600' : selectedTemplate === 'creative' ? 'text-fuchsia-600' : 'text-gray-900'
                      }`}>Achievements</h4>
                      <div className="space-y-1">
                        {achievementsText.split('\n').map((ach, i) => (
                          <p key={i} className="text-[9px] text-gray-600 leading-normal">• {ach}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
