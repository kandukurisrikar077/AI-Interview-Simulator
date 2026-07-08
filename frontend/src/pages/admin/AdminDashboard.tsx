import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { Dialog } from '../../components/ui/Dialog'
import { adminService } from '../../services/adminService'
import { mockDb } from '../../utils/mockData'
import { useAuth } from '../../context/AuthContext'
import type { MockPayment, MockPrompt } from '../../utils/mockData'
import type { User, Interview, AdminStats, QuestionBankItem } from '../../types/api'

export const AdminDashboard: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  
  const [confirmResetText, setConfirmResetText] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const handleResetDatabase = async () => {
    if (confirmResetText !== 'RESET_DATABASE_CONFIRM') {
      alert('You must type RESET_DATABASE_CONFIRM to verify database reset.')
      return
    }
    if (!window.confirm('CRITICAL WARNING: This will delete ALL users, interviews, resumes, and data from the system permanently. Proceed?')) {
      return
    }
    setResetLoading(true)
    try {
      await adminService.resetDatabase('RESET_DATABASE_CONFIRM')
      alert('Database successfully reset. You will be logged out now.')
      logout()
      navigate('/admin/login')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to reset database.')
    } finally {
      setResetLoading(false)
    }
  }

  // Real API state
  const [users, setUsers] = useState<User[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  // Mock-only state (payments, prompts, flags — no backend yet)
  const [payments, setPayments] = useState<MockPayment[]>([])
  const [prompts, setPrompts] = useState<MockPrompt[]>([])
  const [flags, setFlags] = useState<any>({ maintenance_mode: false, beta_ai_voice: true, detailed_logging: false })
  
  // Dialog states
  const [isQuestionAddOpen, setIsQuestionAddOpen] = useState(false)
  const [qCategory, setQCategory] = useState('React')
  const [qDifficulty, setQDifficulty] = useState('medium')
  const [qText, setQText] = useState('')
  const [qExpectedAnswer, setQExpectedAnswer] = useState('')
  const [questionLoading, setQuestionLoading] = useState(false)

  // User provision dialog (local only — no backend create-user API)
  const [isUserAddOpen, setIsUserAddOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user')

  const handleCreateUser = () => {
    // Local-only: backend does not have a create-user endpoint yet
    // (users register via /auth/register)
    alert('Use the public /auth/register endpoint to create users. This feature is coming soon.')
    setIsUserAddOpen(false)
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const fetchAdminData = async () => {
    setApiLoading(true)
    setApiError(null)
    try {
      const [statsData, usersData, interviewsData, questionsData] = await Promise.all([
        adminService.getStats(),
        adminService.listUsers({ limit: 200 }),
        adminService.getAllInterviews({ limit: 100 }),
        adminService.listQuestions(),
      ])
      setStats(statsData)
      setUsers(usersData)
      setInterviews(interviewsData)
      setQuestions(questionsData)
    } catch (err: any) {
      console.warn('Admin API unavailable, falling back to mock data.')
      setApiError('Backend offline — showing cached mock data.')
    } finally {
      setApiLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
    setPayments(mockDb.getPayments())
    setPrompts(mockDb.getPrompts())
    setFlags(mockDb.getFlags())
  }, [])

  const handleRoleToggle = async (userId: number) => {
    try {
      const updated = await adminService.toggleRole(userId)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch {
      alert('Failed to toggle role. Make sure the backend is running.')
    }
  }

  const handleSuspendUser = async (userId: number) => {
    try {
      const updated = await adminService.toggleSuspend(userId)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch {
      alert('Failed to suspend user.')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Permanently delete this user and all their data?')) return
    try {
      await adminService.deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      alert('Failed to delete user.')
    }
  }

  const handleAddQuestion = async () => {
    if (!qText.trim()) return
    setQuestionLoading(true)
    try {
      await adminService.addQuestion({
        category: qCategory,
        difficulty: qDifficulty,
        text: qText,
        expected_answer: qExpectedAnswer || undefined,
      })
      setQText('')
      setQExpectedAnswer('')
      setIsQuestionAddOpen(false)
      alert('Question added to the bank successfully!')
      const updatedQuestions = await adminService.listQuestions()
      setQuestions(updatedQuestions)
    } catch {
      alert('Failed to add question.')
    } finally {
      setQuestionLoading(false)
    }
  }

  const handleToggleFlag = (key: string) => {
    const nextFlags = { ...flags, [key]: !flags[key] }
    setFlags(nextFlags)
    mockDb.setFlags(nextFlags)
  }

  const handleSavePrompt = (id: string, text: string) => {
    const nextList = prompts.map((p) => (p.id === id ? { ...p, prompt: text } : p))
    setPrompts(nextList)
    mockDb.setPrompts(nextList)
    alert('AI System prompt template updated successfully.')
  }

  const path = location.pathname

  return (
    <div className="space-y-8">
      {/* 1. METRICS OVERVIEW */}
      {path === '/admin/dashboard' && (
        <div className="space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Metrics Dashboard</h1>
              <p className="text-gray-400 text-xs mt-1">Real-time analytics aggregated from your SQLite database.</p>
            </div>
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchAdminData}>
              Refresh
            </Button>
          </header>

          {apiError && (
            <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-yellow-400 text-xs">
              ⚠️ {apiError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverEffect className="p-6">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Total Users</span>
              {apiLoading ? (
                <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
              ) : (
                <span className="text-3xl font-black text-white">{stats?.total_users ?? users.length}</span>
              )}
            </Card>

            <Card hoverEffect className="p-6">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Total Interviews</span>
              {apiLoading ? (
                <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
              ) : (
                <span className="text-3xl font-black text-white">{stats?.total_interviews ?? interviews.length}</span>
              )}
            </Card>

            <Card hoverEffect className="p-6">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Avg. Score</span>
              {apiLoading ? (
                <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
              ) : (
                <span className="text-3xl font-black text-purple-400">
                  {stats?.average_score ? `${stats.average_score}%` : 'N/A'}
                </span>
              )}
            </Card>

            <Card hoverEffect className="p-6">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">System Health</span>
              <span className="text-3xl font-black text-green-400 flex items-center gap-1.5">
                <CheckCircle className="w-6 h-6 text-green-500" /> {apiError ? 'Degraded' : '100% OK'}
              </span>
            </Card>
          </div>

          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Database Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {[
                { label: 'Active Users', val: stats?.active_users },
                { label: 'Completed Interviews', val: stats?.completed_interviews },
                { label: 'Total Resumes', val: stats?.total_resumes },
              ].map(({ label, val }) => (
                <div key={label} className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</div>
                  <div className="text-white font-bold mt-0.5">
                    {apiLoading ? '...' : val ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 2. USER MANAGER */}
      {path === '/admin/users' && (() => {
        const filteredUsers = users.filter(u =>
          (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        const itemsPerPage = 3
        const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
        const paginatedUsers = filteredUsers.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        )

        return (
          <div className="space-y-6">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">User Manager</h1>
                <p className="text-gray-400 text-xs mt-1">Inspect registered profiles, update credential roles, and manage entries.</p>
              </div>
              <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchAdminData}>
                Refresh
              </Button>
            </header>

            <div className="max-w-xs">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <Table headers={['User Details', 'Role', 'Status', 'Date Registered', 'Actions']}>
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-white text-xs">{u.full_name || '—'}</div>
                    <div className="text-[10px] text-gray-500">{u.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={u.role === 'admin' ? 'primary' : 'outline'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={u.is_active ? 'success' : 'danger'}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 space-x-3">
                    <button
                      onClick={() => handleRoleToggle(u.id)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                    >
                      Toggle Role
                    </button>
                    <button
                      onClick={() => handleSuspendUser(u.id)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 font-bold cursor-pointer"
                    >
                      {u.is_active ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </Table>

            <div className="flex justify-between items-center text-xs text-gray-500 pt-4 font-mono">
              <span>Page {currentPage} of {totalPages || 1}</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 3. INTERVIEW TEMPLATES */}
      {path === '/admin/templates' && (
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-extrabold tracking-tight">Interview Templates</h1>
            <p className="text-gray-400 text-xs mt-1">Calibrate assessment presets mapping core roles and difficulties.</p>
          </header>

          <Table headers={['Target Assessment', 'Preset Tier', 'Default Length', 'Evaluation Rules']}>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-5 py-4 font-bold text-white text-xs">Technical QA Presets</td>
              <td className="px-5 py-4"><Badge variant="primary">Medium</Badge></td>
              <td className="px-5 py-4 text-xs">20 minutes</td>
              <td className="px-5 py-4 text-xs text-gray-400">Verbal loops + radar skill calculations</td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-5 py-4 font-bold text-white text-xs">Monaco Coding Round</td>
              <td className="px-5 py-4"><Badge variant="primary">Hard</Badge></td>
              <td className="px-5 py-4 text-xs">30 minutes</td>
              <td className="px-5 py-4 text-xs text-gray-400">Integrated Monaco compiler evaluations</td>
            </tr>
          </Table>
        </div>
      )}

      {/* 4. QUESTION BANK */}
      {path === '/admin/questions' && (
        <div className="space-y-6">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Question Bank</h1>
              <p className="text-gray-400 text-xs mt-1">Manage static evaluation queries and LLM prompts.</p>
            </div>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsQuestionAddOpen(true)}>
              Add Question
            </Button>
          </header>

          <Table headers={['Topic Area', 'Question Text', 'Evaluation Rubric']}>
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-4">
                  <Badge variant="primary">{q.category}</Badge>
                  <span className="text-[10px] text-gray-500 block mt-1 capitalize">({q.difficulty})</span>
                </td>
                <td className="px-5 py-4 text-xs text-white font-medium pr-10">{q.text}</td>
                <td className="px-5 py-4 text-xs text-gray-400 font-light leading-relaxed">
                  {q.expected_answer || 'No expected answer provided.'}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* 5. PROMPT CONTROLS */}
      {path === '/admin/prompts' && (
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-extrabold tracking-tight">Prompt Controls</h1>
            <p className="text-gray-400 text-xs mt-1">Calibrate Gemini system instructions mapping evaluation logic.</p>
          </header>

          <div className="space-y-6">
            {prompts.map((p) => (
              <Card key={p.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">{p.name}</span>
                  <span className="text-[10px] text-gray-500">Updated: {p.updated_at}</span>
                </div>
                <textarea
                  defaultValue={p.prompt}
                  id={`prompt-text-${p.id}`}
                  className="w-full h-24 bg-gray-950 border border-white/5 rounded-xl p-3 text-xs text-gray-300 font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      const el = document.getElementById(`prompt-text-${p.id}`) as HTMLTextAreaElement
                      if (el) handleSavePrompt(p.id, el.value)
                    }}
                  >
                    Save System Prompt
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 6. BILLING RECORDS */}
      {path === '/admin/payments' && (
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-extrabold tracking-tight">Billing Records</h1>
            <p className="text-gray-400 text-xs mt-1">Track simulated upgrade checkouts transaction logs.</p>
          </header>

          <Table headers={['Transaction ID', 'Customer email', 'Amount', 'Date Processed', 'Billing Status']}>
            {payments.map((pm, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-4 font-mono font-bold text-xs text-purple-400">{pm.id}</td>
                <td className="px-5 py-4 text-xs text-white">{pm.user}</td>
                <td className="px-5 py-4 text-xs font-bold text-white">{pm.amount}</td>
                <td className="px-5 py-4 text-xs text-gray-500">{pm.date}</td>
                <td className="px-5 py-4"><Badge variant="success">{pm.status}</Badge></td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* 7. FEATURE FLAGS */}
      {path === '/admin/flags' && (
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-extrabold tracking-tight">Feature Flags</h1>
            <p className="text-gray-400 text-xs mt-1">Toggle system controls and maintenance switches.</p>
          </header>

          <Card className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Active System Switches</h3>
            <div className="space-y-5">
              <Checkbox
                label="System Maintenance Mode (Locks all standard user workspace sessions)"
                checked={flags.maintenance_mode}
                onChange={() => handleToggleFlag('maintenance_mode')}
              />

              <Checkbox
                label="Enable Beta AI voice synthesis (Enables test voice engines in prep rooms)"
                checked={flags.beta_ai_voice}
                onChange={() => handleToggleFlag('beta_ai_voice')}
              />

              <Checkbox
                label="Detailed System API Logging (Enables logs arrays outputs in browser console)"
                checked={flags.detailed_logging}
                onChange={() => handleToggleFlag('detailed_logging')}
              />
            </div>
          </Card>
        </div>
      )}

      {/* 8. DATABASE RESET */}
      {path === '/admin/reset' && (
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-extrabold tracking-tight">Database Reset</h1>
            <p className="text-gray-400 text-xs mt-1">Critical database maintenance console.</p>
          </header>

          <Card className="border-red-500/20 bg-red-500/5 p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Warning: Irreversible Operation</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed max-w-xl">
                  Resetting the database drops all existing tables and recreates them. All registered candidates, uploaded resumes, AI interview campaign logs, mock analysis reports, and performance charts will be permanently erased.
                </p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Type <span className="font-mono text-red-400 font-bold select-all">RESET_DATABASE_CONFIRM</span> to proceed:
                </label>
                <Input
                  placeholder="RESET_DATABASE_CONFIRM"
                  value={confirmResetText}
                  onChange={(e) => setConfirmResetText(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <Button
                variant="danger"
                loading={resetLoading}
                disabled={confirmResetText !== 'RESET_DATABASE_CONFIRM'}
                onClick={handleResetDatabase}
              >
                Permanently Reset Database
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Provision User Modal */}
      <Dialog
        isOpen={isUserAddOpen}
        onClose={() => setIsUserAddOpen(false)}
        title="Provision User Profile"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Smith"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Email Address"
            placeholder="jane@company.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</label>
            <Select
              options={[
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' }
              ]}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button className="flex-1" onClick={handleCreateUser}>
              Confirm Provision
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setIsUserAddOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add question modal */}
      <Dialog
        isOpen={isQuestionAddOpen}
        onClose={() => setIsQuestionAddOpen(false)}
        title="Add Question To Repository"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</label>
            <Select
              options={[
                { value: 'React', label: 'React Frontend' },
                { value: 'Database', label: 'Database & SQL' },
                { value: 'Systems', label: 'System Design' },
                { value: 'Behavioral', label: 'HR Behavioral' }
              ]}
              value={qCategory}
              onChange={(e) => setQCategory(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty</label>
            <Select
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' }
              ]}
              value={qDifficulty}
              onChange={(e) => setQDifficulty(e.target.value)}
            />
          </div>

          <Input
            label="Question Text"
            placeholder="Type question content..."
            value={qText}
            onChange={(e) => setQText(e.target.value)}
          />

          <Input
            label="Expected Answer (optional)"
            placeholder="Model answer for grading..."
            value={qExpectedAnswer}
            onChange={(e) => setQExpectedAnswer(e.target.value)}
          />

          <div className="flex gap-4 pt-2">
            <Button className="flex-1" loading={questionLoading} onClick={handleAddQuestion}>
              Confirm Addition
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setIsQuestionAddOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

    </div>
  )
}
