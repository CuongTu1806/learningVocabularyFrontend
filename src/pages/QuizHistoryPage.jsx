import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../services';
import Layout from '../components/Layout';

export default function QuizHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    mode: '',
    minScore: '',
    maxScore: '',
    startDate: '',
    endDate: '',
  });

  const quizModes = [
    { value: '', label: 'Tất cả chế độ' },
    { value: 'ENG_TO_VN', label: 'Dịch Anh → Việt' },
    { value: 'VN_TO_ENG', label: 'Dịch Việt → Anh' },
    { value: 'VN_FILL_ENG', label: 'Điền Anh (từ Việt)' },
  ];

  const fetchHistory = async (pageNum = 0) => {
    try {
      setLoading(true);
      setError('');

      // Build filter object
      const filterObj = {};
      if (filters.name) filterObj.name = filters.name;
      if (filters.mode) filterObj.mode = filters.mode;
      if (filters.minScore) filterObj.minScore = Number.parseInt(filters.minScore, 10);
      if (filters.maxScore) filterObj.maxScore = Number.parseInt(filters.maxScore, 10);
      if (filters.startDate) {
        filterObj.startTime = `${filters.startDate}T00:00:00`;
      }
      if (filters.endDate) {
        filterObj.endTime = `${filters.endDate}T23:59:59`;
      }

      const response = await quizAPI.getHistory(filterObj, pageNum, 10);
      
      // Handle Spring Data Page response
      const data = response.data || response;
      const content = data.content || data || [];
      
      setHistory(Array.isArray(content) ? content : []);
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Fetch history error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Không thể tải lịch sử quiz');
      setHistory([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(0);
  }, []);

  const handleSearch = () => {
    console.log('Fetching with filters:', filters);
    fetchHistory(0);
  };

  const handleReset = () => {
    setFilters({
      name: '',
      mode: '',
      minScore: '',
      maxScore: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleViewDetail = (quizId) => {
    navigate(`/quiz-result/${quizId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getModeLabel = (mode) => {
    const modeObj = quizModes.find(m => m.value === mode);
    return modeObj ? modeObj.label : mode;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-semibold tracking-tight text-slate-900">
              Lịch sử Quiz
            </h1>
            <p className="text-slate-600">Xem và quản lý tất cả các bài quiz mà bạn đã làm</p>
          </div>

          {/* Filter Section */}
          <div className="card mb-8">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">Tìm kiếm và lọc</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Search by name */}
              <div>
                <label htmlFor="quiz-history-name" className="mb-2 block text-sm font-semibold text-slate-700">
                  Tên Quiz
                </label>
                <input
                  id="quiz-history-name"
                  type="text"
                  placeholder="Nhập tên bài quiz..."
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Mode filter */}
              <div>
                <label htmlFor="quiz-history-mode" className="mb-2 block text-sm font-semibold text-slate-700">
                  Chế độ
                </label>
                <select
                  id="quiz-history-mode"
                  value={filters.mode}
                  onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                  className="input-field"
                >
                  {quizModes.map(mode => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start date */}
              <div>
                <label htmlFor="quiz-history-start-date" className="mb-2 block text-sm font-semibold text-slate-700">
                  Từ ngày
                </label>
                <input
                  id="quiz-history-start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* End date */}
              <div>
                <label htmlFor="quiz-history-end-date" className="mb-2 block text-sm font-semibold text-slate-700">
                  Đến ngày
                </label>
                <input
                  id="quiz-history-end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Min score */}
              <div>
                <label htmlFor="quiz-history-min-score" className="mb-2 block text-sm font-semibold text-slate-700">
                  Điểm tối thiểu
                </label>
                <input
                  id="quiz-history-min-score"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={filters.minScore}
                  onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Max score */}
              <div>
                <label htmlFor="quiz-history-max-score" className="mb-2 block text-sm font-semibold text-slate-700">
                  Điểm tối đa
                </label>
                <input
                  id="quiz-history-max-score"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={filters.maxScore}
                  onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                className="btn-primary flex items-center gap-2 py-2 px-6"
              >
                Tìm kiếm
              </button>
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center gap-2 py-2 px-6"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="card bg-red-50 border-red-200 mb-6">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
                <p className="text-slate-600">Đang tải dữ liệu...</p>
              </div>
            </div>
          )}

          {/* History table */}
          {!loading && history.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Bài Quiz</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Chế độ</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Ngày giờ</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Điểm</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={item.quizId || `${item.createdAt || 'time'}-${item.lessonName || 'quiz'}`} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{item.lessonName || 'Quiz'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                          {getModeLabel(item.mode)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                          {item.score}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleViewDetail(item.quizId)}
                          className="font-semibold text-slate-900 underline-offset-4 transition hover:underline"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!loading && history.length === 0 && (
            <div className="card text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-slate-100" />
              <p className="text-lg text-slate-600">Chưa có lịch sử quiz</p>
              <p className="mt-2 text-sm text-slate-500">Hãy làm bài quiz để tạo lịch sử</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-slate-600">
                Trang {page + 1} / {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchHistory(page - 1)}
                  disabled={page === 0}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    page === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  ← Trang trước
                </button>
                <button
                  onClick={() => fetchHistory(page + 1)}
                  disabled={page >= totalPages - 1}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    page >= totalPages - 1
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Trang sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
