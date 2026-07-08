import apiClient from './api'
import type { AnalyticsData } from '../types/api'

export const analyticsService = {
  /**
   * Retrieve analytics data for the currently authenticated user.
   * Aggregates interview scores, skill breakdowns, and weak areas.
   */
  getMyAnalytics: async (): Promise<AnalyticsData> => {
    const res = await apiClient.get<AnalyticsData>('/analytics/me')
    return res.data
  },
}
