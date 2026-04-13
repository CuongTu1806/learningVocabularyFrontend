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
  const [pageSize] = useState(10);
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
      if (filters.minScore) filterObj.minScore = parseInt(filters.minScore);
      if (filters.maxScore) filterObj.maxScore = parseInt(filters.maxScore);
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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3 mb-2">
              📜 Lịch sử Quiz
            </h1>
            <p className="text-gray-600">Xem và quản lý tất cả các bài quiz mà bạn đã làm</p>
          </div>

          {/* Filter Section */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold mb-6">Tìm kiếm & Lọc</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Search by name */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Tên Quiz
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên bài quiz..."
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Mode filter */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Chế độ
                </label>
                <select
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
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* End date */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Min score */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Điểm tối thiểu
                </label>
                <input
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
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Điểm tối đa
                </label>
                <input
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
                🔍 Tìm kiếm
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải dữ liệu...</p>
              </div>
            </div>
          )}

          {/* History table */}
          {!loading && history.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Bài Quiz</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Chế độ</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Ngày giờ</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-800">Điểm</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-800">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{item.lessonName || 'Quiz'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {getModeLabel(item.mode)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
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
                          className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition"
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
              <p className="text-5xl mb-4">📭</p>
              <p className="text-gray-600 text-lg">Chưa có lịch sử quiz</p>
              <p className="text-gray-500 text-sm mt-2">Hãy làm bài quiz để tạo lịch sử</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-gray-600">
                Trang {page + 1} / {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchHistory(page - 1)}
                  disabled={page === 0}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    page === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  ← Trang trước
                </button>
                <button
                  onClick={() => fetchHistory(page + 1)}
                  disabled={page >= totalPages - 1}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    page >= totalPages - 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
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
