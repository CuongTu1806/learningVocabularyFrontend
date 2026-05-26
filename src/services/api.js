import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

// Auto set Authorization header từ localStorage
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('authToken');
  if (token === 'undefined' || token === 'null') {
    token = null;
    localStorage.removeItem('authToken');
  }
  if (token?.trim()) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401: session hết hạn — không redirect khi đang login/register (tránh reload, mất thông báo lỗi)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqPath = error.config?.url || '';
    const isAuthFormCall =
      reqPath.includes('/auth/login') ||
      reqPath.includes('/auth/register') ||
      reqPath.includes('/auth/refresh');

    if (status === 401 && !isAuthFormCall) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
