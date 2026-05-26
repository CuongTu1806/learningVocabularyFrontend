import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/index';

const AuthContext = createContext();

function clearStoredAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let raw = localStorage.getItem('authToken');
    if (raw === 'undefined' || raw === 'null' || !raw?.trim()) {
      clearStoredAuth();
      raw = null;
    }

    if (raw) {
      const token = raw;
      authAPI
        .getProfile()
        .then((response) => {
          setUser({
            token,
            userId: response.data?.userId,
            username: response.data?.username,
            email: response.data?.email,
            tokenType: response.data?.tokenType,
          });
        })
        .catch((err) => {
          console.error('Failed to fetch profile:', err);
          clearStoredAuth();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /** Backend trả AuthResponse phẳng: token, refreshToken, tokenType, username, email (không có field user). */
  const persistAuthSession = (data) => {
    if (!data?.token) {
      throw new Error('Phản hồi đăng nhập không có access token');
    }
    localStorage.setItem('authToken', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    setUser({
      token: data.token,
      refreshToken: data.refreshToken,
      tokenType: data.tokenType,
      userId: data.userId,
      username: data.username,
      email: data.email,
    });
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      persistAuthSession(response.data);
      return response.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Đăng nhập thất bại';
      setError(msg);
      throw err;
    }
  };

  const register = async (data) => {
    try {
      setError(null);
      await authAPI.register({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      // Backend chỉ trả message, không cấp JWT — đăng nhập ngay bằng cùng mật khẩu
      return login({ username: data.username, password: data.password });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearStoredAuth();
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      const response = await authAPI.forgotPassword(email);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset email');
      throw err;
    }
  };

  const getProfile = async () => {
    try {
      setError(null);
      const response = await authAPI.getProfile();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
      throw err;
    }
  };

  const changePassword = async (data) => {
    try {
      setError(null);
      const response = await authAPI.changePassword(data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, forgotPassword, getProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
