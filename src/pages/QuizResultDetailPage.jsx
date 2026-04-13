import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services';
import Layout from '../components/Layout';

export default function QuizResultDetailPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const response = await quizAPI.getHistoryDetail(quizId);
        
        // Handle different response formats
        const data = response.data || response;
        const resultList = Array.isArray(data) ? data : (data.content || data || []);
        
        setResults(resultList);
        setError('');
      } catch (err) {
        console.error('Fetch detail error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Không thể tải chi tiết kết quả');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchResult();
    }
  }, [quizId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải chi tiết...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const correctCount = results.filter(r => r.correct).length;
  const totalCount = results.length;
  const scorePercentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <button
            onClick={() => navigate('/quiz-history')}
            className="mb-6 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
          >
            ← Quay lại lịch sử
          </button>

          {/* Score Card */}
          <div className="card mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Chi tiết kết quả</h1>
              <div className="text-5xl font-bold text-blue-600">{scorePercentage}%</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Đúng</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{correctCount}</p>
              </div>
              <div className="text-center border-l border-r border-gray-300">
                <p className="text-gray-600 text-sm">Tổng cộng</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalCount}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Sai</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{totalCount - correctCount}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="card bg-red-50 border-red-200 mb-6">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`card border-l-4 ${
                  result.correct ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-3xl font-bold flex-shrink-0 ${
                    result.correct ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.correct ? '✅' : '❌'}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Câu {index + 1}: {result.content || 'Câu hỏi'}
                    </h3>

                    {/* Answer comparison */}
                    <div className="space-y-3">
                      {/* Your answer */}
                      <div className={`p-3 rounded-lg border-2 ${
                        result.correct 
                          ? 'bg-green-50 border-green-500' 
                          : 'bg-red-50 border-red-500'
                      }`}>
                        <p className="text-sm text-gray-600 mb-1">
                          {result.correct ? '✓ Bạn trả lời' : '✗ Bạn trả lời'}
                        </p>
                        <p className={`font-semibold ${
                          result.correct ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.userAnswer || '(không trả lời)'}
                        </p>
                      </div>

                      {/* Correct answer (if wrong) */}
                      {!result.correct && (
                        <div className="p-3 rounded-lg bg-green-50 border-2 border-green-500">
                          <p className="text-sm text-gray-600 mb-1">✓ Đáp án đúng</p>
                          <p className="font-semibold text-green-700">
                            {result.correctAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-12 flex gap-3 justify-center">
            <button
              onClick={() => navigate('/quiz-history')}
              className="btn-primary py-3 px-6 flex items-center gap-2"
            >
              📜 Quay lại lịch sử
            </button>
            <button
              onClick={() => navigate('/lessons')}
              className="btn-secondary py-3 px-6 flex items-center gap-2"
            >
              Tiếp tục học
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
