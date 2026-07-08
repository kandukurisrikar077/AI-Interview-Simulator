import apiClient from './api'
import type { User } from '../types/api'

export const userService = {
  /**
   * Update the current user's profile (full_name).
   */
  updateProfile: async (payload: { 
    full_name: string;
    openai_api_key?: string | null;
    gemini_api_key?: string | null;
  }): Promise<User> => {
    const res = await apiClient.patch<User>('/auth/me', payload)
    return res.data
  },

  /**
   * Change the current user's password.
   * Requires current password for verification.
   */
  changePassword: async (payload: {
    current_password: string
    new_password: string
  }): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/change-password', payload)
    return res.data
  },
}
