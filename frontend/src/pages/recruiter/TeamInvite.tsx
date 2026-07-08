import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Users, Check, AlertCircle, Plus } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'

export const TeamInvite: React.FC = () => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('recruiter')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [invitedTeammates, setInvitedTeammates] = useState([
    { email: 'sarah.jones@acme.org', role: 'recruiter', status: 'Active' },
    { email: 'dev-lead@acme.org', role: 'viewer', status: 'Pending' }
  ])

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setTimeout(() => {
      setInvitedTeammates(prev => [...prev, { email, role, status: 'Pending' }])
      setSuccess(true)
      setEmail('')
      setLoading(false)
      setTimeout(() => setSuccess(false), 3000)
    }, 1000)
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
            Invite Team Members
          </h1>
          <p className="text-xs text-gray-400 mt-1">Add colleagues, managers, and observers to coordinate candidate reviews and interview loops.</p>
        </div>

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400 shrink-0" />
            Invitation email sent successfully! Teammate added as pending.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form */}
          <Card className="p-6 border-white/5 bg-[#080d1a]/60 shadow-xl h-fit">
            <h2 className="text-sm font-bold text-white mb-4">Send New Invitation</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label="Work Email Address"
                placeholder="colleague@company.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Access Privilege</label>
                <Select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  options={[
                    { value: 'recruiter', label: 'Co-Recruiter (Full Access)' },
                    { value: 'viewer', label: 'Reviewer / Viewer Only' }
                  ]}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                icon={<Send className="w-4 h-4" />}
                className="w-full mt-2"
              >
                Send Invite
              </Button>
            </form>
          </Card>

          {/* Directory */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Workspace Directory</h2>
            <Card className="border-white/5 bg-[#080d1a]/40 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <th className="py-4 px-6">Member Email</th>
                    <th className="py-4 px-6">Access Level</th>
                    <th className="py-4 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {invitedTeammates.map((member, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6 font-medium text-white">{member.email}</td>
                      <td className="py-4 px-6 text-gray-400 capitalize">{member.role}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.status === 'Active' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
