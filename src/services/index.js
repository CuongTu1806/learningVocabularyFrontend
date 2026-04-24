import api from './api';

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  refresh: () => api.post('/auth/refresh'),
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return api.post('/auth/logout', { refreshToken });
  },
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

// Class API calls (JWT bắt buộc)
export const classAPI = {
  list: () => api.get('/classes'),
  get: (id) => api.get(`/classes/${id}`),
  getMembers: (id) => api.get(`/classes/${id}/members`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  join: (id) => api.post(`/classes/${id}/join`),
  leave: (id) => api.post(`/classes/${id}/leave`),
  invite: (id, data) => api.post(`/classes/${id}/invite`, data),
  removeMember: (classId, userId) => api.delete(`/classes/${classId}/members/${userId}`),
};

// Vocabulary API calls
export const vocabularyAPI = {
  search: (query) => api.get('/vocabulary/search', { params: { query } }),
};

const UPLOAD_TIMEOUT_MS = 120000;

// Assignment API (JWT)
export const assignmentAPI = {
  list: (classId) =>
    classId != null
      ? api.get('/assignments', { params: { classId } })
      : api.get('/assignments'),
  get: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  /** JSON: chỉ nội dung text */
  submit: (id, data) => api.post(`/assignments/${id}/submit`, data),
  /** Multipart: content (optional) + nhiều file */
  submitMultipart: (id, formData) =>
    api.post(`/assignments/${id}/submit`, formData, { timeout: UPLOAD_TIMEOUT_MS }),
  getSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
  grade: (assignmentId, submissionId, score) =>
    api.put(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, null, {
      params: { score },
    }),
  uploadAttachments: (assignmentId, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return api.post(`/assignments/${assignmentId}/attachments`, fd, { timeout: UPLOAD_TIMEOUT_MS });
  },
  deleteAttachment: (assignmentId, attachmentId) =>
    api.delete(`/assignments/${assignmentId}/attachments/${attachmentId}`),
  downloadAssignmentAttachment: (attachmentId) =>
    api.get(`/assignments/attachments/${attachmentId}/download`, { responseType: 'blob' }),
  downloadSubmissionAttachment: (submissionId, attachmentId) =>
    api.get(
      `/assignments/submissions/${submissionId}/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    ),
};

// Contest (JWT)
const CONTEST_UPLOAD_TIMEOUT_MS = 120000;

export const contestAPI = {
  list: () => api.get('/contests'),
  create: (data) => api.post('/contests', data),
  get: (id) => api.get(`/contests/${id}`),
  register: (id) => api.post(`/contests/${id}/register`),
  submitOne: (contestId, problemId, userAnswer) =>
    api.post(`/contests/${contestId}/problems/${problemId}/answer`, { userAnswer }),
  myStats: (contestId) => api.get(`/contests/${contestId}/me`),
  ranking: (contestId) => api.get(`/contests/${contestId}/ranking`),
  uploadProblemImage: (contestId, problemId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/contests/${contestId}/problems/${problemId}/image`, fd, {
      timeout: CONTEST_UPLOAD_TIMEOUT_MS,
    });
  },
  /** Ảnh upload trên server — cần JWT (axios), dùng blob làm src img */
  getProblemImageBlob: (contestId, problemId) =>
    api.get(`/contests/${contestId}/problems/${problemId}/image`, { responseType: 'blob' }),
};
