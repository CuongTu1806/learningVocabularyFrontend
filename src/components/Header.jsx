import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/classes' && location.pathname.startsWith('/classes')) ||
    (path === '/contests' && location.pathname.startsWith('/contests'));

  const navItems = [
    { label: 'Trang chủ', path: '/dashboard' },
    { label: 'Bài học', path: '/lessons' },
    { label: 'Lớp học', path: '/classes' },
    { label: 'Cuộc thi', path: '/contests' },
    { label: 'Quiz', path: '/quiz-history' },
    { label: 'Ôn tập', path: '/spaced-repetition' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-start gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
              LV
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Learning Vocabulary</h1>
              <p className="text-sm text-slate-500">Học từ vựng theo lịch ôn có kiểm soát</p>
            </div>
          </button>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/profile')} className="btn-secondary px-4 py-2">
                Hồ sơ
              </button>
              <button onClick={handleLogout} className="btn-primary px-4 py-2">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
