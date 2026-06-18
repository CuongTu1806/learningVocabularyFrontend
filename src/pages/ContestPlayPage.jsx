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
      <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 px-6 pt-8 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0 max-w-3xl order-2 lg:order-1">
          <button
            type="button"
            onClick={() => navigate('/contests')}
            className="mb-6 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            ← Cuộc thi
          </button>

          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">{contest.title}</h1>
          <p className="mb-8 whitespace-pre-wrap text-sm text-slate-600">{contest.description}</p>

          {beforeStart && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              Cuộc thi chưa bắt đầu. Thời gian bắt đầu:{' '}
              {contest.startTime ? new Date(contest.startTime).toLocaleString('vi-VN') : '—'}
            </div>
          )}
          {afterEnd && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-100 p-4 text-slate-600">
              Cuộc thi đã kết thúc. Bạn vẫn xem được điểm và bảng xếp hạng.
            </div>
          )}

          {!registerOk && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Chưa đăng ký tham gia.{' '}
              <button type="button" className="underline font-semibold" onClick={() => tryRegister()}>
                Thử đăng ký lại
              </button>
            </div>
          )}

          {sortedProblems.length === 0 && (
            <p className="text-slate-500">Chưa có câu hỏi trong cuộc thi này.</p>
          )}

          {allDone && sortedProblems.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="mb-2 text-2xl font-semibold text-slate-900">Hoàn thành!</p>
              <p className="text-slate-600">
                Tổng điểm: <span className="text-xl font-semibold text-slate-900">{myStats?.totalScore ?? 0}</span>
              </p>
            </div>
          )}

          {!allDone && currentProblem && (
            <form
              onSubmit={handleSubmit}
              className={`rounded-2xl border-2 transition-all duration-300 ${
                feedback === 'correct'
                  ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                  : feedback === 'wrong'
                    ? 'border-red-300 bg-red-50 shadow-sm'
                    : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div className="p-6 md:p-8">
                <p className="mb-2 text-xs text-slate-500">
                  Câu {(sortedProblems.findIndex((p) => p.id === currentProblem.id) ?? 0) + 1} /{' '}
                  {sortedProblems.length}
                  {currentProblem.maxScore != null && (
                    <span className="ml-2 text-slate-500">(+{currentProblem.maxScore} điểm)</span>
                  )}
                </p>
                <h2 className="mb-2 text-xl font-semibold text-slate-900">{currentProblem.title}</h2>
                {currentProblem.description && (
                  <p className="mb-6 whitespace-pre-wrap text-slate-600">{currentProblem.description}</p>
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
                        <p className="mb-3 text-sm text-slate-500">Đang tải ảnh...</p>
                      )}
                      {(showBlob || showExternal) && (
                        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <img
                            src={showBlob ? uploadedImageBlobUrl : ext}
                            alt=""
                            className="mx-auto w-full max-h-72 object-contain bg-slate-100"
                            referrerPolicy={showBlob ? undefined : 'no-referrer'}
                            loading="eager"
                            decoding="async"
                            onError={() => setImageLoadError(true)}
                          />
                        </div>
                      )}
                      {imageLoadError && (
                        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          {hasUp
                            ? 'Không tải được ảnh từ server. Thử tạo lại hoặc upload ảnh khác.'
                            : 'Không tải được ảnh (URL chặn hotlink hoặc cần https).'}
                        </p>
                      )}
                    </>
                  );
                })()}
                <label className="mb-2 block text-sm font-semibold text-slate-700">Đáp án (tiếng Anh)</label>
                <input
                  type="text"
                  className="mb-4 w-full input-field"
                  placeholder="Ví dụ: dog"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={submitting || !inWindow || !registerOk}
                  autoComplete="off"
                />
                {feedback === 'correct' && (
                  <p className="mb-2 font-semibold text-emerald-700 animate-pulse">Đúng rồi!</p>
                )}
                {feedback === 'wrong' && (
                  <p className="mb-2 font-semibold text-red-700">
                    Chưa đúng — đã ghi nhận. Sang câu tiếp theo!
                  </p>
                )}
                <button
                  type="submit"
                  className="btn-primary w-full py-3"
                  disabled={submitting || !inWindow || !registerOk || !answer.trim()}
                >
                  {submitting ? 'Đang gửi...' : 'Nộp đáp án'}
                </button>
              </div>
            </form>
          )}
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 space-y-3 w-full shrink-0">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Điểm</p>
              <p className="tabular-nums text-3xl font-semibold text-slate-900">{myStats?.totalScore ?? 0}</p>
              {myStats?.rank != null && (
                <p className="mt-1 text-sm text-slate-600">
                  Hạng: <span className="font-semibold text-slate-900">#{myStats.rank}</span>
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                {myStats?.problemsAnswered ?? 0}/{myStats?.totalProblems ?? sortedProblems.length} câu
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Thời gian còn lại</p>
              <p className="tabular-nums text-2xl font-semibold text-slate-900">
                {afterEnd ? '0:00' : remainingSec != null ? formatRemain(remainingSec) : '—'}
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Bảng xếp hạng</p>
              <ul className="space-y-1.5 text-sm">
                {(ranking || []).slice(0, 8).map((row, i) => (
                  <li
                    key={`${row.userId}-${i}`}
                    className="flex justify-between gap-2 border-b border-slate-100 pb-1"
                  >
                    <span className="truncate text-slate-700">
                      <span className="inline-block w-6 font-mono text-slate-500">#{row.rank}</span>{' '}
                      {row.username || `User ${row.userId}`}
                    </span>
                    <span className="shrink-0 tabular-nums font-semibold text-slate-900">{row.totalScore}</span>
                  </li>
                ))}
                {(!ranking || ranking.length === 0) && (
                  <li className="text-xs text-slate-500">Chưa có điểm</li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
