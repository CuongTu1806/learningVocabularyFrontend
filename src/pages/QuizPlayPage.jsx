import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/index';
import Layout from '../components/Layout';

export default function QuizPlayPage() {
  const { id: lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quizType = searchParams.get('mode') || 'ENG_TO_VN';

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime] = useState(Date.now()); // Lưu thời điểm bắt đầu quiz (ms)
  const [elapsedTime, setElapsedTime] = useState(0);

  // Cập nhật thời gian elapsed
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.round((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Fetch quiz on mount
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await quizAPI.create(lessonId, quizType);
        console.log('✅ Quiz created successfully:', response.data);
        console.log('  - Quiz ID:', response.data.quizId);
        console.log('  - Total questions:', response.data.questions.length);
        setQuiz(response.data);
      } catch (err) {
        console.error('❌ Lỗi tải quiz:', err);
        console.error('  - Response:', err.response?.data);
        setError(err.message || 'Không thể tải quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [lessonId, quizType]);

  const handleAnswer = (answer) => {
    setAnswers({
      ...answers,
      [currentIndex]: answer,
    });
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Tính thời gian làm quiz (từ giây)
      const endTime = Date.now();
      const durationInSeconds = Math.round((endTime - startTime) / 1000);
      
      // Format answers for backend
      const answerData = quiz.questions.map((question, idx) => ({
        questionId: question.quizResultId,
        userAnswer: answers[idx] || '',
      }));

      const submitBody = {
        quizId: quiz.quizId,
        answers: answerData,
        durationInSeconds: durationInSeconds,
      };

      console.log('📤 Submitting quiz data:');
      console.log('  - Quiz ID:', submitBody.quizId);
      console.log('  - Total answers:', submitBody.answers.length);
      console.log('  - Duration (seconds):', durationInSeconds);
      console.log('  - Answers:', submitBody.answers);

      // Submit quiz to backend
      const response = await quizAPI.submit(submitBody);

      console.log('✅ Quiz submitted successfully!');
      console.log('  - Correct answers:', response.data.correctAnswers);
      console.log('  - Score %:', response.data.correctPercentage);

      // Show result
      setResult(response.data);
      setQuizFinished(true);
    } catch (err) {
      console.error('❌ Lỗi submit quiz:');
      console.error('  - Error message:', err.message);
      console.error('  - Response error:', err.response?.data);
      console.error('  - Status code:', err.response?.status);
      alert('Lỗi nộp bài: ' + (err.response?.data?.message || err.message || 'Vui lòng thử lại'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">⏳ Đang tải quiz...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-4">❌ {error}</p>
            <button
              onClick={() => navigate(-1)}
              className="btn-primary py-2 px-4"
            >
              Quay lại
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 h-screen flex items-center justify-center">
          <p className="text-gray-600 font-semibold">❌ Không có câu hỏi</p>
        </div>
      </Layout>
    );
  }

  if (quizFinished) {
    return <Layout><QuizResultPage result={result} lessonId={lessonId} quizType={quizType} /></Layout>;
  }

  const current = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;
  const answered = answers.hasOwnProperty(currentIndex);

  return (
    <Layout>
      <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 py-12">
        <div className="max-w-2xl mx-auto px-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-white mb-2 text-sm font-semibold">
              <span>Câu {currentIndex + 1}/{quiz.questions.length}</span>
              <span>
                Đã trả lời {Object.keys(answers).length}/{quiz.questions.length} | Đã làm được {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{
                  width: `${((currentIndex + 1) / quiz.questions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="glass-effect p-8 mb-6 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {current.content}
            </h2>

            {/* Question Type Specific Rendering */}
            <QuestionRenderer
              quizType={quizType}
              question={current}
              selectedAnswer={answers[currentIndex]}
              onAnswer={handleAnswer}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="btn-secondary disabled:opacity-50 py-3 px-6"
            >
              ← Câu trước
            </button>

            {!isLast ? (
              <button
                onClick={handleNext}
                className="btn-primary py-3 px-6"
              >
                Câu tiếp →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary py-3 px-6 bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            )}
          </div>

          {/* Help Text */}
          <p className="text-white/80 text-sm text-center mt-6">
            {answered ? 'Bạn đã trả lời câu này' : 'Bạn chưa trả lời câu này'}
          </p>
        </div>
      </div>
    </Layout>
  );
}

function QuestionRenderer({ quizType, question, selectedAnswer, onAnswer }) {
  if (!question.answers || question.answers.length === 0) {
    return (
      <div className="text-white/80 text-center">Không có câu trả lời</div>
    );
  }

  // Multiple Choice (ENG_TO_VN, VN_TO_ENG)
  if (quizType === 'ENG_TO_VN' || quizType === 'VN_TO_ENG') {
    return (
      <div className="space-y-3">
        {question.answers.map((answer, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(answer)}
            className={`w-full p-4 rounded-lg font-semibold text-lg transition-all border-2 ${
              selectedAnswer === answer
                ? 'bg-white/40 border-white text-white'
                : 'bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/70'
            }`}
          >
            {answer}
          </button>
        ))}
      </div>
    );
  }

  // Fill in the blank (VN_FILL_ENG)
  if (quizType === 'VN_FILL_ENG') {
    const [input, setInput] = useState(selectedAnswer || '');

    const handleInputChange = (e) => {
      const value = e.target.value;
      setInput(value);
      onAnswer(value);
    };

    return (
      <div className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Gõ đáp án..."
          className="w-full p-4 rounded-lg text-gray-900 font-semibold text-lg border-2 border-white/50 focus:border-white focus:outline-none focus:ring-0"
          autoFocus
        />
        <p className="text-white/80 text-sm text-center">
          Gõ từ tiếng Anh tương ứng với câu Tiếng Việt trên
        </p>
      </div>
    );
  }

  return <div className="text-white/80">Kiểu quiz không được hỗ trợ</div>;
}

function QuizResultPage({ result, lessonId, quizType }) {
  const score = result?.correctAnswers || 0;
  const totalQuestions = result?.totalQuestions || 0;
  const percentage = result?.correctPercentage ? Math.round(result.correctPercentage) : 0;
  const resultDetails = result?.quizResultDetailResponse || [];
  const [showDetails, setShowDetails] = useState(false);

  const getMessage = () => {
    if (percentage >= 80) return { emoji: '', text: 'Xuật sắc!' };
    if (percentage >= 60) return { emoji: '', text: 'Tốt!' };
    return { emoji: '', text: 'Tiếp tục cố gắng!' };
  };

  const message = getMessage();

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 min-h-screen">
      <div className="max-w-2xl w-full mx-auto px-6">
        {/* Score Summary Card */}
        <div className="card text-center mb-8">
          <div className="text-6xl mb-4">{message.emoji}</div>
          <h2 className="text-3xl font-bold mb-4">{message.text}</h2>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {score}/{totalQuestions}
            </div>
            <p className="text-gray-700 font-semibold mb-3">Đúng {percentage}%</p>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 transition-all"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full py-3 font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-all"
            >
              {showDetails ? '▼ Ẩn chi tiết' : '▶ Xem chi tiết'} ({resultDetails.length} câu)
            </button>
            <button
              onClick={() =>
                window.location.href = `/quiz/${lessonId}?mode=${quizType}`
              }
              className="btn-primary w-full py-3 font-semibold"
            >
              Làm lại chế độ này
            </button>
            <button
              onClick={() => (window.location.href = `/quiz/${lessonId}`)}
              className="btn-secondary w-full py-3 font-semibold"
            >
              Chọn chế độ khác
            </button>
            <button
              onClick={() => (window.location.href = '/lessons')}
              className="text-blue-600 hover:underline w-full py-3 font-semibold"
            >
              Danh sách bài
            </button>
          </div>
        </div>

        {/* Detail Results */}
        {showDetails && resultDetails.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4">Chi tiết câu trả lời</h3>
            {resultDetails.map((detail, idx) => (
              <div
                key={idx}
                className={`card border-l-4 ${
                  detail.correct ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-2xl flex-shrink-0">
                    {detail.correct ? '✅' : '❌'}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-900">Câu {idx + 1}</p>
                    <p className="text-gray-700 mt-1">{detail.content}</p>
                  </div>
                </div>

                <div className="bg-white/60 p-3 rounded-lg space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Bạn trả lời:</p>
                    <p className={`${detail.correct ? 'text-green-700 font-semibold' : 'text-red-700'}`}>
                      {detail.userAnswer || '(bỏ trống)'}
                    </p>
                  </div>

                  {!detail.correct && (
                    <div>
                      <p className="text-gray-600 font-medium">Đáp án đúng:</p>
                      <p className="text-green-700 font-semibold">{detail.correctAnswer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

