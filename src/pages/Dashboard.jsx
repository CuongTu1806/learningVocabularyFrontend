import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { vocabularyAPI, leaderboardAPI } from '../services';
import Layout from '../components/Layout';

const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8080';

const buildMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${MEDIA_BASE_URL}${normalizedPath}`;
};

const vocabWord = (v) =>
  [v?.word, v?.term, v?.vocabulary, v?.english, v?.eng].find((x) => x != null && String(x).trim() !== '') || '';
const vocabMeaning = (v) =>
  [v?.meaning, v?.definition, v?.vietnamese, v?.vn].find((x) => x != null && String(x).trim() !== '') || '';
const vocabAudioPath = (v) => v?.audio_path || v?.audioPath || '';
const vocabImagePath = (v) => v?.image_path || v?.imagePath || '';
const vocabExample = (v) => v?.example || '';

const suggestionKey = (v, index) =>
  `${v?.type ?? 'x'}-${v?.id ?? 'noid'}-${index}`;

const LEADERBOARD_TOP = 10;

const CONTEST_MODES = [
  { value: 'all_time', label: 'All time' },
  { value: 'latest_contest', label: 'Contest gần nhất' },
  { value: 'contest_count', label: 'Số contest' },
];

const LESSON_RANGES = [
  { value: 'all_time', label: 'All time' },
  { value: 'week', label: '7 ngày gần nhất' },
  { value: 'month', label: '30 ngày gần nhất' },
];

function rankBadge(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

/** Popup gắn vào document.body để không bị cắt bởi layout / stacking context của main */
function VocabDetailModal({ vocab, open, onClose, playAudioFor }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !vocab || typeof document === 'undefined') return null;

  const word = vocabWord(vocab);
  const meaning = vocabMeaning(vocab);
  const img = vocabImagePath(vocab);
  const audio = vocabAudioPath(vocab);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocab-modal-title"
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="vocab-modal-title" className="text-2xl font-bold text-gray-900">{word}</h2>
            <p className="text-sm text-slate-600 mt-1">{meaning}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        {img ? (
          <img src={buildMediaUrl(img)} alt="" className="w-full h-48 object-cover rounded-md mb-4" />
        ) : null}

        {vocab.example ? (
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-700">Ví dụ</div>
            <div className="mt-1 text-gray-800">{vocab.example}</div>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          {audio ? (
            <button
              type="button"
              onClick={() => playAudioFor(vocab)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Phát audio
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
export default function Dashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedVocab, setSelectedVocab] = useState(null);
  const blurHideTimerRef = useRef(null);

  const [contestMode, setContestMode] = useState('all_time');
  const [contestRows, setContestRows] = useState([]);
  const [contestLoading, setContestLoading] = useState(false);
  const [contestError, setContestError] = useState(null);
  const [myContestRow, setMyContestRow] = useState(null);

  const [lessonRange, setLessonRange] = useState('all_time');
  const [lessonRows, setLessonRows] = useState([]);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState(null);
  const [myLessonRow, setMyLessonRow] = useState(null);

  const contestMetricLabel =
    contestMode === 'latest_contest'
      ? 'Điểm contest gần nhất'
      : contestMode === 'contest_count'
      ? 'Số contest đã tham gia'
      : 'Tổng điểm';

  useEffect(() => {
    let cancelled = false;
    const loadLeaderboard = async () => {
      try {
        setContestLoading(true);
        setContestError(null);
        const response = await leaderboardAPI.getContest(contestMode);
        const payload = response?.data;
        const list = Array.isArray(payload?.data) ? payload.data : [];
        if (!cancelled) setContestRows(list);
      } catch (e) {
        console.error('Leaderboard:', e);
        if (!cancelled) {
          // keep previous contestRows to avoid layout jump; show error instead
          setContestError(e?.response?.data?.message || e?.message || 'Không tải được bảng xếp hạng');
        }
      } finally {
        if (!cancelled) setContestLoading(false);
      }
    };
    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [contestMode]);

  useEffect(() => {
    let cancelled = false;
    const loadLessonLeaderboard = async () => {
      try {
        setLessonLoading(true);
        setLessonError(null);
        const response = await leaderboardAPI.getLessons(lessonRange);
        const payload = response?.data;
        const list = Array.isArray(payload?.data) ? payload.data : [];
        if (!cancelled) setLessonRows(list);
      } catch (e) {
        console.error('Lesson leaderboard:', e);
        if (!cancelled) {
          // keep previous lessonRows to avoid layout jump; show error instead
          setLessonError(e?.response?.data?.message || e?.message || 'Không tải được bảng lesson');
        }
      } finally {
        if (!cancelled) setLessonLoading(false);
      }
    };
    loadLessonLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [lessonRange]);

  useEffect(() => {
    // compute current user's row for contest (search full list)
    if (!user || !contestRows || contestRows.length === 0) {
      setMyContestRow(null);
      return;
    }
    const found = contestRows.find((r) =>
      r.username && user.username && String(r.username).toLowerCase() === String(user.username).toLowerCase(),
    );
    setMyContestRow(found || null);
  }, [user, contestRows]);

  useEffect(() => {
    // compute current user's row for lesson leaderboard
    if (!user || !lessonRows || lessonRows.length === 0) {
      setMyLessonRow(null);
      return;
    }
    const mine = lessonRows.filter(
      (r) => r.ownerUsername && user.username && String(r.ownerUsername).toLowerCase() === String(user.username).toLowerCase(),
    );
    if (mine.length === 0) {
      setMyLessonRow(null);
      return;
    }
    // pick the best rank (smallest rank number)
    const best = mine.reduce((acc, cur) => {
      if (!acc) return cur;
      if ((cur.rank ?? Number.MAX_SAFE_INTEGER) < (acc.rank ?? Number.MAX_SAFE_INTEGER)) return cur;
      return acc;
    }, null);
    setMyLessonRow(best || null);
  }, [user, lessonRows]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await vocabularyAPI.search(q);
        setSearchResults(response.data || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setShowResults(true);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedVocab) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedVocab(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedVocab]);

  const clearBlurHideTimer = useCallback(() => {
    if (blurHideTimerRef.current != null) {
      window.clearTimeout(blurHideTimerRef.current);
      blurHideTimerRef.current = null;
    }
  }, []);

  const playAudioFor = useCallback((vocab) => {
    const path = vocabAudioPath(vocab);
    if (!path) return;
    const url = buildMediaUrl(path);
    const audio = new Audio(url);
    audio.play().catch(() => {
      alert('Không thể phát audio cho từ này');
    });
  }, []);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  /** Dùng mousedown + preventDefault để không bị blur ô input xóa gợi ý trước khi nhận sự kiện */
  const handlePickSuggestion = (vocab, e) => {
    if (e) e.preventDefault();
    clearBlurHideTimer();
    setSelectedVocab({ ...vocab });
    setShowResults(false);
  };

  const closeModal = () => setSelectedVocab(null);

  /** Ẩn gợi ý sau khi rời khỏi ô tìm (trễ nhẹ để kịp nhấn chọn) */
  const scheduleHideSuggestions = () => {
    blurHideTimerRef.current = window.setTimeout(() => setShowResults(false), 220);
  };

  useEffect(
    () => () => {
      if (blurHideTimerRef.current != null) window.clearTimeout(blurHideTimerRef.current);
    },
    [],
  );

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 relative">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Tìm theo từ tiếng Anh hoặc nghĩa tiếng Việt..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => {
                  clearBlurHideTimer();
                  if (searchQuery.trim()) setShowResults(true);
                }}
                onBlur={() => scheduleHideSuggestions()}
                className="w-full px-6 py-4 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg border-0"
                autoComplete="off"
              />
              {searching && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {showResults && searchQuery.trim() && searchResults.length > 0 && (
              <div
                className="absolute top-full left-1/2 transform -translate-x-1/2 w-full max-w-2xl mt-2 bg-white rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto border border-slate-100"
                onMouseDown={(e) => e.preventDefault()}
              >
                <ul className="py-2">
                  {searchResults.map((vocab, index) => {
                    const w = vocabWord(vocab);
                    const m = vocabMeaning(vocab);
                    const key = suggestionKey(vocab, index);
                    const source =
                      vocab.type === 'user' ? 'Bài của bạn' : vocab.type === 'system' ? 'Từ điển' : '';

                    return (
                      <li key={key}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition flex gap-3 items-start border-b border-slate-50 last:border-0"
                          onMouseDown={(e) => handlePickSuggestion(vocab, e)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                EN
                              </span>
                              <span className="font-bold text-gray-900 text-lg leading-tight">{w || '—'}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                VI
                              </span>
                              <span className="text-sm text-gray-700 line-clamp-2">{m || '—'}</span>
                            </div>
                            {source ? (
                              <span className="mt-2 inline-block text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {source}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0 text-[11px] text-slate-500">
                            {vocab.pos ? (
                              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium">
                                {vocab.pos}
                              </span>
                            ) : null}
                            
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {showResults && searchQuery.trim() && searchResults.length === 0 && !searching && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-full max-w-2xl mt-2 bg-white rounded-2xl shadow-xl z-50 p-6 text-center border border-slate-100">
                <p className="text-gray-600">Không tìm thấy kết quả cho &quot;{searchQuery.trim()}&quot;</p>
              </div>
            )}
          </div>

          <VocabDetailModal
            vocab={selectedVocab}
            open={Boolean(selectedVocab)}
            onClose={closeModal}
            playAudioFor={playAudioFor}
          />

          <div className="card mb-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold text-white flex-shrink-0">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-800">
                  Chào mừng, {user?.username || 'User'}!
                </h2>
                <p className="text-gray-600 mt-2">
                  Bạn đã đăng nhập vào Learning Vocabulary Platform. Chúc bạn có một ngày học tập hiệu quả!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Bài học đã hoàn thành</p>
                  <p className="text-4xl font-bold text-blue-600 mt-2">12</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Từ vựng đã học</p>
                  <p className="text-4xl font-bold text-purple-600 mt-2">342</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Chuỗi luyện tập</p>
                  <p className="text-4xl font-bold text-pink-600 mt-2">7</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 items-stretch">
            <div className="card h-full flex flex-col overflow-hidden border-amber-100/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/80">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Bảng xếp hạng Rank</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CONTEST_MODES.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setContestMode(item.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        contestMode === item.value
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[220px]">
                <div className="flex-1 overflow-x-auto rounded-xl border border-amber-100/60 bg-white/70">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600">
                        <th className="py-3 px-4 font-semibold w-16">Hạng</th>
                        <th className="py-3 px-4 font-semibold">Người chơi</th>
                        <th className="py-3 px-4 font-semibold text-right">{contestMetricLabel}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contestRows.length > 0 ? (
                        contestRows.slice(0, LEADERBOARD_TOP).map((row, idx) => {
                          const rank = row.rank ?? idx + 1;
                          const name = row.username || `User #${row.userId ?? ''}`;
                          const rating = row.rating ?? 0;
                          const isMe =
                            user?.username &&
                            row.username &&
                            String(user.username).toLowerCase() === String(row.username).toLowerCase();
                          const medal = rankBadge(rank);
                          return (
                            <tr
                              key={`${row.userId ?? name}-${rank}-${idx}`}
                              className={`last:border-0 ${isMe ? 'bg-amber-100/50 font-medium' : 'hover:bg-slate-50/80'}`}
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 tabular-nums">
                                  {medal ? <span aria-hidden>{medal}</span> : null}
                                  <span>{rank}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900">{name}</span>
                                {isMe ? <span className="ml-2 text-xs text-amber-700 font-semibold">(bạn)</span> : null}
                              </td>
                              <td className="py-3 px-4 text-right tabular-nums text-gray-900">{rating}</td>
                            </tr>
                          );
                        })
                      ) : (
                        // placeholder rows to keep height
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`empty-${i}`} className="h-12">
                            <td colSpan={3} />
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {contestLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-amber-700">Đang tải bảng rank...</span>
                    </div>
                  </div>
                )}

                {/* current user's rank frame */}
                <div className="p-4 border-t border-amber-50 bg-amber-50/30">
                  {myContestRow ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-amber-800 font-semibold">Xếp hạng của bạn</div>
                        <div className="text-lg font-bold text-gray-900">{myContestRow.rank}. {myContestRow.username || 'Bạn'}</div>
                        <div className="text-sm text-slate-700">{contestMetricLabel}: {myContestRow.rating}</div>
                      </div>
                      <div className="text-3xl">{rankBadge(myContestRow.rank)}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">Bạn chưa nằm trong bảng xếp hạng hiện tại.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="card h-full flex flex-col overflow-hidden border-sky-100/80 bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/80">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Bảng xếp hạng Lesson</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {LESSON_RANGES.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setLessonRange(item.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        lessonRange === item.value
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {lessonLoading && (
                <div className="flex justify-center py-16 text-gray-500">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải bảng lesson...</span>
                  </div>
                </div>
              )}

              {!lessonLoading && lessonError && (
                <p className="text-center text-red-600 py-10 px-4">{lessonError}</p>
              )}

              {!lessonLoading && !lessonError && lessonRows.length === 0 && (
                <p className="text-center text-gray-600 py-12 px-4">
                  Chưa có dữ liệu tải lesson trong mốc thời gian này.
                </p>
              )}

              {!lessonLoading && lessonRows.length > 0 && (
                <>
                <div className="flex-1 overflow-x-auto rounded-xl border border-sky-100/60 bg-white/70">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600">
                        <th className="py-3 px-4 font-semibold w-16">Hạng</th>
                        <th className="py-3 px-4 font-semibold">Lesson</th>
                        <th className="py-3 px-4 font-semibold hidden md:table-cell">Người đăng</th>
                        <th className="py-3 px-4 font-semibold text-right">Lượt tải</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessonRows.slice(0, LEADERBOARD_TOP).map((row, idx) => {
                        const rank = row.rank ?? idx + 1;
                        const title = row.title || `Lesson #${row.lessonId ?? ''}`;
                        const ownerName = row.ownerUsername || `User #${row.ownerId ?? ''}`;
                        const downloads = row.downloadCount ?? 0;
                        const medal = rankBadge(rank);
                        const isOwnerMe =
                          user?.username &&
                          row.ownerUsername &&
                          String(user.username).toLowerCase() === String(row.ownerUsername).toLowerCase();
                        return (
                          <tr
                            key={`${row.lessonId ?? title}-${rank}-${idx}`}
                            className={`border-b border-slate-100 last:border-0 ${
                              isOwnerMe ? 'bg-sky-100/50 font-medium' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 tabular-nums">
                                {medal ? <span aria-hidden>{medal}</span> : null}
                                <span>{rank}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900">{title}</span>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <span className="text-slate-700">{ownerName}</span>
                              {isOwnerMe ? (
                                <span className="ml-2 text-xs text-sky-700 font-semibold">(bạn)</span>
                              ) : null}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums text-gray-900">{downloads}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                  {/* current user's lesson rank frame */}
                  <div className="p-4 border-t border-sky-50 bg-sky-50/30">
                    {myLessonRow ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-sky-800 font-semibold">Xếp hạng bài học của bạn</div>
                          <div className="text-lg font-bold text-gray-900">{myLessonRow.rank}. {myLessonRow.title}</div>
                          <div className="text-sm text-slate-700">Lượt tải: {myLessonRow.downloadCount}</div>
                        </div>
                        <div className="text-3xl">{rankBadge(myLessonRow.rank)}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600">Bạn chưa có bài nằm trong bảng lesson hiện tại.</div>
                    )}
                  </div>
                </>
              )}
            </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div
              onClick={() => (window.location.href = '/lessons')}
              className="card bg-gradient-to-br from-blue-400 to-blue-600 p-8 text-white hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold">Bài học</h3>
                <span className="text-4xl opacity-50">→</span>
              </div>
              <p className="text-blue-50 mb-6">Tiếp tục học các bài học mới hoặc ôn lại bài cũ</p>
              <button className="bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-all text-sm">
                Xem bài học
              </button>
            </div>

            <div
              onClick={() => (window.location.href = '/lessons')}
              className="card bg-gradient-to-br from-purple-400 to-pink-500 p-8 text-white hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold">Luyện tập</h3>
                <span className="text-4xl opacity-50">→</span>
              </div>
              <p className="text-purple-50 mb-6">Kiểm tra kiến thức với 3 chế độ quiz khác nhau</p>
              <button className="bg-white text-purple-600 font-semibold py-2 px-4 rounded-lg hover:bg-purple-50 transition-all text-sm">
                Bắt đầu quiz
              </button>
            </div>

            <div
              onClick={() => (window.location.href = '/spaced-repetition')}
              className="card bg-gradient-to-br from-green-400 to-emerald-600 p-8 text-white hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold">Ôn tập</h3>
                <span className="text-4xl opacity-50">→</span>
              </div>
              <p className="text-green-50 mb-6">
                Ôn tập từ vựng theo cơ chế Spaced Repetition thông minh
              </p>
              <button className="bg-white text-green-600 font-semibold py-2 px-4 rounded-lg hover:bg-green-50 transition-all text-sm">
                Bắt đầu ôn tập
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-2xl font-bold mb-6">Tính năng chính</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-gray-700">Hệ thống Spaced Repetition (Ôn tập dựa trên lịch)</span>
              </li>
              <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-gray-700">3 chế độ luyện tập: Trắc nghiệm, True/False, Điền chữ</span>
              </li>
              <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-gray-700">Theo dõi tiến độ học tập chi tiết</span>
              </li>
              <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-gray-700">Bảng xếp hạng và thưởng</span>
              </li>
              <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-gray-700">Quản lý từ vựng tuỳ chỉnh</span>
              </li>
              <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-gray-700">Báo cáo và thống kê học tập</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
