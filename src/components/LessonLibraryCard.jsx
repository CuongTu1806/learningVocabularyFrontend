import React, { useEffect, useRef, useState } from 'react';

export default function LessonLibraryCard({ lesson, onStudy, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const title = lesson?.title || lesson?.name || 'Untitled Lesson';
  const wordsCount = Number.isFinite(lesson?.numberOfWords) ? lesson.numberOfWords : 0;

  return (
    <article
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_18px_35px_-15px_rgba(15,23,42,0.35)]"
    >
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-cyan-300 via-blue-400 to-fuchsia-500">
        <div className="absolute -left-10 -top-8 h-24 w-24 rounded-full bg-white/35 blur-md" />
        <div className="absolute right-3 top-4 h-16 w-16 rounded-full bg-emerald-200/60 blur-sm" />
        <div className="absolute -bottom-8 right-14 h-28 w-28 rounded-full bg-indigo-300/50 blur-md" />
      </div>

      <div className="p-5">
        <div className="mb-5">
          <h3 className="line-clamp-2 text-[18px] font-bold leading-6 text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">{wordsCount} words</p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onStudy}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Study Now
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="Open lesson menu"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path d="M12 6.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm0 7a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm0 7a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 z-10 w-36 rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onEdit();
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
