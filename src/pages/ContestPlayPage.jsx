import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { contestAPI } from '../services/index';
import {
  unwrapApiData,
  normalizeContestDetail,
  normalizeContestMyStats,
} from '../utils/apiHelpers';

const POLL_MS = 4000;

export default function ContestPlayPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const id = Number(contestId);

  const [contest, setContest] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  /** @type {'idle'|'correct'|'wrong'} */
  const [feedback, setFeedback] = useState('idle');
  const [registerOk, setRegisterOk] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [imageLoadError, setImageLoadError] = useState(false);
  /** Object URL từ blob API (ảnh upload server) */
  const [uploadedImageBlobUrl, setUploadedImageBlobUrl] = useState(null);

  const sortedProblems = useMemo(() => {
    const list = contest?.problems;
    if (!Array.isArray(list)) return [];
    return [...list].sort(
      (a, b) => (a.orderIndex ?? a.order_index ?? 0) - (b.orderIndex ?? b.order_index ?? 0)
    );
  }, [contest]);

  const solvedSet = useMemo(() => {
    const ids = myStats?.solvedProblemIds;
    if (!Array.isArray(ids)) return new Set();
    return new Set(ids.map(Number));
  }, [myStats]);

  const currentProblem = useMemo(() => {
    return sortedProblems.find((p) => !solvedSet.has(Number(p.id))) || null;
  }, [sortedProblems, solvedSet]);

  const allDone = sortedProblems.length > 0 && sortedProblems.every((p) => solvedSet.has(Number(p.id)));

  const loadContest = useCallback(async () => {
    const res = await contestAPI.get(id);
    const data = unwrapApiData(res);
    if (!data) throw new Error(res?.data?.message || 'Không tải được cuộc thi');
    setContest(normalizeContestDetail(data));
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setUploadedImageBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImageLoadError(false);

    const p = currentProblem;
    const hasUp =
      p && (p.hasUploadedImage === true || p.has_uploaded_image === true);
    if (!p || !hasUp) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const res = await contestAPI.getProblemImageBlob(id, p.id);
        if (cancelled) return;
        const u = URL.createObjectURL(res.data);
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        setUploadedImageBlobUrl(u);
      } catch {
        if (!cancelled) setImageLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
      setUploadedImageBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [id, currentProblem?.id, currentProblem?.hasUploadedImage]);

  const refreshMe = useCallback(async () => {
    try {
      const res = await contestAPI.myStats(id);
      const data = unwrapApiData(res);
      if (data) setMyStats(normalizeContestMyStats(data));
    } catch {
      /* ignore */
    }
  }, [id]);

  const refreshRanking = useCallback(async () => {
    try {
      const res = await contestAPI.ranking(id);
      const data = unwrapApiData(res);
      setRanking(Array.isArray(data) ? data : []);
    } catch {
      setRanking([]);
    }
  }, [id]);

  const tryRegister = useCallback(async () => {
    try {
      await contestAPI.register(id);
      setRegisterOk(true);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (String(msg).includes('đã đăng ký')) {
        setRegisterOk(true);
      }
    }
  }, [id]);

  useEffect(() => {
    if (contestId == null || Number.isNaN(Number(contestId))) {
      setError('Mã cuộc thi không hợp lệ');
      setLoading(false);
      return () => {};
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadContest();
        if (cancelled) return;
        await tryRegister();
        await refreshMe();
        await refreshRanking();
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Lỗi tải');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contestId, loadContest, tryRegister, refreshMe, refreshRanking]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      refreshRanking();
      refreshMe();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [refreshRanking, refreshMe]);

  const endMs = contest?.endTime ? new Date(contest.endTime).getTime() : null;
  const startMs = contest?.startTime ? new Date(contest.startTime).getTime() : null;
  const remainingSec =
    endMs != null ? Math.max(0, Math.floor((endMs - nowTick) / 1000)) : null;
  const beforeStart = startMs != null && nowTick < startMs;
  const afterEnd = endMs != null && nowTick > endMs;
  const inWindow = !beforeStart && !afterEnd;

  const formatRemain = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || !currentProblem || !inWindow) return;
    try {
      setSubmitting(true);
      setFeedback('idle');
      const res = await contestAPI.submitOne(id, currentProblem.id, trimmed);
      const result = unwrapApiData(res);
      const ok = result?.correct === true;
      setFeedback(ok ? 'correct' : 'wrong');
      setAnswer('');
      await refreshMe();
      await refreshRanking();
      window.setTimeout(() => setFeedback('idle'), 1400);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-24 text-gray-600">Đang tải cuộc thi...</div>
      </Layout>
    );
  }

  if (error || !contest) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="card bg-red-50 border-red-200 p-6">
            <p className="text-red-700">{error || 'Không tìm thấy'}</p>
            <button type="button" className="btn-primary mt-4" onClick={() => navigate('/contests')}>
              Danh sách cuộc thi
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 min-h-screen text-white pb-16">
        <div className="max-w-6xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
          <div className="min-w-0 max-w-3xl order-2 lg:order-1">
          <button
            type="button"
            onClick={() => navigate('/contests')}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold mb-6"
          >
            ← Cuộc thi
          </button>

          <h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
          <p className="text-white/70 text-sm mb-8 whitespace-pre-wrap">{contest.description}</p>

          {beforeStart && (
            <div className="rounded-xl bg-amber-500/20 border border-amber-400/40 p-4 mb-6 text-amber-100">
              Cuộc thi chưa bắt đầu. Thời gian bắt đầu:{' '}
              {contest.startTime ? new Date(contest.startTime).toLocaleString('vi-VN') : '—'}
            </div>
          )}
          {afterEnd && (
            <div className="rounded-xl bg-gray-500/20 border border-gray-400/40 p-4 mb-6 text-gray-200">
              Cuộc thi đã kết thúc. Bạn vẫn xem được điểm và bảng xếp hạng.
            </div>
          )}

          {!registerOk && (
            <div className="rounded-xl bg-red-500/20 border border-red-400/40 p-4 mb-6 text-red-100 text-sm">
              Chưa đăng ký tham gia.{' '}
              <button type="button" className="underline font-semibold" onClick={() => tryRegister()}>
                Thử đăng ký lại
              </button>
            </div>
          )}

          {sortedProblems.length === 0 && (
            <p className="text-white/60">Chưa có câu hỏi trong cuộc thi này.</p>
          )}

          {allDone && sortedProblems.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 border border-white/20 p-8 text-center">
              <p className="text-2xl font-bold text-emerald-200 mb-2">Hoàn thành!</p>
              <p className="text-white/80">
                Tổng điểm: <span className="text-amber-300 font-bold text-xl">{myStats?.totalScore ?? 0}</span>
              </p>
            </div>
          )}

          {!allDone && currentProblem && (
            <form
              onSubmit={handleSubmit}
              className={`rounded-2xl border-2 transition-all duration-300 ${
                feedback === 'correct'
                  ? 'border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.45)] bg-emerald-950/30'
                  : feedback === 'wrong'
                    ? 'border-red-400 shadow-[0_0_24px_rgba(248,113,113,0.35)] bg-red-950/20'
                    : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="p-6 md:p-8">
                <p className="text-xs text-white/50 mb-2">
                  Câu {(sortedProblems.findIndex((p) => p.id === currentProblem.id) ?? 0) + 1} /{' '}
                  {sortedProblems.length}
                  {currentProblem.maxScore != null && (
                    <span className="ml-2 text-amber-200/80">(+{currentProblem.maxScore} điểm)</span>
                  )}
                </p>
                <h2 className="text-xl font-bold text-white mb-2">{currentProblem.title}</h2>
                {currentProblem.description && (
                  <p className="text-white/75 mb-6 whitespace-pre-wrap">{currentProblem.description}</p>
                )}
                {(() => {
                  const hasUp =
                    currentProblem.hasUploadedImage === true ||
                    currentProblem.has_uploaded_image === true;
                  const ext = (currentProblem.imageUrl || '').trim();
                  const showBlob = hasUp && uploadedImageBlobUrl;
                  const showExternal = !hasUp && ext && !imageLoadError;
                  const showLoading = hasUp && !uploadedImageBlobUrl && !imageLoadError;
                  return (
                    <>
                      {showLoading && (
                        <p className="text-white/50 text-sm mb-3">Đang tải ảnh...</p>
                      )}
                      {(showBlob || showExternal) && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                          <img
                            src={showBlob ? uploadedImageBlobUrl : ext}
                            alt=""
                            className="w-full max-h-72 object-contain mx-auto bg-black/30"
                            referrerPolicy={showBlob ? undefined : 'no-referrer'}
                            loading="eager"
                            decoding="async"
                            onError={() => setImageLoadError(true)}
                          />
                        </div>
                      )}
                      {imageLoadError && (
                        <p className="text-amber-200/90 text-sm mb-4 rounded-lg bg-amber-900/30 border border-amber-500/30 px-3 py-2">
                          {hasUp
                            ? 'Không tải được ảnh từ server. Thử tạo lại hoặc upload ảnh khác.'
                            : 'Không tải được ảnh (URL chặn hotlink hoặc cần https).'}
                        </p>
                      )}
                    </>
                  );
                })()}
                <label className="block text-sm font-semibold text-white/80 mb-2">Đáp án (tiếng Anh)</label>
                <input
                  type="text"
                  className="w-full input-field bg-white/10 border-white/20 text-white placeholder-white/40 mb-4"
                  placeholder="Ví dụ: dog"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={submitting || !inWindow || !registerOk}
                  autoComplete="off"
                />
                {feedback === 'correct' && (
                  <p className="text-emerald-300 font-semibold mb-2 animate-pulse">Đúng rồi!</p>
                )}
                {feedback === 'wrong' && (
                  <p className="text-red-300 font-semibold mb-2">
                    Chưa đúng — đã ghi nhận. Sang câu tiếp theo!
                  </p>
                )}
                <button
                  type="submit"
                  className="btn-primary w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 border-0"
                  disabled={submitting || !inWindow || !registerOk || !answer.trim()}
                >
                  {submitting ? 'Đang gửi...' : 'Nộp đáp án'}
                </button>
              </div>
            </form>
          )}
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 space-y-3 w-full shrink-0">
            <div className="rounded-xl bg-black/40 backdrop-blur-md border border-white/10 p-4 shadow-xl">
              <p className="text-xs text-white/60 uppercase tracking-wide">Điểm</p>
              <p className="text-3xl font-bold text-amber-300 tabular-nums">{myStats?.totalScore ?? 0}</p>
              {myStats?.rank != null && (
                <p className="text-sm text-white/80 mt-1">
                  Hạng: <span className="font-semibold text-cyan-300">#{myStats.rank}</span>
                </p>
              )}
              <p className="text-xs text-white/50 mt-2">
                {myStats?.problemsAnswered ?? 0}/{myStats?.totalProblems ?? sortedProblems.length} câu
              </p>
            </div>
            <div className="rounded-xl bg-black/40 backdrop-blur-md border border-white/10 p-4 shadow-xl">
              <p className="text-xs text-white/60 uppercase tracking-wide">Thời gian còn lại</p>
              <p className="text-2xl font-mono font-bold text-emerald-300 tabular-nums">
                {afterEnd ? '0:00' : remainingSec != null ? formatRemain(remainingSec) : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-black/40 backdrop-blur-md border border-white/10 p-3 shadow-xl max-h-60 overflow-y-auto">
              <p className="text-xs text-white/60 uppercase tracking-wide mb-2">Bảng xếp hạng</p>
              <ul className="space-y-1.5 text-sm">
                {(ranking || []).slice(0, 8).map((row, i) => (
                  <li
                    key={`${row.userId}-${i}`}
                    className="flex justify-between gap-2 border-b border-white/5 pb-1"
                  >
                    <span className="text-white/90 truncate">
                      <span className="text-amber-400/90 font-mono w-6 inline-block">#{row.rank}</span>{' '}
                      {row.username || `User ${row.userId}`}
                    </span>
                    <span className="text-cyan-300 font-semibold tabular-nums shrink-0">{row.totalScore}</span>
                  </li>
                ))}
                {(!ranking || ranking.length === 0) && (
                  <li className="text-white/40 text-xs">Chưa có điểm</li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
