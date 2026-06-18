import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export default function LessonLibraryCard({ lesson, onStudy, onEdit, onDelete, onDownload, canManage }) {
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
  const ownerName = lesson?.ownerUsername || 'Unknown';
  const visibility = String(lesson?.visibility || 'PRIVATE').toUpperCase();

  return (
    <article
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="relative h-32 overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,250,252,1))]">
        <div className="absolute left-4 top-4 h-10 w-10 rounded-2xl bg-slate-200/80" />
        <div className="absolute right-5 top-5 h-14 w-14 rounded-2xl bg-slate-100" />
      </div>

      <div className="p-5">
        <div className="mb-5">
          <h3 className="line-clamp-2 text-[18px] font-semibold leading-6 text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">{wordsCount} từ</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="soft-badge">{ownerName}</span>
            <span
              className={`soft-badge ${
                visibility === 'PUBLIC'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {visibility === 'PUBLIC' ? 'Public' : 'Private'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onStudy}
            className="btn-primary px-4 py-2.5"
          >
            {canManage ? 'Study Now' : 'Xem'}
          </button>

          {canManage ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Open lesson menu"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M12 6.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm0 7a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm0 7a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 z-10 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                  <button
                    type="button"
                    onClick={() => {
                      onEdit();
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
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
          ) : (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Tải về học
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

LessonLibraryCard.propTypes = {
  lesson: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    name: PropTypes.string,
    numberOfWords: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ownerUsername: PropTypes.string,
    visibility: PropTypes.string,
  }).isRequired,
  onStudy: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDownload: PropTypes.func,
  canManage: PropTypes.bool,
};
