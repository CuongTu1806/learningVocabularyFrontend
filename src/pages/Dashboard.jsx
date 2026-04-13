import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { vocabularyAPI } from '../services';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setSearching(true);
      const response = await vocabularyAPI.search(query);
      setSearchResults(response.data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length > 1) {
      handleSearch(value);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Search Box */}
          <div className="mb-12 relative">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Tìm kiếm từ vựng..."
                value={searchQuery}
                onChange={handleInputChange}
                className="w-full px-6 py-4 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg border-0"
              />
              {searching && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-full max-w-2xl mt-2 bg-white rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-4">
                  {searchResults.map((vocab, index) => (
                    <div
                      key={index}
                      className="p-4 border-b border-gray-200 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <h3 className="font-bold text-lg text-gray-800">{vocab.term || vocab.vocabulary}</h3>
                          <p className="text-gray-600 mt-1">{vocab.meaning || vocab.definition || 'N/A'}</p>
                          {vocab.example && (
                            <p className="text-gray-500 text-sm italic mt-2">
                              Ví dụ: {vocab.example}
                            </p>
                          )}
                        </div>
                        {vocab.pronunciation && (
                          <span className="text-blue-600 text-sm font-semibold ml-4 flex-shrink-0">
                            /{vocab.pronunciation}/
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {showResults && searchResults.length === 0 && !searching && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-full max-w-2xl mt-2 bg-white rounded-2xl shadow-xl z-50 p-6 text-center">
                <p className="text-gray-600">Không tìm thấy kết quả cho "{searchQuery}"</p>
              </div>
            )}
          </div>

          {/* Welcome Card */}
          <div className="card mb-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold text-white flex-shrink-0">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-800">Chào mừng, {user?.username || 'User'}!</h2>
                <p className="text-gray-600 mt-2">Bạn đã đăng nhập vào Learning Vocabulary Platform. Chúc bạn có một ngày học tập hiệu quả!</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div onClick={() => window.location.href = '/lessons'} className="card bg-gradient-to-br from-blue-400 to-blue-600 p-8 text-white hover:shadow-xl transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold">Bài học</h3>
                <span className="text-4xl opacity-50">→</span>
              </div>
              <p className="text-blue-50 mb-6">Tiếp tục học các bài học mới hoặc ôn lại bài cũ</p>
              <button className="bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-all text-sm">
                Xem bài học
              </button>
            </div>

            <div onClick={() => window.location.href = '/lessons'} className="card bg-gradient-to-br from-purple-400 to-pink-500 p-8 text-white hover:shadow-xl transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold">Luyện tập</h3>
                <span className="text-4xl opacity-50">→</span>
              </div>
              <p className="text-purple-50 mb-6">Kiểm tra kiến thức với 3 chế độ quiz khác nhau</p>
              <button className="bg-white text-purple-600 font-semibold py-2 px-4 rounded-lg hover:bg-purple-50 transition-all text-sm">
                Bắt đầu quiz
              </button>
            </div>

            <div onClick={() => window.location.href = '/spaced-repetition'} className="card bg-gradient-to-br from-green-400 to-emerald-600 p-8 text-white hover:shadow-xl transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold">Ôn tập</h3>
                <span className="text-4xl opacity-50">→</span>
              </div>
              <p className="text-green-50 mb-6">Ôn tập từ vựng theo cơ chế Spaced Repetition thông minh</p>
              <button className="bg-white text-green-600 font-semibold py-2 px-4 rounded-lg hover:bg-green-50 transition-all text-sm">
                Bắt đầu ôn tập
              </button>
            </div>
          </div>

          {/* Features */}
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
