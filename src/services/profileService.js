import api from './api';

export const profileService = {
  // Get profile stats with period (month, quarter, year)
  getProfileStats: async (period = 'month') => {
    try {
      const response = await api.get(`/profile/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      throw error;
    }
  },

  // Get reviews stats
  getReviewsStats: async (period = 'month') => {
    try {
      const response = await api.get(`/profile/stats?period=${period}`);
      return response.data.reviews;
    } catch (error) {
      console.error('Error fetching reviews stats:', error);
      throw error;
    }
  },

  // Get time stats
  getTimeStats: async (period = 'month') => {
    try {
      const response = await api.get(`/profile/stats?period=${period}`);
      return response.data.time;
    } catch (error) {
      console.error('Error fetching time stats:', error);
      throw error;
    }
  },

  // Get card count stats
  getCardCountStats: async () => {
    try {
      const response = await api.get(`/profile/stats`);
      return response.data.cardCount;
    } catch (error) {
      console.error('Error fetching card count stats:', error);
      throw error;
    }
  },

  // Get review interval stats
  getReviewIntervalStats: async () => {
    try {
      const response = await api.get(`/profile/stats`);
      return response.data.reviewInterval;
    } catch (error) {
      console.error('Error fetching review interval stats:', error);
      throw error;
    }
  },

  // Get card ease stats
  getCardEaseStats: async () => {
    try {
      const response = await api.get(`/profile/stats`);
      return response.data.cardEase;
    } catch (error) {
      console.error('Error fetching card ease stats:', error);
      throw error;
    }
  },

  // Get add stats
  getAddStats: async (period = 'month') => {
    try {
      const response = await api.get(`/profile/stats?period=${period}`);
      return response.data.add;
    } catch (error) {
      console.error('Error fetching add stats:', error);
      throw error;
    }
  },
};
