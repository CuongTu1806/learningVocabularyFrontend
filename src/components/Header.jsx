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

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Trang chủ', path: '/dashboard' },
    { label: 'Bài học', path: '/lessons' },
    { label: 'Quiz', path: '/quiz-history' },
    { label: 'Ôn tập', path: '/spaced-repetition' },
  ];

  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
            onClick={() => navigate('/dashboard')}
          >
            <div>
              <h1 className="text-2xl font-bold text-white">Learning Vocabulary</h1>
              <p className="text-white/70 text-xs">Học tiếng Anh thông minh</p>
            </div>
          </div>

          {/* Navigation & User Menu */}
          <div className="flex items-center gap-8">
            {/* Nav Links */}
            <nav className="hidden md:flex gap-6">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`font-semibold transition-all py-2 px-3 rounded-lg ${
                    isActive(item.path)
                      ? 'text-white bg-white/20'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="btn-primary bg-blue-400 text-white hover:bg-blue-500 font-semibold py-2 px-4 rounded-lg transition-all text-sm"
              >
                Hồ sơ
              </button>
              <button
                onClick={handleLogout}
                className="btn-primary bg-white text-purple-600 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Simple */}
        <div className="md:hidden mt-4 flex gap-2 justify-center">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-sm font-semibold py-2 px-3 rounded-lg transition-all ${
                isActive(item.path)
                  ? 'text-white bg-white/20'
                  : 'text-white/90 hover:text-white'
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
