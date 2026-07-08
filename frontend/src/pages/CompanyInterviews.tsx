import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, Play, Sparkles, Shield, Bookmark, Info, Star, Compass
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Sidebar } from '../components/layout/Sidebar'

interface CompanyPack {
  name: string
  roles: string[]
  color: string
  bg: string
  difficulty: string
}

export const CompanyInterviews: React.FC = () => {
  const navigate = useNavigate()
  const [selectedCompany, setSelectedCompany] = useState<CompanyPack | null>(null)
  
  // Custom round settings for modal
  const [role, setRole] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [type, setType] = useState('technical')
  const [mode, setMode] = useState('voice')
  const [duration, setDuration] = useState('30')

  const companies: CompanyPack[] = [
    { name: 'Google', roles: ['Site Reliability Engineer', 'Software Developer II', 'Systems Architect'], color: 'text-red-400', bg: 'bg-red-500/10', difficulty: 'Hard' },
    { name: 'Microsoft', roles: ['Frontend Engineer', 'Azure Infrastructure Architect', 'Data Scientist'], color: 'text-blue-400', bg: 'bg-blue-500/10', difficulty: 'Medium' },
    { name: 'Amazon', roles: ['Cloud Security Engineer', 'Systems Engineer (L5)', 'Applied Scientist'], color: 'text-orange-400', bg: 'bg-orange-500/10', difficulty: 'Hard' },
    { name: 'Adobe', roles: ['C++ Graphics Partner', 'Full Stack Developer', 'Product Designer'], color: 'text-red-500', bg: 'bg-red-500/5', difficulty: 'Medium' },
    { name: 'Atlassian', roles: ['React Systems Lead', 'SRE Tech Lead', 'Jira Product Manager'], color: 'text-blue-500', bg: 'bg-blue-500/5', difficulty: 'Hard' },
    { name: 'Oracle', roles: ['Database Engineer', 'Cloud Infrastructure Dev', 'Java Compiler Dev'], color: 'text-red-600', bg: 'bg-red-600/5', difficulty: 'Medium' },
    { name: 'NVIDIA', roles: ['CUDA Kernel Engineer', 'AI Platform Developer', 'Hardware Architect'], color: 'text-green-400', bg: 'bg-green-500/10', difficulty: 'Hard' },
    { name: 'Apple', roles: ['iOS Firmware Specialist', 'ML Core Engineer', 'CoreOS Specialist'], color: 'text-gray-300', bg: 'bg-white/5', difficulty: 'Hard' },
    { name: 'Meta', roles: ['Production Engineer', 'Distributed Systems Specialist', 'React Developer'], color: 'text-blue-400', bg: 'bg-blue-500/10', difficulty: 'Hard' },
    { name: 'Tesla', roles: ['Autopilot Systems Developer', 'Embedded C Engineer', 'Energy Analyst'], color: 'text-red-500', bg: 'bg-red-500/10', difficulty: 'Hard' },
    { name: 'Netflix', roles: ['Streaming Platforms Lead', 'UI Infrastructure Partner', 'Chaos Engineer'], color: 'text-red-650', bg: 'bg-red-650/10', difficulty: 'Hard' },
    { name: 'Uber', roles: ['Marketplace Algorithmic Lead', 'Mobile Systems Dev', 'Backend Engineer'], color: 'text-white', bg: 'bg-white/5', difficulty: 'Medium' }
  ]

  const selectCompany = (company: CompanyPack) => {
    setSelectedCompany(company)
    setRole(company.roles[0])
  }

  const handleLaunch = () => {
    if (!selectedCompany) return
    // Forward setup options to interview setup routing parameters
    const params = new URLSearchParams({
      role: `${selectedCompany.name} - ${role}`,
      difficulty,
      type,
      mode,
      duration
    })
    navigate(`/interview/setup?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col font-sans">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl mx-auto w-full space-y-6">
          {/* Header */}
          <header className="flex justify-between items-center pb-4 border-b border-white/5">
            <div className="space-y-1">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tight">Company-Specific Interview Packs</h1>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {companies.map((c, idx) => (
              <Card
                key={idx}
                onClick={() => selectCompany(c)}
                className="p-5 border-white/5 bg-[#0d1226]/40 hover:border-purple-500/30 hover:bg-[#0d1226]/60 cursor-pointer transition-all flex flex-col justify-between h-44 group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className={`p-2.5 rounded-xl ${c.bg} ${c.color} shrink-0`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] bg-white/5 border border-white/5 text-gray-400 px-2 py-0.5 rounded-full font-bold">
                      {c.difficulty} Pack
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{c.name}</h3>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed font-light">
                      HR, Technical, Behavioral, Coding, and System Design rounds.
                    </p>
                  </div>
                </div>
                <button className="w-full mt-3 py-1.5 bg-white/5 group-hover:bg-purple-650 rounded text-[10px] font-bold text-white transition-all border border-white/10 group-hover:border-purple-500/20 flex items-center justify-center gap-1 cursor-pointer">
                  Configure <Play className="w-2.5 h-2.5" />
                </button>
              </Card>
            ))}
          </div>

          {/* Configuration Overlay Modal */}
          {selectedCompany && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                    Calibrate {selectedCompany.name} Pack
                  </h3>
                  <button onClick={() => setSelectedCompany(null)} className="text-gray-500 hover:text-white transition-colors cursor-pointer text-xs">
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Target Role selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Select Job Role</label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full bg-gray-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none cursor-pointer focus:border-purple-500"
                    >
                      {selectedCompany.roles.map((r, i) => (
                        <option key={i} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Interview Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Interview Category</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: 'Technical', val: 'technical' },
                        { label: 'HR Behavioral', val: 'hr' },
                        { label: 'Coding Sandbox', val: 'coding' },
                        { label: 'System Design', val: 'design' }
                      ].map(typeItem => (
                        <button
                          key={typeItem.val}
                          onClick={() => setType(typeItem.val)}
                          className={`py-2 rounded-xl border text-center transition-all cursor-pointer font-semibold ${
                            type === typeItem.val
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/10'
                              : 'bg-gray-950 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          {typeItem.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interview Mode */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Evaluation Interface</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setMode('voice')}
                        className={`py-2 rounded-xl border text-center transition-all cursor-pointer font-semibold ${
                          mode === 'voice' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-950 border-white/10 text-gray-400'
                        }`}
                      >
                        Voice / Conversational
                      </button>
                      <button
                        onClick={() => setMode('video')}
                        className={`py-2 rounded-xl border text-center transition-all cursor-pointer font-semibold ${
                          mode === 'video' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-950 border-white/10 text-gray-400'
                        }`}
                      >
                        Video Webcam Feed
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Difficulty */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        className="w-full bg-gray-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none cursor-pointer"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Duration</label>
                      <select
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        className="w-full bg-gray-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none cursor-pointer"
                      >
                        <option value="15">15 mins</option>
                        <option value="30">30 mins</option>
                        <option value="45">45 mins</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 flex gap-3">
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLaunch}
                    className="flex-1 py-2.5 rounded-xl bg-purple-650 hover:bg-purple-600 font-bold text-xs text-white transition-colors cursor-pointer shadow-lg shadow-purple-600/10"
                  >
                    Enter Setup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
