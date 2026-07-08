import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Users, ClipboardList, TrendingUp, LogOut, 
  Search, Plus, Filter, Award, Sparkles, Building, Settings, Check, X, ArrowRight, Briefcase
} from 'lucide-react'
import { RecruiterOnboarding } from './RecruiterOnboarding'

export const RecruiterDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/workspace-select')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const isOnboardingCompleted = !!user.recruiter_onboarding_completed

  if (!isOnboardingCompleted) {
    return <RecruiterOnboarding onComplete={() => {}} />
  }

  // Mock candidates data
  const initialCandidates = [
    { id: 1, name: 'Alice Johnson', email: 'alice.johnson@example.com', role: 'Senior React Developer', date: 'June 29, 2026', score: 89, status: 'Shortlisted' },
    { id: 2, name: 'Robert Smith', email: 'robert.smith@gmail.com', role: 'Backend engineer (FastAPI)', date: 'June 28, 2026', score: 76, status: 'Reviewed' },
    { id: 3, name: 'Clara Oswald', email: 'clara@outlook.com', role: 'Product Manager Intern', date: 'June 27, 2026', score: 94, status: 'Shortlisted' },
    { id: 4, name: 'Daniel Craig', email: 'daniel.c@company.com', role: 'DevOps Specialist', date: 'June 26, 2026', score: 62, status: 'Rejected' },
    { id: 5, name: 'Eva Green', email: 'eva.green@domain.com', role: 'Machine Learning Architect', date: 'June 25, 2026', score: 81, status: 'Reviewed' }
  ]

  const [candidates, setCandidates] = useState(initialCandidates)

  const handleStatusChange = (id: number, newStatus: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = [
    { label: 'Total Candidates Assessed', value: '184', icon: Users, change: '+12% this week', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Active Campaigns', value: '6', icon: ClipboardList, change: '2 custom templates', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Average Talent Score', value: '81%', icon: Award, change: '+2.4% vs industry avg', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Screening Completion Rate', value: '94.2%', icon: TrendingUp, change: 'Avg duration: 25 mins', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050816]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight text-gradient-purple">
              IntervueAI
            </span>
            <span className="text-[9px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
              Recruiter Console
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{user?.full_name || 'Recruiter Partner'}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-end">
                <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                {user?.company_name || 'Acme Solutions'}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all focus:outline-none"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent border border-white/5">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Recruiter'}! <Sparkles className="w-5 h-5 text-purple-400 animate-pulse animate-duration-1000" />
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Here is an overview of candidate assessments for <strong className="text-purple-300">{user?.company_name || 'your company'}</strong> in {user?.industry || 'your industry'}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors border border-purple-500/30 shadow-lg shadow-purple-600/20 cursor-pointer">
              <Plus className="w-4 h-4" />
              New Template
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs transition-colors border border-white/10 cursor-pointer">
              <Settings className="w-4 h-4" />
              Campaigns
            </button>
          </div>
        </div>

        {/* Recruiter Action Center */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest block">Recruiter Action Center</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Create Job Opening', desc: 'Publish a new job profile and start collecting applications.', route: '/company/jobs/create', icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Create Campaign Template', desc: 'Calibrate customized AI agent evaluation sequences.', route: '/company/templates', icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Question Bank', desc: 'Manage specific technical questions and system presets.', route: '/company/questions', icon: Search, color: 'text-pink-400', bg: 'bg-pink-500/10' },
              { label: 'Candidates Pipeline', desc: 'View applicants pipeline, reviews, and hiring pipeline.', route: '/company/candidates', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Interview Reports', desc: 'Download comprehensive ReportLab PDF review summaries.', route: '/company/reports', icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Analytics Insights', desc: 'Audit aggregate scores and candidate feedback charts.', route: '/company/analytics', icon: TrendingUp, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
              { label: 'Invite Team Members', desc: 'Share recruitment workspace credentials with your team.', route: '/company/team', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Settings', desc: 'Update organization profiles and API security tokens.', route: '/company/settings', icon: Settings, color: 'text-cyan-400', bg: 'bg-cyan-500/10' }
            ].map((action, idx) => {
              const Icon = action.icon
              return (
                <div 
                  key={idx} 
                  onClick={() => navigate(action.route)}
                  className="glass-card p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.04] transition-all flex flex-col justify-between h-40 cursor-pointer group shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className={`p-2 rounded-xl ${action.bg} ${action.color} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors pt-2">{action.label}</h3>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-light mt-0.5">{action.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Evaluation Board & Candidate List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Candidate Assessment Table */}
          <div className="lg:col-span-2 glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Talent Pipeline</h2>
                <p className="text-xs text-gray-400 mt-0.5">Real-time candidate submissions and automatic AI evaluation reports.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search candidate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 pl-8 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full sm:w-48 placeholder-gray-500"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <th className="py-4 px-6">Candidate Details</th>
                    <th className="py-4 px-6">Target Role</th>
                    <th className="py-4 px-6 text-center">AI Score</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        No candidates match your search parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-white">{c.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{c.email}</p>
                        </td>
                        <td className="py-4 px-6 text-gray-300 font-medium font-sans">
                          {c.role}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block font-black px-2 py-0.5 rounded text-[10px] ${
                            c.score >= 85 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            c.score >= 70 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {c.score}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            c.status === 'Shortlisted' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            c.status === 'Reviewed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-gray-500/10 text-gray-400 border border-white/5'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-1">
                          <button
                            onClick={() => handleStatusChange(c.id, 'Shortlisted')}
                            className="p-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-all cursor-pointer"
                            title="Shortlist"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(c.id, 'Rejected')}
                            className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Preset Templates */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Campaign Presets</h2>
              <p className="text-xs text-gray-400 mt-0.5">Quickly select or publish standardized assessments.</p>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Frontend Engineer (React)', questions: 12, time: '30m', level: 'Senior' },
                { name: 'Data Scientist (Python)', questions: 10, time: '25m', level: 'Mid' },
                { name: 'Backend Architect (FastAPI)', questions: 15, time: '45m', level: 'Lead' },
                { name: 'Product Manager (HR)', questions: 8, time: '20m', level: 'Junior' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.08] transition-all flex justify-between items-center group cursor-pointer">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.questions} questions • {item.time} • {item.level} Level</p>
                  </div>
                  <button className="px-2.5 py-1 bg-white/5 hover:bg-purple-600 rounded text-[10px] font-semibold transition-colors border border-white/10 group-hover:border-purple-500/30 cursor-pointer">
                    Use
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 rounded-xl border border-dashed border-white/10 text-center py-6">
              <p className="text-xs text-gray-500">Need specific custom-coded questions?</p>
              <button className="text-xs font-bold text-purple-400 hover:text-purple-300 mt-2 transition-colors inline-flex items-center gap-1 cursor-pointer">
                Configure Coding Presets <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
