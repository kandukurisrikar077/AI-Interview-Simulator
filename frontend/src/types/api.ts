// ============================================================
// Complete TypeScript API type definitions for IntervueAI
// ============================================================

export interface User {
  id: number
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  openai_api_key?: string | null
  gemini_api_key?: string | null
  company_name?: string | null
  company_size?: string | null
  industry?: string | null
  company_website?: string | null
  company_logo?: string | null
  job_title?: string | null
  department?: string | null
  timezone?: string | null
  hiring_for?: string[] | null
  primary_roles?: string[] | null
  recruiter_onboarding_completed?: boolean
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: User
}

export interface Resume {
  id: number
  user_id: number
  skills: string[]
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: ProjectItem[]
  file_path: string | null
  uploaded_at: string
}

export interface ExperienceItem {
  company: string
  role: string
  duration: string
  description: string
}

export interface EducationItem {
  institution: string
  degree: string
  year: string
}

export interface ProjectItem {
  name: string
  description: string
  technologies: string[]
}

export interface Interview {
  id: number
  user_id: number
  type: string
  difficulty: string
  duration_minutes: number
  score: number | null
  status: 'created' | 'live' | 'completed'
  created_at: string
}

export interface QuestionItem {
  id: number
  interview_id: number
  text: string
  type: string
  expected_answer: string | null
  user_answer: string | null
  transcript: string | null
  score: number | null
  feedback: string | null
  category: string | null
  grammar_score?: number | null
  confidence_score?: number | null
  filler_words_count?: number | null
  speaking_speed?: number | null
  response_length?: number | null
  created_at: string
}

export interface MalpracticeLog {
  id: number
  interview_id: number
  type: string
  timestamp: string
  confidence: number | null
  severity: string
}

export interface InterviewDetail extends Interview {
  questions: QuestionItem[]
  malpractice_logs: MalpracticeLog[]
  roadmap: InterviewRoadmap | null
}

export interface InterviewRoadmap {
  suggestions: string[]
  roadmap: string[]
  skill_scores: SkillScore[]
}

export interface SkillScore {
  skill: string
  score: number
}

export interface NextQuestionResponse {
  // Can be a question or a round-complete message
  id?: number
  text?: string
  type?: string
  category?: string
  expected_answer?: string | null
  created_at?: string
  interview_id?: number
  // Round-complete shape
  status?: string
  next_step?: string
  message?: string
}

export interface AdminStats {
  total_users: number
  active_users: number
  total_interviews: number
  completed_interviews: number
  average_score: number | null
  total_resumes: number
}

export interface AnalyticsData {
  total_interviews: number
  average_score: number | null
  best_score: number | null
  skill_scores: SkillScore[]
  score_trend: (number | null)[]
  weak_areas: string[]
}

export interface QuestionBankItem {
  id: number
  category: string
  difficulty: string
  text: string
  expected_answer: string | null
  interview_type: string | null
  created_at: string
}

export interface ApiError {
  detail: string
}
