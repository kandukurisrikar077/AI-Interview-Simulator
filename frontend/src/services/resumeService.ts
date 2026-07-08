import apiClient from './api'
import type { Resume } from '../types/api'

export const resumeService = {
  /**
   * Upload a PDF resume file for parsing.
   * Uses multipart/form-data — Content-Type is set automatically.
   */
  upload: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<Resume> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await apiClient.post<Resume>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total))
        }
      },
    })
    return res.data
  },

  /**
   * Retrieve the current user's active resume.
   */
  getMyResume: async (): Promise<Resume> => {
    const res = await apiClient.get<Resume>('/resumes/me')
    return res.data
  },
}
