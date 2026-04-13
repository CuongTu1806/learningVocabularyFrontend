import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, register, forgotPassword, error } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // login, register, forgot
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Login form
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  
  // Register form
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    try {
      await login(loginCredentials);
      setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Login failed:', err);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    if (registerData.password !== registerData.confirmPassword) {
      setSuccess('Mật khẩu không khớp!');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setSuccess('Mật khẩu phải có ít nhất 6 ký tự!');
      setLoading(false);
      return;
    }

    try {
      await register({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
      });
      setSuccess('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Register failed:', err);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    try {
      await forgotPassword(forgotEmail);
      setSuccess('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!');
      setForgotEmail('');
      setTimeout(() => {
        setActiveTab('login');
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Forgot password failed:', err);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Learning Vocabulary</h2>
          <p className="text-white/80 mt-2">Học tiếng Anh một cách thông minh</p>
        </div>

        {/* Form Card */}
        <div className="glass-effect p-8 space-y-6">
          {success && (
            <div className={`border-l-4 p-4 rounded-lg ${success.includes('❌') ? 'bg-red-100 border-red-500' : 'bg-green-100 border-green-500'}`}>
              <p className={`font-semibold text-center ${success.includes('❌') ? 'text-red-800' : 'text-green-800'}`}>{success}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-800 font-semibold text-center">❌ {error}</p>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Tên đăng nhập</label>
                <input
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={loginCredentials.username}
                  onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Mật khẩu</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={loginCredentials.password}
                  onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Tên đăng nhập</label>
                <input
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Email</label>
                <input
                  type="email"
                  placeholder="Nhập email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Mật khẩu</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center mb-4">
                <p className="text-gray-700 text-sm">Nhập email đăng ký của bạn để nhận liên kết đặt lại mật khẩu</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">Email</label>
                <input
                  type="email"
                  placeholder="Nhập email đăng ký"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div className="pt-4 border-t border-gray-300 space-y-2 text-center">
            {activeTab === 'login' && (
              <>
                <p className="text-gray-700 text-sm">
                  Chưa có tài khoản?{' '}
                  <button
                    onClick={() => {
                      setActiveTab('register');
                      setSuccess('');
                    }}
                    className="text-purple-600 font-semibold hover:text-purple-700 hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </p>
                <p className="text-gray-700 text-sm">
                  <button
                    onClick={() => {
                      setActiveTab('forgot');
                      setSuccess('');
                    }}
                    className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </p>
              </>
            )}

            {activeTab === 'register' && (
              <p className="text-gray-700 text-sm">
                Đã có tài khoản?{' '}
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setSuccess('');
                  }}
                  className="text-purple-600 font-semibold hover:text-purple-700 hover:underline"
                >
                  Đăng nhập
                </button>
              </p>
            )}

            {activeTab === 'forgot' && (
              <p className="text-gray-700 text-sm">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setSuccess('');
                  }}
                  className="text-purple-600 font-semibold hover:text-purple-700 hover:underline"
                >
                  ← Quay lại đăng nhập
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


