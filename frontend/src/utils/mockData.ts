export interface MockResume {
  id: number
  skills: string[]
  experience: { company: string; role: string; duration: string; description: string }[]
  projects: { name: string; description: string; technologies: string[] }[]
  atsScore: number
  suggestions: string[]
  file_path?: string
  uploaded_at?: string
}

export interface MockInterview {
  id: number
  type: 'technical' | 'hr' | 'mixed' | 'coding'
  difficulty: 'easy' | 'medium' | 'hard'
  duration_minutes: number
  score: number
  status: 'completed' | 'live' | 'created'
  created_at: string
  skills_breakdown: { skill: string; score: number }[]
  roadmap: string[]
  malpractice_count: number
  transcripts: { q: string; a: string; score: number; feedback: string }[]
}

export interface MockUser {
  id: number
  email: string
  full_name: string
  role: 'user' | 'admin'
  created_at: string
  subscription: 'Free' | 'Pro' | 'Enterprise'
}

export interface MockPayment {
  id: string
  user: string
  amount: string
  date: string
  status: 'Completed' | 'Pending'
}

export interface MockPrompt {
  id: string
  name: string
  prompt: string
  updated_at: string
}

// ─── Admin-only defaults ───────────────────────────────────────────────────────
// These are ONLY used by the Admin Dashboard and never shown to regular users.

const DEFAULT_PAYMENTS: MockPayment[] = [
  { id: 'TXN-1001', user: 'developer@intervue.ai', amount: '$29.00', date: '2026-06-01', status: 'Completed' },
  { id: 'TXN-1002', user: 'candidate@test.com', amount: '$0.00', date: '2026-06-15', status: 'Completed' }
]

const DEFAULT_PROMPTS: MockPrompt[] = [
  { id: 'P-1', name: 'Resume Parser Prompt', prompt: 'Analyze this resume text. Extract skills, experiences, projects, and calculate an ATS score out of 100.', updated_at: '2026-06-10' },
  { id: 'P-2', name: 'Adaptive Interviewer Prompt', prompt: 'Adopt the persona of a Senior technical interviewer. Ask adaptive follow-ups based on skills and resume.', updated_at: '2026-06-20' }
]

const DEFAULT_FLAGS = {
  maintenance_mode: false,
  beta_ai_voice: true,
  detailed_logging: false
}

// ─── Storage Helpers ───────────────────────────────────────────────────────────

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key)
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue))
    return defaultValue
  }
  return JSON.parse(item)
}

const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── mockDb ───────────────────────────────────────────────────────────────────
// Regular user data always starts EMPTY — no fake data ever injected.
// Only admin-panel collections (payments, prompts, flags) have defaults.

export const mockDb = {
  // Empty for regular users — populated only after real actions
  getUsers: () => getStorageItem<MockUser[]>('mock_users', []),
  setUsers: (users: MockUser[]) => setStorageItem('mock_users', users),

  getResume: () => getStorageItem<MockResume | null>('mock_resume', null),
  setResume: (resume: MockResume) => setStorageItem('mock_resume', resume),

  getInterviews: () => getStorageItem<MockInterview[]>('mock_interviews', []),
  setInterviews: (interviews: MockInterview[]) => setStorageItem('mock_interviews', interviews),

  // Admin-only
  getPayments: () => getStorageItem<MockPayment[]>('mock_payments', DEFAULT_PAYMENTS),
  setPayments: (payments: MockPayment[]) => setStorageItem('mock_payments', payments),

  getPrompts: () => getStorageItem<MockPrompt[]>('mock_prompts', DEFAULT_PROMPTS),
  setPrompts: (prompts: MockPrompt[]) => setStorageItem('mock_prompts', prompts),

  getFlags: () => getStorageItem<typeof DEFAULT_FLAGS>('mock_flags', DEFAULT_FLAGS),
  setFlags: (flags: typeof DEFAULT_FLAGS) => setStorageItem('mock_flags', flags)
}
