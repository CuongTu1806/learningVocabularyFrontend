import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/index';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (token in localStorage)
    const token = localStorage.getItem('authToken');
    if (token) {
      // Fetch user profile using the token
      authAPI.getProfile()
        .then(response => {
          setUser({ token, ...response.data });
        })
        .catch(err => {
          console.error('Failed to fetch profile:', err);
          localStorage.removeItem('authToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      const { token } = response.data;
      localStorage.setItem('authToken', token);
      setUser({ token, ...response.data.user });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const register = async (data) => {
    try {
      setError(null);
      const response = await authAPI.register(data);
      const { token } = response.data;
      localStorage.setItem('authToken', token);
      setUser({ token, ...response.data.user });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
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
