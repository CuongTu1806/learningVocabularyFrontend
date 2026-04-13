import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Về chúng tôi', href: '#' },
    { label: 'Điều khoản sử dụng', href: '#' },
    { label: 'Chính sách bảo mật', href: '#' },
    { label: 'Liên hệ', href: '#' },
  ];

  const socialLinks = [
    { icon: '', label: 'Facebook', href: '#' },
    { icon: '', label: 'Twitter', href: '#' },
    { icon: '', label: 'Email', href: '#' },
  ];

  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-t border-slate-700">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Brand */}
          <div>
            <h3 className="text-base font-bold mb-2 flex items-center gap-1">
              <span className="text-xl">LV</span>
              Learning Vocabulary
            </h3>
            <p className="text-slate-400 text-xs">
              Học tiếng Anh với Spaced Repetition.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm mb-2">🔗 Liên kết</h4>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-slate-400 hover:text-white transition text-xs"
                >
                  Trang chủ
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/lessons')}
                  className="text-slate-400 hover:text-white transition text-xs"
                >
                  Bài học
                </button>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition text-xs">
                  Trợ giúp
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-sm mb-2">Tài nguyên</h4>
            <ul className="space-y-1">
              {footerLinks.slice(0, 2).map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition text-xs">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-2">📞 Liên hệ</h4>
            <div className="space-y-1">
              <p className="text-slate-400 text-xs">
                <a href="mailto:info@learning.edu" className="text-blue-400 hover:underline">info@learning.edu</a>
              </p>
              <div className="flex gap-2 mt-2">
                {socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    title={link.label}
                    className="text-lg hover:opacity-70 transition"
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-4 pt-3 flex flex-col md:flex-row justify-between items-center gap-2">
          {/* Copyright */}
          <p className="text-slate-400 text-xs">
            © {currentYear} Learning Vocabulary Platform
          </p>

          {/* Stats */}
          <p className="text-slate-400 text-xs flex gap-4">
            <span>👥 10K+</span>
            <span>📚 500+</span>
            <span>⭐ 4.8/5</span>
          </p>

          {/* Top Button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-slate-400 hover:text-white transition text-xs font-semibold"
          >
            Top
          </button>
        </div>
      </div>
    </footer>
  );
}
