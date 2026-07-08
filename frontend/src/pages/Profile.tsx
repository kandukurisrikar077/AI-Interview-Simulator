import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Globe, MapPin, Briefcase, GraduationCap, Sparkles, Plus, X, Check, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useToast } from '../context/ToastContext'
import { Badge } from '../components/ui/Badge'

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

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()

  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'professional' | 'skills'>('personal')
  const [saving, setSaving] = useState(false)

  // Personal Info Form State
  const [fullName, setFullName] = useState('')
  const [profilePhoto, setProfilePhoto] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  // Academic Info Form State
  const [college, setCollege] = useState('')
  const [degree, setDegree] = useState('')
  const [branch, setBranch] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [cgpa, setCgpa] = useState('')

  // Professional / Preferences State
  const [currentStatus, setCurrentStatus] = useState('Student')
  const [experience, setExperience] = useState('')
  const [preferredRole, setPreferredRole] = useState('')
  const [preferredCompanyType, setPreferredCompanyType] = useState('Product-based')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('Python')

  // Skills Tag State
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  // Set initial states from user context
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setProfilePhoto(user.profile_photo || '')
      setPhoneNumber(user.phone_number || '')
      setCountry(user.country || '')
      setCity(user.city || '')
      setLinkedinUrl(user.linkedin_url || '')
      setGithubUrl(user.github_url || '')
      setPortfolioUrl(user.portfolio_url || '')

      setCollege(user.college || '')
      setDegree(user.degree || '')
      setBranch(user.branch || '')
      setGraduationYear(user.graduation_year ? String(user.graduation_year) : '')
      setCgpa(user.cgpa ? String(user.cgpa) : '')

      setCurrentStatus(user.current_status || 'Student')
      setExperience(user.experience || '')
      setPreferredRole(user.preferred_role || '')
      setPreferredCompanyType(user.preferred_company_type || 'Product-based')
      setPreferredLocation(user.preferred_location || '')
      setPreferredLanguage(user.preferred_language || 'Python')

      setSkills(user.skills_tags || [])
    }
  }, [user])

  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = newSkill.trim()
    if (clean && !skills.includes(clean)) {
      setSkills([...skills, clean])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const payload = {
        full_name: fullName || null,
        profile_photo: profilePhoto || null,
        phone_number: phoneNumber || null,
        country: country || null,
        city: city || null,
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        portfolio_url: portfolioUrl || null,
        college: college || null,
        degree: degree || null,
        branch: branch || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        current_status: currentStatus,
        experience: experience || null,
        preferred_role: preferredRole || null,
        preferred_company_type: preferredCompanyType,
        preferred_location: preferredLocation || null,
        preferred_language: preferredLanguage,
        skills_tags: skills
      }

      const res = await apiClient.patch('/auth/me', payload)
      updateUser(res.data)
      toastSuccess('Profile updated successfully!')
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  // Compute profile completion percentage
  const totalFields = 11
  let filledFields = 0
  if (fullName) filledFields++
  if (phoneNumber) filledFields++
  if (country) filledFields++
  if (city) filledFields++
  if (college) filledFields++
  if (degree) filledFields++
  if (branch) filledFields++
  if (graduationYear) filledFields++
  if (currentStatus) filledFields++
  if (preferredRole) filledFields++
  if (skills.length > 0) filledFields++
  const completionPercent = Math.round((filledFields / totalFields) * 100)

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Profile Summary Card */}
        <Card className="p-6 md:p-8 flex flex-col md:flex-row items-center md:justify-between gap-6 border-white/5 bg-[#0d1226]/60">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center text-purple-400 overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-white">{fullName || 'Set Your Full Name'}</h2>
              <p className="text-sm text-gray-400 font-light flex items-center gap-1.5 justify-center md:justify-start">
                <Mail className="w-3.5 h-3.5 text-purple-400" /> {user?.email}
              </p>
              {preferredRole && (
                <Badge variant="primary" className="mt-1">{preferredRole}</Badge>
              )}
            </div>
          </div>
          
          <div className="shrink-0 w-full md:w-auto flex flex-col items-center md:items-end gap-2.5">
            <div className="text-right">
              <span className="text-xs text-gray-500 font-semibold block uppercase">Profile Setup Progress</span>
              <span className="text-2xl font-black text-purple-400">{completionPercent}%</span>
            </div>
            <div className="w-full md:w-48 h-2 bg-gray-900 border border-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </Card>

        {/* Tab Controls and Forms */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tab Selector Links */}
          <div className="md:col-span-1 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-2 border-b md:border-b-0 border-white/5 pb-4 md:pb-0">
            {[
              { id: 'personal', label: 'Personal Details', icon: <User className="w-4 h-4" /> },
              { id: 'academic', label: 'Academic History', icon: <GraduationCap className="w-4 h-4" /> },
              { id: 'professional', label: 'Career Preferences', icon: <Briefcase className="w-4 h-4" /> },
              { id: 'skills', label: 'Skills & Keywords', icon: <Sparkles className="w-4 h-4" /> }
            ].map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                      : 'border border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Form Fields Card */}
          <div className="md:col-span-3">
            <Card className="p-6 md:p-8 space-y-6">
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Alexis Carter" />
                    <Input label="Profile Photo URL" value={profilePhoto} onChange={e => setProfilePhoto(e.target.value)} placeholder="https://example.com/avatar.jpg" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" />
                    <Input label="Country" value={country} onChange={e => setCountry(e.target.value)} placeholder="United States" />
                    <Input label="City" value={city} onChange={e => setCity(e.target.value)} placeholder="New York" />
                  </div>
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Social Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input label="LinkedIn URL" icon={<Linkedin className="w-4 h-4" />} value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" />
                      <Input label="GitHub URL" icon={<Github className="w-4 h-4" />} value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/username" />
                      <Input label="Portfolio URL" icon={<Globe className="w-4 h-4" />} value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://username.dev" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Academic History</h3>
                  <div className="space-y-4">
                    <Input label="College / University" value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. Stanford University" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Degree" value={degree} onChange={e => setDegree(e.target.value)} placeholder="e.g. Bachelor of Science" />
                      <Input label="Branch / Major" value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. Computer Science" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Graduation Year" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} type="number" placeholder="2024" />
                      <Input label="CGPA / Score" value={cgpa} onChange={e => setCgpa(e.target.value)} type="number" step="0.01" placeholder="3.8 / 4.0" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'professional' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Career Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Status</label>
                      <select
                        value={currentStatus}
                        onChange={e => setCurrentStatus(e.target.value)}
                        className="w-full py-2.5 pl-4 pr-10 rounded-lg border bg-gray-950/60 border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 text-white outline-none transition-all text-sm"
                      >
                        <option value="Student">Student</option>
                        <option value="Fresher">Fresher</option>
                        <option value="Working Professional">Working Professional</option>
                      </select>
                    </div>
                    <Input label="Preferred Role" value={preferredRole} onChange={e => setPreferredRole(e.target.value)} placeholder="e.g. Software Engineer" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferred Company Type</label>
                      <select
                        value={preferredCompanyType}
                        onChange={e => setPreferredCompanyType(e.target.value)}
                        className="w-full py-2.5 pl-4 pr-10 rounded-lg border bg-gray-950/60 border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 text-white outline-none transition-all text-sm"
                      >
                        <option value="Startup">Startup</option>
                        <option value="Product-based">Product-based</option>
                        <option value="Service-based">Service-based</option>
                        <option value="FAANG / MAANG">FAANG / MAANG</option>
                      </select>
                    </div>
                    <Input label="Preferred Location" value={preferredLocation} onChange={e => setPreferredLocation(e.target.value)} placeholder="e.g. Remote / Seattle" />
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferred Interview Language</label>
                      <select
                        value={preferredLanguage}
                        onChange={e => setPreferredLanguage(e.target.value)}
                        className="w-full py-2.5 pl-4 pr-10 rounded-lg border bg-gray-950/60 border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 text-white outline-none transition-all text-sm"
                      >
                        <option value="Python">Python</option>
                        <option value="Java">Java</option>
                        <option value="JavaScript">JavaScript</option>
                        <option value="TypeScript">TypeScript</option>
                        <option value="C++">C++</option>
                        <option value="Go">Go</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Input label="Brief Experience Summary" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 1 year of internship experience in React, and building RESTful backend servers." />
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Skills Tags</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    Add tags for skills, tools, and technical keywords. These will be parsed during interview setup simulation.
                  </p>
                  
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="e.g. TypeScript, Redis, Docker" className="flex-1" />
                    <Button type="button" onClick={() => handleAddSkill()} className="shrink-0 pt-3" size="sm" icon={<Plus className="w-4 h-4" />} />
                  </form>

                  <div className="flex flex-wrap gap-2 pt-2 min-h-24 p-4 border border-white/5 rounded-xl bg-gray-950/40">
                    {skills.length > 0 ? (
                      skills.map((skill, index) => (
                        <div key={index} className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <span>{skill}</span>
                          <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-400 transition-colors text-purple-400/70 ml-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-600 font-light flex items-center justify-center w-full">No skills tags added yet.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <span className="text-[10px] text-gray-600">All data is encrypted and saved securely.</span>
                <Button onClick={handleSaveProfile} loading={saving} icon={<Check className="w-4.5 h-4.5" />}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
