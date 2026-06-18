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
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
            <p className="text-slate-600">Đang tải chi tiết...</p>
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
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          {/* Header */}
          <button
            onClick={() => navigate('/quiz-history')}
            className="mb-6 flex items-center gap-2 font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            ← Quay lại lịch sử
          </button>

          {/* Score Card */}
          <div className="card mb-8 border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-semibold text-slate-900">Chi tiết kết quả</h1>
              <div className="text-5xl font-semibold text-slate-900">{scorePercentage}%</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-slate-600">Đúng</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">{correctCount}</p>
              </div>
              <div className="text-center border-l border-r border-slate-200">
                <p className="text-sm text-slate-600">Tổng cộng</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{totalCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Sai</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">{totalCount - correctCount}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="card mb-6 border-red-200 bg-red-50">
              <p className="font-semibold text-red-700">{error}</p>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={result.id || `${quizId}-${index}`}
                className={`card border-l-4 ${
                  result.correct ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-3xl font-bold flex-shrink-0 ${
                    result.correct ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.correct ? 'Đúng' : 'Sai'}
                  </div>
                  <div className="flex-grow">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">
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
                        <p className="mb-1 text-sm text-slate-500">
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
                        <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-3">
                          <p className="mb-1 text-sm text-slate-500">✓ Đáp án đúng</p>
                          <p className="font-semibold text-emerald-700">
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
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              Quay lại lịch sử
            </button>
            <button
              onClick={() => navigate('/lessons')}
              className="btn-secondary flex items-center gap-2 px-6 py-3"
            >
              Tiếp tục học
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
