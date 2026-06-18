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
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <section className="hidden lg:flex lg:flex-col lg:justify-between lg:pr-10">
          <div className="max-w-xl">
            <div className="soft-badge mb-5">Learning Vocabulary</div>
            <h2 className="text-5xl font-semibold tracking-tight text-slate-900">
              Học từ vựng với nhịp ôn tập rõ ràng và ít thao tác thừa.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Đăng nhập để tiếp tục bài học, quiz, spaced repetition, lớp học và các chức năng theo dõi tiến trình.
            </p>
          </div>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">Ôn tập ngắt quãng</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">Quiz theo bài học</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">Lớp học và bài tập</div>
          </div>
        </section>

        <div className="w-full max-w-md justify-self-center">
          <div className="mb-6 text-center lg:hidden">
            <div className="soft-badge mb-4">Learning Vocabulary</div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Đăng nhập để tiếp tục học</h2>
            <p className="mt-2 text-slate-600">Giao diện tập trung vào nội dung và thao tác nhanh.</p>
          </div>

          {/* Form Card */}
          <div className="card space-y-6 p-8">
          {success && (
            <div className={`rounded-2xl border p-4 ${success.includes('❌') ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className={`text-center font-medium ${success.includes('❌') ? 'text-red-700' : 'text-emerald-700'}`}>{success}</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-center font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-username" className="mb-2 block text-sm font-semibold text-slate-700">Tên đăng nhập</label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={loginCredentials.username}
                  onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={loginCredentials.password}
                  onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="register-username" className="mb-2 block text-sm font-semibold text-slate-700">Tên đăng nhập</label>
                <input
                  id="register-username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="Nhập email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                <input
                  id="register-password"
                  type="password"
                  placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">Xác nhận mật khẩu</label>
                <input
                  id="register-confirm-password"
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="mb-4 text-center">
                <p className="text-sm text-slate-600">Nhập email đăng ký của bạn để nhận liên kết đặt lại mật khẩu</p>
              </div>

              <div>
                <label htmlFor="forgot-email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="Nhập email đăng ký"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={loading}
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div className="space-y-2 border-t border-slate-200 pt-4 text-center">
            {activeTab === 'login' && (
              <>
                <p className="text-sm text-slate-600">
                  Chưa có tài khoản?{' '}
                  <button
                    onClick={() => {
                      setActiveTab('register');
                      setSuccess('');
                    }}
                    className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </p>
                <p className="text-sm text-slate-600">
                  <button
                    onClick={() => {
                      setActiveTab('forgot');
                      setSuccess('');
                    }}
                    className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </p>
              </>
            )}

            {activeTab === 'register' && (
              <p className="text-sm text-slate-600">
                Đã có tài khoản?{' '}
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setSuccess('');
                  }}
                  className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                >
                  Đăng nhập
                </button>
              </p>
            )}

            {activeTab === 'forgot' && (
              <p className="text-sm text-slate-600">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setSuccess('');
                  }}
                  className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                >
                  ← Quay lại đăng nhập
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}


