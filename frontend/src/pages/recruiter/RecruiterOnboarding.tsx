import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building, Globe, Users, Flag, User, Briefcase, Phone, 
  Clock, Compass, Plus, X, CheckCircle2, ArrowRight, ArrowLeft 
} from 'lucide-react'
const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)
import apiClient from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'

interface OnboardingProps {
  onComplete: () => void
}

export const RecruiterOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { user, updateUser } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Company Details
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [industry, setIndustry] = useState('Technology')
  const [companySize, setCompanySize] = useState('11-50')
  const [country, setCountry] = useState('United States')
  const [companyLogo, setCompanyLogo] = useState('')

  // Step 2: Recruiter Profile
  const [jobTitle, setJobTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [timezone, setTimezone] = useState('UTC (GMT+0)')

  // Step 3: Hiring Preferences
  const [hiringFor, setHiringFor] = useState<string[]>([])
  const [primaryRoles, setPrimaryRoles] = useState<string[]>([])

  // Step 4: First Hiring Campaign
  const [firstJobTitle, setFirstJobTitle] = useState('')
  const [firstJobExperience, setFirstJobExperience] = useState('Mid Level (2-5 years)')
  const [firstJobLocation, setFirstJobLocation] = useState('Remote')
  const [firstJobSalary, setFirstJobSalary] = useState('$80,000 - $110,000')
  const [firstJobSkillsText, setFirstJobSkillsText] = useState('')
  const [firstJobInterviewType, setFirstJobInterviewType] = useState('technical')

  const toggleHiringFor = (type: string) => {
    setHiringFor(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const togglePrimaryRole = (role: string) => {
    setPrimaryRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!companyWebsite.trim()) {
        setError('Please enter your company website.')
        return
      }
    } else if (step === 2) {
      if (!jobTitle.trim() || !department.trim() || !phoneNumber.trim()) {
        setError('Please fill in Job Title, Department, and Contact Phone.')
        return
      }
    } else if (step === 3) {
      if (hiringFor.length === 0 || primaryRoles.length === 0) {
        setError('Please select at least one hiring type and one target role.')
        return
      }
    }
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setError(null)
    if (!firstJobTitle.trim() || !firstJobSkillsText.trim()) {
      setError('Please specify the Job Title and Required Skills for your first campaign.')
      return
    }

    setLoading(true)
    const skillsList = firstJobSkillsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    const payload = {
      company_website: companyWebsite,
      industry,
      company_size: companySize,
      country,
      company_logo: companyLogo || null,
      job_title: jobTitle,
      department,
      phone_number: phoneNumber,
      linkedin_url: linkedinUrl || null,
      timezone,
      hiring_for: hiringFor,
      primary_roles: primaryRoles,
      first_job_title: firstJobTitle,
      first_job_experience: firstJobExperience,
      first_job_location: firstJobLocation,
      first_job_salary: firstJobSalary,
      first_job_skills: skillsList,
      first_job_interview_type: firstJobInterviewType
    }

    try {
      await apiClient.post('/recruiter/onboard', payload)
      // Update local user auth state
      const updatedUser = {
        ...user!,
        company_website: companyWebsite,
        industry,
        company_size: companySize,
        country,
        company_logo: companyLogo || null,
        job_title: jobTitle,
        department,
        phone_number: phoneNumber,
        linkedin_url: linkedinUrl || null,
        timezone,
        hiring_for: hiringFor,
        primary_roles: primaryRoles,
        recruiter_onboarding_completed: true
      }
      updateUser(updatedUser)
      onComplete()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Onboarding submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* Logo Header */}
        <div className="text-center">
          <span className="text-3xl font-extrabold tracking-tight text-gradient-purple">
            IntervueAI
          </span>
          <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">
            Recruiter Onboarding Setup
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex justify-between items-center px-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s 
                  ? 'bg-purple-600 border border-purple-400 text-white shadow-lg shadow-purple-500/20' 
                  : step > s 
                    ? 'bg-green-500/25 border border-green-500/40 text-green-400' 
                    : 'bg-white/5 border border-white/5 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-wider hidden sm:block ${
                step === s ? 'text-purple-300' : 'text-gray-500'
              }`}>
                {s === 1 ? 'Company' : s === 2 ? 'Profile' : s === 3 ? 'Preferences' : 'Launch'}
              </span>
            </div>
          ))}
        </div>

        {/* Main setup container */}
        <Card className="p-8 border-white/5 bg-[#080d1a]/60 shadow-2xl relative overflow-hidden">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs mb-6">
              ⚠️ {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* STEP 1: COMPANY DETAILS */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-white">Company Information</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Let candidates know more about your organization, company scale, and setup.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Company Website"
                      placeholder="https://acme.org"
                      value={companyWebsite}
                      onChange={e => setCompanyWebsite(e.target.value)}
                      icon={<Globe className="w-5 h-5 text-gray-500" />}
                    />
                    
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Industry</label>
                      <Select
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                        options={[
                          { value: 'Technology', label: 'Technology & Software' },
                          { value: 'Finance', label: 'Finance & Banking' },
                          { value: 'Healthcare', label: 'Healthcare & Biotech' },
                          { value: 'Education', label: 'Education & E-Learning' },
                          { value: 'Other', label: 'Other Industry' }
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Size</label>
                      <Select
                        value={companySize}
                        onChange={e => setCompanySize(e.target.value)}
                        options={[
                          { value: '1-10', label: '1-10 employees' },
                          { value: '11-50', label: '11-50 employees' },
                          { value: '51-200', label: '51-200 employees' },
                          { value: '201-500', label: '201-500 employees' },
                          { value: '500+', label: '500+ employees' }
                        ]}
                      />
                    </div>

                    <Input
                      label="Headquarters Country"
                      placeholder="United States"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      icon={<Flag className="w-5 h-5 text-gray-500" />}
                    />
                  </div>

                  <Input
                    label="Company Logo URL (optional)"
                    placeholder="https://logo.clearbit.com/acme.org"
                    value={companyLogo}
                    onChange={e => setCompanyLogo(e.target.value)}
                    icon={<Building className="w-5 h-5 text-gray-500" />}
                  />
                </div>
              )}

              {/* STEP 2: RECRUITER PROFILE */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-white">Your Professional Profile</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Provide your professional role context and contact coordinates for candidate messaging.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Job Title"
                      placeholder="Lead Recruiter / HRBP"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      icon={<User className="w-5 h-5 text-gray-500" />}
                    />
                    <Input
                      label="Department"
                      placeholder="Talent Acquisition / Engineering"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      icon={<Briefcase className="w-5 h-5 text-gray-500" />}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Contact Phone"
                      placeholder="+1 (555) 019-2834"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      icon={<Phone className="w-5 h-5 text-gray-500" />}
                    />
                    <Input
                      label="LinkedIn profile (optional)"
                      placeholder="https://linkedin.com/in/recruiter"
                      value={linkedinUrl}
                      onChange={e => setLinkedinUrl(e.target.value)}
                      icon={<Linkedin className="w-5 h-5 text-gray-500" />}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferred Timezone</label>
                    <Select
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      options={[
                        { value: 'UTC (GMT+0)', label: 'UTC (GMT+0) - London' },
                        { value: 'EST (GMT-5)', label: 'EST (GMT-5) - New York' },
                        { value: 'PST (GMT-8)', label: 'PST (GMT-8) - Los Angeles' },
                        { value: 'IST (GMT+5:30)', label: 'IST (GMT+5:30) - India' },
                        { value: 'CET (GMT+1)', label: 'CET (GMT+1) - Paris' }
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: HIRING PREFERENCES */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Talent Preferences</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Calibrate the matching algorithms by selecting target formats and candidate levels.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Hiring Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['Intern', 'Full Time', 'Experienced', 'Contract'].map(type => {
                        const isSelected = hiringFor.includes(type)
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggleHiringFor(type)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs uppercase ${
                              isSelected 
                                ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                                : 'bg-black/20 border-white/5 text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {type}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Target Roles (Select all that apply)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        'Software Engineer', 'Frontend', 'Backend', 
                        'Python', 'Java', 'AI/ML', 
                        'Data Analyst', 'DevOps', 'QA'
                      ].map(role => {
                        const isSelected = primaryRoles.includes(role)
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => togglePrimaryRole(role)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer text-xs font-medium ${
                              isSelected 
                                ? 'bg-purple-600/25 border-purple-500 text-purple-300 font-semibold' 
                                : 'bg-black/20 border-white/5 text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {role}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: FIRST HIRING CAMPAIGN */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-white">Create First Campaign</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Let's publish your first assessment campaign immediately to invite candidates.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Opening Job Title"
                      placeholder="Senior Full Stack Engineer"
                      value={firstJobTitle}
                      onChange={e => setFirstJobTitle(e.target.value)}
                      icon={<Briefcase className="w-5 h-5 text-gray-500" />}
                    />
                    
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Level / Experience</label>
                      <Select
                        value={firstJobExperience}
                        onChange={e => setFirstJobExperience(e.target.value)}
                        options={[
                          { value: 'Junior (0-2 years)', label: 'Junior (0-2 years)' },
                          { value: 'Mid Level (2-5 years)', label: 'Mid Level (2-5 years)' },
                          { value: 'Senior (5+ years)', label: 'Senior (5+ years)' }
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Location Preset"
                      placeholder="Remote / New York, NY"
                      value={firstJobLocation}
                      onChange={e => setFirstJobLocation(e.target.value)}
                      icon={<Compass className="w-5 h-5 text-gray-500" />}
                    />
                    <Input
                      label="Salary Bracket"
                      placeholder="$120,000 - $150,000 / yr"
                      value={firstJobSalary}
                      onChange={e => setFirstJobSalary(e.target.value)}
                      icon={<Plus className="w-5 h-5 text-gray-500" />}
                    />
                  </div>

                  <Input
                    label="Required Skills (Comma separated)"
                    placeholder="React, TypeScript, Node.js, AWS, Postgres"
                    value={firstJobSkillsText}
                    onChange={e => setFirstJobSkillsText(e.target.value)}
                    icon={<CheckCircle2 className="w-5 h-5 text-gray-500" />}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Assessment Type</label>
                    <Select
                      value={firstJobInterviewType}
                      onChange={e => setFirstJobInterviewType(e.target.value)}
                      options={[
                        { value: 'technical', label: 'Technical Rounds (Code + Tech theories)' },
                        { value: 'hr', label: 'HR Rounds (Behavioral & Communications)' },
                        { value: 'system_design', label: 'System Design Rounds' }
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex gap-4 pt-4 border-t border-white/5">
                {step > 1 && (
                  <Button
                    variant="secondary"
                    onClick={handleBack}
                    icon={<ArrowLeft className="w-4 h-4" />}
                    className="flex-1"
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
                {step < 4 ? (
                  <Button
                    onClick={handleNext}
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                    className="flex-1"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    loading={loading}
                    className="flex-1"
                  >
                    Complete & Launch Setup
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}
