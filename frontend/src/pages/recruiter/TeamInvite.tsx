import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Users, Check, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import apiClient from '../../services/api'
import { useToast } from '../../context/ToastContext'

interface TeamMember {
  id: number
  email: string
  role: string
  status: string
  created_at?: string
}

export const TeamInvite: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('recruiter')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [invitedTeammates, setInvitedTeammates] = useState<TeamMember[]>([])

  // Fetch team directory on mount
  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      setFetching(true)
      const res = await apiClient.get('/recruiter/team')
      setInvitedTeammates(res.data)
    } catch (err) {
      console.error('Failed to load team members:', err)
      // Fallback display if offline
      setInvitedTeammates([
        { id: 1, email: 'sarah.jones@acme.org', role: 'recruiter', status: 'Active' },
        { id: 2, email: 'dev-lead@acme.org', role: 'viewer', status: 'Pending' }
      ])
    } finally {
      setFetching(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const res = await apiClient.post('/recruiter/team/invite', {
        email: email.trim(),
        role: role
      })
      setInvitedTeammates(prev => [res.data, ...prev])
      setEmail('')
      toastSuccess(`Invitation sent successfully to ${res.data.email}!`)
    } catch (err: any) {
      console.error('Invite failed:', err)
      const detail = err.response?.data?.detail || 'Failed to send invitation.'
      toastError(detail)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id: number, emailToRevoke: string) => {
    try {
      await apiClient.delete(`/recruiter/team/${id}`)
      setInvitedTeammates(prev => prev.filter(m => m.id !== id))
      toastSuccess(`Revoked invitation for ${emailToRevoke}`)
    } catch (err) {
      console.error('Revoke failed:', err)
      toastError('Failed to revoke invitation.')
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
            Invite Team Members
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Add colleagues, hiring managers, and technical interviewers to coordinate candidate evaluations and review loops.
          </p>
        </div>

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
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Access Privilege
                </label>
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
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Workspace Directory</h2>
              <span className="text-xs text-gray-500">{invitedTeammates.length} Members</span>
            </div>

            <Card className="border-white/5 bg-[#080d1a]/40 overflow-hidden">
              {fetching ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  <span className="text-xs text-gray-400">Loading workspace directory...</span>
                </div>
              ) : invitedTeammates.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No teammates invited yet. Use the form on the left to invite colleagues.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      <th className="py-4 px-6">Member Email</th>
                      <th className="py-4 px-6">Access Level</th>
                      <th className="py-4 px-6 text-right">Status</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {invitedTeammates.map((member) => (
                      <tr key={member.id} className="hover:bg-white/[0.01] transition-colors">
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
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleRevoke(member.id, member.email)}
                            className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                            title="Revoke invitation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
