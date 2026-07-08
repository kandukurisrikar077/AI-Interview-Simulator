import apiClient, { API_URL } from './api'
import type {
  Interview,
  InterviewDetail,
  QuestionItem,
  NextQuestionResponse,
  MalpracticeLog,
} from '../types/api'

export const interviewService = {
  /**
   * Create a new interview session.
   */
  create: async (payload: {
    type: string;
    difficulty: string;
    duration_minutes: number;
    job_role?: string;
  }): Promise<Interview> => {
    const res = await apiClient.post<Interview>('/interviews/', payload)
    return res.data
  },

  /**
   * List all interviews for the current user.
   */
  list: async (): Promise<Interview[]> => {
    const res = await apiClient.get<Interview[]>('/interviews/')
    return res.data
  },

  /**
   * Get full interview details including questions and malpractice logs.
   */
  get: async (id: number): Promise<InterviewDetail> => {
    const res = await apiClient.get<InterviewDetail>(`/interviews/${id}`)
    return res.data
  },

  /**
   * Start an interview — marks it live and returns the first question.
   */
  start: async (id: number): Promise<QuestionItem> => {
    const res = await apiClient.post<QuestionItem>(`/interviews/${id}/start`)
    return res.data
  },

  /**
   * Submit an answer to a specific question.
   */
  submitAnswer: async (
    interviewId: number,
    questionId: number,
    payload: { user_answer: string; transcript?: string; speaking_duration_seconds?: number }
  ): Promise<QuestionItem> => {
    const res = await apiClient.post<QuestionItem>(
      `/interviews/${interviewId}/questions/${questionId}/submit`,
      payload
    )
    return res.data
  },

  /**
   * Request the next adaptive question (or round-complete signal).
   */
  nextQuestion: async (id: number): Promise<NextQuestionResponse> => {
    const res = await apiClient.post<NextQuestionResponse>(`/interviews/${id}/next_question`)
    return res.data
  },

  /**
   * Finish interview — calculates score and generates roadmap.
   */
  finish: async (id: number): Promise<InterviewDetail> => {
    const res = await apiClient.post<InterviewDetail>(`/interviews/${id}/finish`)
    return res.data
  },

  /**
   * Log a malpractice event during an interview.
   */
  logMalpractice: async (
    id: number,
    payload: { type: string; severity: string; confidence?: number }
  ): Promise<MalpracticeLog> => {
    const res = await apiClient.post<MalpracticeLog>(`/interviews/${id}/malpractice`, payload)
    return res.data
  },

  /**
   * Download interview report PDF.
   */
  downloadPdf: (id: number): string => {
    return `${API_URL}/interviews/${id}/pdf`
  },
}
