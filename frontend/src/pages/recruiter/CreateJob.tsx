import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, ArrowLeft, Building2, MapPin, DollarSign, Users2, Calendar, FileText, CheckCircle } from 'lucide-react'
import apiClient from '../../services/api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'

export const CreateJob: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [workplaceType, setWorkplaceType] = useState('Remote')
  const [experience, setExperience] = useState('Mid Level (2-5 years)')
  const [salary, setSalary] = useState('')
  const [description, setDescription] = useState('')
  const [requiredSkills, setRequiredSkills] = useState('')
  const [preferredSkills, setPreferredSkills] = useState('')
  const [openings, setOpenings] = useState(1)
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState('Published')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !department.trim() || !location.trim() || !requiredSkills.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    const reqSkillsList = requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
    const prefSkillsList = preferredSkills.split(',').map(s => s.trim()).filter(Boolean)

    const payload = {
      title,
      description,
      location,
      department,
      workplace_type: workplaceType,
      experience,
      salary,
      required_skills: reqSkillsList,
      preferred_skills: prefSkillsList,
      openings: Number(openings),
      application_deadline: deadline || null,
      status
    }

    try {
      await apiClient.post('/recruiter/jobs', payload)
      setSuccess(true)
      setTimeout(() => {
        navigate('/company/dashboard')
      }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create job posting. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col font-sans py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />
      
      <div className="max-w-3xl w-full mx-auto space-y-6 relative z-10">
        <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Create Job Opening
          </h1>
          <p className="text-xs text-gray-400 mt-1">Publish a structured role template for automatic AI assessments.</p>
        </div>

        <Card className="p-8 border-white/5 bg-[#080d1a]/60 shadow-2xl relative overflow-hidden">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs mb-6">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/15 border border-green-500/30 rounded-xl text-green-400 text-xs mb-6 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 animate-bounce" />
              Job posting successfully created! Redirecting to Dashboard...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Job Title *"
                placeholder="Senior React Developer"
                value={title}
                onChange={e => setTitle(e.target.value)}
                icon={<Briefcase className="w-5 h-5 text-gray-500" />}
                disabled={loading}
              />

              <Input
                label="Department *"
                placeholder="Engineering / Design"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                icon={<Building2 className="w-5 h-5 text-gray-500" />}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Workplace Type</label>
                <Select
                  value={workplaceType}
                  onChange={e => setWorkplaceType(e.target.value)}
                  options={[
                    { value: 'Remote', label: 'Remote' },
                    { value: 'Hybrid', label: 'Hybrid' },
                    { value: 'Onsite', label: 'Onsite' }
                  ]}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Experience Level</label>
                <Select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  options={[
                    { value: 'Junior (0-2 years)', label: 'Junior (0-2 years)' },
                    { value: 'Mid Level (2-5 years)', label: 'Mid Level (2-5 years)' },
                    { value: 'Senior (5+ years)', label: 'Senior (5+ years)' }
                  ]}
                  disabled={loading}
                />
              </div>

              <Input
                label="Location *"
                placeholder="Remote / San Francisco"
                value={location}
                onChange={e => setLocation(e.target.value)}
                icon={<MapPin className="w-5 h-5 text-gray-500" />}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Salary Bracket"
                placeholder="e.g. $90k - $120k / yr"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                icon={<DollarSign className="w-5 h-5 text-gray-500" />}
                disabled={loading}
              />

              <Input
                label="Total Openings"
                type="number"
                placeholder="1"
                value={openings}
                onChange={e => setOpenings(Number(e.target.value))}
                icon={<Users2 className="w-5 h-5 text-gray-500" />}
                disabled={loading}
              />

              <Input
                label="Application Deadline"
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                icon={<Calendar className="w-5 h-5 text-gray-500" />}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Role Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-[#0d0f22]/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-white/5 transition-all min-h-[120px]"
                placeholder="Enter job description, daily responsibilities, etc..."
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Required Skills * (Comma separated)"
                placeholder="React, TypeScript, TailwindCSS"
                value={requiredSkills}
                onChange={e => setRequiredSkills(e.target.value)}
                icon={<FileText className="w-5 h-5 text-gray-500" />}
                disabled={loading}
              />

              <Input
                label="Preferred Skills (Comma separated)"
                placeholder="GraphQL, Next.js, Docker"
                value={preferredSkills}
                onChange={e => setPreferredSkills(e.target.value)}
                icon={<FileText className="w-5 h-5 text-gray-500" />}
                disabled={loading}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/5">
              <div className="w-1/3">
                <Select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  options={[
                    { value: 'Published', label: 'Publish Directly' },
                    { value: 'Draft', label: 'Save as Draft' }
                  ]}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="flex-1"
              >
                Create Job Posting
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
