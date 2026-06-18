import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Về chúng tôi', href: '/dashboard' },
    { label: 'Điều khoản sử dụng', href: '/dashboard' },
    { label: 'Chính sách bảo mật', href: '/dashboard' },
    { label: 'Liên hệ', href: '/profile' },
  ];

  const socialLinks = [
    { icon: '', label: 'Facebook', href: '/dashboard' },
    { icon: '', label: 'Twitter', href: '/dashboard' },
    { icon: '', label: 'Email', href: 'mailto:info@learning.edu' },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-800">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm text-white">LV</span>
              Learning Vocabulary
            </h3>
            <p className="max-w-xs text-sm leading-6 text-slate-500">
              Nền tảng học từ vựng có ôn tập ngắt quãng, quiz, lớp học và bài tập trong cùng một luồng.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Liên kết</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm text-slate-500 transition hover:text-slate-900"
                >
                  Trang chủ
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/lessons')}
                  className="text-sm text-slate-500 transition hover:text-slate-900"
                >
                  Bài học
                </button>
              </li>
              <li>
                <a href="/dashboard" className="text-sm text-slate-500 transition hover:text-slate-900">
                  Trợ giúp
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Tài nguyên</h4>
            <ul className="space-y-2">
              {footerLinks.slice(0, 2).map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="text-sm text-slate-500 transition hover:text-slate-900">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Liên hệ</h4>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">
                <a href="mailto:info@learning.edu" className="text-slate-700 transition hover:text-slate-900">info@learning.edu</a>
              </p>
              <div className="flex gap-2">
                {socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    title={link.label}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            © {currentYear} Learning Vocabulary Platform
          </p>

          <p className="flex gap-4 text-sm text-slate-500">
            <span>10K+ người học</span>
            <span>500+ bài học</span>
            <span>4.8/5 đánh giá</span>
          </p>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Top
          </button>
        </div>
      </div>
    </footer>
  );
}
