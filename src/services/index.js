import api from './api';

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', null, { params: { email } }),
  getProfile: () => api.get('/auth/profile'),
};

// Lesson API calls
export const lessonAPI = {
  getAll: () => api.get('/lessons'),
  create: (data) => api.post('/lessons', data),
  update: (lessonId, data) => api.put(`/lessons/${lessonId}`, data),
  delete: (lessonId) => api.delete(`/lessons/${lessonId}`),
  getVocabularies: (lessonId) => api.get(`/lessons/${lessonId}/vocabularies`),
  addVocabulary: (lessonId, data) => api.post(`/lessons/${lessonId}/vocabularies`, data),
  updateVocabulary: (lessonId, vocabId, data) => api.put(`/lessons/${lessonId}/vocabularies/${vocabId}`, data),
  deleteVocabulary: (lessonId, vocabId) => api.delete(`/lessons/${lessonId}/vocabularies/${vocabId}`),
};

// Quiz API calls
export const quizAPI = {
  create: (lessonId, quizType) => api.post(`/quiz/${lessonId}`, { quizType }),
  submit: (data) => api.post('/quiz/submit', data),
  getHistory: (filters = {}, page = 0, size = 10) => api.get('/quiz/history', { 
    params: { 
      ...filters,
      page,
      size,
    } 
  }),
  getHistoryDetail: (quizId) => api.get(`/quiz/history/${quizId}`),
};

// Spaced Repetition API calls
export const spacedRepetitionAPI = {
  start: (userVocabularyId) => api.post(`/spaced_repetition/start/${userVocabularyId}`),
  answer: (data) => api.post('/spaced_repetition/answer', data),
  getDue: (limit = 20) => api.get('/spaced_repetition/due', { params: { limit } }),
  getSummary: () => api.get('/spaced_repetition/summary'),
  getCalendar: (year, month) => api.get('/spaced_repetition/calendar', { params: { year, month } }),
  getSettings: () => api.get('/spaced_repetition/settings'),
  updateSettings: (data) => api.put('/spaced_repetition/settings', data),
};

// Class API calls
export const classAPI = {
  get: (id) => api.get(`/classes/${id}`),
  getMembers: (id) => api.get(`/classes/${id}/members`),
  create: (data) => api.post('/classes', data),
  join: (id) => api.post(`/classes/${id}/join`),
  leave: (id) => api.post(`/classes/${id}/leave`),
  invite: (id, data) => api.post(`/classes/${id}/invite`, data),
};

// Vocabulary API calls
export const vocabularyAPI = {
  search: (query) => api.get('/vocabulary/search', { params: { q: query } }),
};
