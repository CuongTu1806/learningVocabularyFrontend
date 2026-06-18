import { useCallback, useEffect, useState } from 'react';
import { spacedRepetitionAPI } from '../services';
import Layout from '../components/Layout';

export default function SpacedRepetitionPage() {
  const [summary, setSummary] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const [summaryRes, calendarRes] = await Promise.all([
        spacedRepetitionAPI.getSummary(),
        spacedRepetitionAPI.getCalendar(year, month),
      ]);

      setSummary(summaryRes.data);
      setCalendar(calendarRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCardCount = (date) => {
    const dateStr = formatLocalDateKey(date);
    const calendarDay = calendar.find((d) => d.date === dateStr);
    return calendarDay?.dueCount || 0;
  };

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

  if (loading)
    return (
      <Layout>
        <div className="bg-slate-50 py-12 flex items-center justify-center min-h-screen">
          <div className="text-2xl font-semibold text-slate-600">Đang tải...</div>
        </div>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <div className="bg-slate-50 py-12 flex items-center justify-center min-h-screen">
          <div className="text-xl text-red-600 font-semibold">{error}</div>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Ôn tập theo Spaced Repetition</h1>
            <p className="mt-2 text-slate-600">Luyện tập từ vựng theo cơ chế lặp lại ngắt quãng</p>
          </div>

          {summary && (
            <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 xl:grid-cols-4">
              <div className="card border-slate-200 bg-white">
                <p className="text-sm font-medium text-slate-500">Learning</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900">{summary.learningDue}</p>
              </div>
              <div className="card border-slate-200 bg-white">
                <p className="text-sm font-medium text-slate-500">Relearning</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900">{summary.relearningDue}</p>
              </div>
              <div className="card border-slate-200 bg-white">
                <p className="text-sm font-medium text-slate-500">Review</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900">{summary.reviewDue}</p>
              </div>
              <div className="card border-slate-200 bg-white">
                <p className="text-sm font-medium text-slate-500">Tổng cộng</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900">{summary.totalDue}</p>
              </div>
            </div>
          )}

          <div className="mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => (globalThis.location.href = '/review-flashcard')}
              className="btn-primary px-6 py-3 font-semibold"
              disabled={!summary || summary.totalDue === 0}
            >
              {summary?.totalDue > 0 ? 'Bắt đầu ôn tập' : 'Không có bài nào hôm nay'}
            </button>
            <button
              onClick={() => (globalThis.location.href = '/review-settings')}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Cài đặt Spaced Repetition
            </button>
          </div>

          <div className="card border-slate-200 bg-white">
            <div className="mb-5 flex items-center justify-between gap-3">
              <button onClick={handlePrevMonth} className="btn-secondary px-4 py-2 font-semibold">
                Trước
              </button>
              <h2 className="flex-1 text-center text-2xl font-semibold capitalize text-slate-900">{monthName}</h2>
              <button onClick={handleNextMonth} className="btn-secondary px-4 py-2 font-semibold">
                Sau
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                {dayNames.map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, idx) => (
                  <div key={`empty-${firstDay}-${idx}`} className="aspect-square" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dueCount = getCardCount(date);
                  const today = new Date();
                  const isToday =
                    day === today.getDate() &&
                    currentDate.getMonth() === today.getMonth() &&
                    currentDate.getFullYear() === today.getFullYear();
                  let dayClasses = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

                  if (dueCount > 0) {
                    dayClasses = 'border-blue-200 bg-blue-50 text-slate-900 hover:bg-blue-100';
                  }

                  if (isToday) {
                    dayClasses = 'border-slate-900 bg-slate-900 text-white';
                  }

                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded-xl border p-2 text-center transition-all ${dayClasses}`}
                    >
                      <div className="flex h-full flex-col items-center justify-center">
                        <div className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-slate-900'}`}>
                          {day}
                        </div>
                        {dueCount > 0 && (
                          <div className={`mt-1 text-xs font-semibold ${isToday ? 'text-white/90' : 'text-blue-700'}`}>
                            {dueCount} due
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
