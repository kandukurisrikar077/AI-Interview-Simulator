import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Shield, Key, Building, CheckCircle } from 'lucide-react'
import apiClient from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'

export const RecruiterSettings: React.FC = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Settings State
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [companyName, setCompanyName] = useState(user?.company_name || '')
  const [companyWebsite, setCompanyWebsite] = useState(user?.company_website || '')
  const [companySize, setCompanySize] = useState(user?.company_size || '11-50')
  const [industry, setIndustry] = useState(user?.industry || 'Technology')
  const [country, setCountry] = useState(user?.country || 'United States')
  
  // Keys
  const [openaiKey, setOpenaiKey] = useState(user?.openai_api_key || '')
  const [geminiKey, setGeminiKey] = useState(user?.gemini_api_key || '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const payload = {
        full_name: fullName,
        company_name: companyName,
        company_size: companySize,
        industry: industry,
        country: country,
        openai_api_key: openaiKey || null,
        gemini_api_key: geminiKey || null
      }

      const res = await apiClient.patch('/auth/me', payload)
      updateUser(res.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col font-sans py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto space-y-6 relative z-10">
        <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Console Settings
          </h1>
          <p className="text-xs text-gray-400 mt-1">Configure workspace parameters, company profiles, and custom API tokens for evaluation models.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 text-green-400 shrink-0" />
            Recruiter profile and LLM API keys updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Section 1: API Keys */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Key className="w-4 h-4 text-purple-400" /> Evaluation Keys
            </h2>
            
            <Card className="p-6 border-white/5 bg-[#080d1a]/60 shadow-xl space-y-4">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Provide custom API keys to run candidates evaluations on your own accounts instead of our global tier limits.
              </p>

              <Input
                label="OpenAI API Key"
                type="password"
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                disabled={loading}
              />

              <Input
                label="Google Gemini API Key"
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                disabled={loading}
              />
            </Card>
          </div>

          {/* Section 2: Organization Profile */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Building className="w-4 h-4 text-purple-400" /> Workspace & Company Details
            </h2>

            <Card className="p-6 border-white/5 bg-[#080d1a]/60 shadow-xl space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  disabled={loading}
                />
                <Input
                  label="Company Name"
                  placeholder="Acme Inc."
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Headquarters Country"
                  placeholder="United States"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  disabled={loading}
                />
                
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
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Industry Sector</label>
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
                    disabled={loading}
                  />
                </div>

                <Input
                  label="Company Website (optional)"
                  placeholder="https://acme.org"
                  value={companyWebsite}
                  onChange={e => setCompanyWebsite(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button
                  type="submit"
                  loading={loading}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Settings
                </Button>
              </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
