import apiClient from './api'
import type { AdminStats, User, Interview, QuestionBankItem } from '../types/api'

export const adminService = {
  /**
   * Get platform-wide statistics.
   */
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get<AdminStats>('/admin/stats')
    return res.data
  },

  /**
   * List all users with optional pagination and search.
   */
  listUsers: async (params?: {
    skip?: number
    limit?: number
    search?: string
  }): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users/', { params })
    return res.data
  },

  /**
   * Toggle a user's role between 'user' and 'admin'.
   */
  toggleRole: async (userId: number): Promise<User> => {
    const res = await apiClient.patch<User>(`/users/${userId}/role`)
    return res.data
  },

  /**
   * Toggle a user's suspension status.
   */
  toggleSuspend: async (userId: number): Promise<User> => {
    const res = await apiClient.patch<User>(`/users/${userId}/suspend`)
    return res.data
  },

  /**
   * Permanently delete a user.
   */
  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}`)
  },

  /**
   * Reset a user's password to a temporary value.
   */
  resetPassword: async (userId: number): Promise<{ message: string; temporary_password: string }> => {
    const res = await apiClient.post<{ message: string; temporary_password: string }>(
      `/users/${userId}/reset-password`
    )
    return res.data
  },

  /**
   * Get all interviews across all users (admin view).
   */
  getAllInterviews: async (params?: { skip?: number; limit?: number }): Promise<Interview[]> => {
    const res = await apiClient.get<Interview[]>('/admin/interviews', { params })
    return res.data
  },

  /**
   * List question bank entries.
   */
  listQuestions: async (params?: {
    category?: string
    difficulty?: string
    interview_type?: string
  }): Promise<QuestionBankItem[]> => {
    const res = await apiClient.get<QuestionBankItem[]>('/questions/', { params })
    return res.data
  },

  /**
   * Add a question to the question bank.
   */
  addQuestion: async (payload: {
    category: string
    difficulty: string
    text: string
    expected_answer?: string
    interview_type?: string
  }): Promise<QuestionBankItem> => {
    const res = await apiClient.post<QuestionBankItem>('/questions/', payload)
    return res.data
  },

  /**
   * Delete a question from the question bank.
   */
  deleteQuestion: async (questionId: number): Promise<void> => {
    await apiClient.delete(`/questions/${questionId}`)
  },

  /**
   * Reset the database (Admin only).
   */
  resetDatabase: async (confirmation: string): Promise<{ status: string; message: string }> => {
    const res = await apiClient.post<{ status: string; message: string }>('/admin/reset-database', { confirmation })
    return res.data
  },
}
