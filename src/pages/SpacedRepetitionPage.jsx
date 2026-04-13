import { useEffect, useState } from 'react';
import { spacedRepetitionAPI } from '../services';
import Layout from '../components/Layout';

export default function SpacedRepetitionPage() {
  const [summary, setSummary] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
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
  };

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

  const getCardCount = (date) => {
    const dateStr = date.split('T')[0]; // Convert to YYYY-MM-DD
    const calendarDay = calendar.find((d) => d.date === dateStr);
    return calendarDay?.dueCount || 0;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

  if (loading)
    return (
      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 flex items-center justify-center min-h-screen">
          <div className="text-3xl font-bold text-gray-600">⏳ Đang tải...</div>
        </div>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 flex items-center justify-center min-h-screen">
          <div className="text-xl text-red-600 font-semibold">{error}</div>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 min-h-screen">
        <div className="max-w-6xl w-full mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ôn tập theo Spaced Repetition</h1>
          <p className="text-gray-600">Luyện tập từ vựng theo cơ chế lặp lại ngắt quãng</p>
        </div>

        {/* Daily Summary Cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Learning Due */}
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium">Cần học</p>
                  <p className="text-4xl font-bold text-blue-600">{summary.learningDue}</p>
                </div>
              </div>
            </div>

            {/* Review Due */}
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium">Cần ôn</p>
                  <p className="text-4xl font-bold text-purple-600">{summary.reviewDue}</p>
                </div>
                <div className="text-5xl">R</div>
              </div>
            </div>

            {/* Total Due */}
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium">Tổng cộng</p>
                  <p className="text-4xl font-bold text-green-600">{summary.totalDue}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mb-8">
          <button
            onClick={() => (window.location.href = '/review-flashcard')}
            className="btn-primary px-8 py-4 text-lg font-semibold"
            disabled={!summary || summary.totalDue === 0}
          >
            {summary?.totalDue > 0 ? 'Bắt đầu ôn tập' : 'Không có bài nào hôm nay'}
          </button>
        </div>

        {/* Calendar */}
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrevMonth} className="px-4 py-2 hover:bg-gray-200 rounded-lg font-semibold">
                Trước
              </button>
              <h2 className="text-2xl font-bold text-center flex-grow capitalize">{monthName}</h2>
              <button onClick={handleNextMonth} className="px-4 py-2 hover:bg-gray-200 rounded-lg font-semibold">
                Sau
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                  <div key={day} className="text-center font-bold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDay }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square"></div>
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dateStr = date.toISOString();
                  const dueCount = getCardCount(dateStr);
                  
                  // Check if this is today
                  const today = new Date();
                  const isToday = 
                    day === today.getDate() && 
                    currentDate.getMonth() === today.getMonth() && 
                    currentDate.getFullYear() === today.getFullYear();

                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded-lg border-2 p-2 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                        isToday
                          ? 'bg-green-100 border-green-500 ring-2 ring-green-400 hover:bg-green-200'
                          : dueCount > 0
                          ? 'bg-blue-50 border-blue-400 hover:bg-blue-100'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`text-sm font-bold ${isToday ? 'text-green-700' : 'text-gray-900'}`}>
                        {isToday && '📍 '}{day}
                      </div>
                      {dueCount > 0 && (
                        <div className={`text-xs font-bold ${isToday ? 'text-green-700' : 'text-blue-600'} mt-1`}>
                          {dueCount} 📌
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => (window.location.href = '/review-settings')}
            className="text-blue-600 hover:underline font-semibold"
          >
            Cài đặt Spaced Repetition
          </button>
        </div>
      </div>
    </div>
    </Layout>
  );
}
