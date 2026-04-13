import { useEffect, useState } from 'react';
import { spacedRepetitionAPI } from '../services';
import Layout from '../components/Layout';

export default function ReviewFlashcardPage() {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedCards, setCompletedCards] = useState([]);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);

  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    try {
      setLoading(true);
      const response = await spacedRepetitionAPI.getDue();
      setCards(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải flashcard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating) => {
    try {
      const currentCard = cards[currentIndex];
      await spacedRepetitionAPI.answer({
        userVocabularyId: currentCard.userVocabularyId,
        rating: rating,
      });

      setCompletedCards([...completedCards, { ...currentCard, rating }]);
      setSelectedRating(rating);
      setRatingSubmitted(true);
      setFlipped(false);
    } catch (err) {
      console.error('Lỗi khi gửi đáp án:', err);
      alert('Không thể lưu đáp án. Vui lòng thử lại.');
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setRatingSubmitted(false);
      setSelectedRating(null);
    } else {
      handleCompleted();
    }
  };

  const handleCompleted = () => {
    setTimeout(() => {
      // Chuyển đến trang kết quả hoặc quay lại
      window.location.href = '/spaced-repetition';
    }, 1500);
  };

  if (loading)
    return (
      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 flex items-center justify-center min-h-screen">
          <div className="text-3xl font-bold text-gray-600">⏳ Đang tải flashcard...</div>
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

  if (cards.length === 0)
    return (
      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 flex items-center justify-center min-h-screen">
          <div className="card max-w-md text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-4">Hoàn tất!</h2>
            <p className="text-gray-600 mb-6">Không có flashcard nào cần ôn tập hôm nay</p>
            <button
              onClick={() => (window.location.href = '/spaced-repetition')}
              className="btn-primary w-full py-3"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </Layout>
    );

  const currentCard = cards[currentIndex];
  const progress = currentIndex + 1;
  const total = cards.length;

  // Show completion message
  if (currentIndex >= cards.length) {
    return (
      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 flex items-center justify-center min-h-screen">
          <div className="card max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Xuất sắc!</h2>
            <p className="text-gray-600 mb-4">
              Bạn đã hoàn thành <span className="font-bold text-blue-600">{completedCards.length}</span> flashcard
            </p>
            <p className="text-sm text-gray-500 mb-6">Quay trở lại trang Spaced Repetition...</p>
            <div className="animate-pulse">
              <div className="h-8 bg-blue-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 min-h-screen">
        <div className="max-w-2xl w-full mx-auto px-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-700">
              Flashcard {progress}/{total}
            </h2>
            <span className="text-lg font-bold text-blue-600">
              {Math.round((progress / total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${(progress / total) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-12">
          <div className="card min-h-96 flex flex-col items-center justify-center p-8">
            {!ratingSubmitted ? (
              // Before rating - Show front + rating buttons
              <div className="text-center w-full">
                <p className="text-gray-500 text-sm mb-6">Phía trước</p>
                <p className="text-5xl font-bold text-blue-600 mb-12">{currentCard.word}</p>
                
                {/* Rating Buttons */}
                <div className="grid grid-cols-4 gap-3">
                  {/* Again */}
                  <button
                    onClick={() => handleRate('again')}
                    className="p-4 rounded-lg font-bold text-sm transition-all hover:scale-105 bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    <div className="text-2xl mb-1">🔴</div>
                    <div className="text-xs">Again</div>
                  </button>

                  {/* Hard */}
                  <button
                    onClick={() => handleRate('hard')}
                    className="p-4 rounded-lg font-bold text-sm transition-all hover:scale-105 bg-orange-100 text-orange-700 hover:bg-orange-200"
                  >
                    <div className="text-2xl mb-1">🟠</div>
                    <div className="text-xs">Hard</div>
                  </button>

                  {/* Good */}
                  <button
                    onClick={() => handleRate('good')}
                    className="p-4 rounded-lg font-bold text-sm transition-all hover:scale-105 bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    <div className="text-2xl mb-1">🟢</div>
                    <div className="text-xs">Good</div>
                  </button>

                  {/* Easy */}
                  <button
                    onClick={() => handleRate('easy')}
                    className="p-4 rounded-lg font-bold text-sm transition-all hover:scale-105 bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-xs">Easy</div>
                  </button>
                </div>

                <p className="text-gray-400 text-sm italic mt-6">(Chọn độ khó)</p>
              </div>
            ) : !flipped ? (
              // After rating, front side - Show front word
              <div className="text-center w-full">
                <p className="text-gray-500 text-sm mb-6">Phía trước</p>
                <p className="text-5xl font-bold text-blue-600 mb-8">{currentCard.word}</p>
                <div className="bg-gray-50 p-3 rounded-lg inline-block">
                  <p className="text-sm text-gray-600">Độ khó: <span className="font-bold text-blue-600">{selectedRating}</span></p>
                </div>
              </div>
            ) : (
              // After rating, back side - Show meaning + info
              <div className="text-center w-full">
                <p className="text-gray-500 text-sm mb-4">Kết quả</p>
                <p className="text-3xl font-semibold text-purple-600 mb-6">{currentCard.meaning}</p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="font-semibold">Bước học:</p>
                    <p className="text-lg text-blue-600 font-bold">{currentCard.learningStep || '—'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Trạng thái:</p>
                    <p className="text-lg text-purple-600 font-bold capitalize">{currentCard.state}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Interval:</p>
                    <p className="text-lg text-green-600 font-bold">{currentCard.intervalDays} ngày</p>
                  </div>
                  <div>
                    <p className="font-semibold">Ease Factor:</p>
                    <p className="text-lg text-orange-600 font-bold">{currentCard.easeFactor.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - After rating */}
        {ratingSubmitted && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setFlipped(!flipped)}
              className="py-3 px-4 rounded-lg font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
            >
              {flipped ? 'Xem mặt trước' : 'Xem mặt sau'}
            </button>
            <button
              onClick={handleNext}
              className="py-3 px-4 rounded-lg font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-all"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => (window.location.href = '/spaced-repetition')}
            className="text-gray-600 hover:text-gray-900 font-semibold"
          >
            ← Quay lại Spaced Repetition
          </button>
        </div>
      </div>
    </div>
    </Layout>
  );
}
