import { useEffect, useState } from 'react';
import { spacedRepetitionAPI } from '../services';
import Layout from '../components/Layout';

const LEARNING_STATES = new Set(['learning', 'relearning']);
const DEFAULT_LEARNING_STEPS = [1, 10];
const DEFAULT_EASE_FACTOR = 2.5;
const DEFAULT_DELAY_FACTOR = 0;
const DEFAULT_EASY_BONUS = 1.3;
const DEFAULT_MAX_INTERVAL_DAYS = 365;

const parseLearningSteps = (rawSteps) => {
  const steps = String(rawSteps || '')
    .split(',')
    .map((step) => Number.parseInt(step.trim(), 10))
    .filter((step) => Number.isInteger(step) && step > 0);

  return steps.length > 0 ? steps : DEFAULT_LEARNING_STEPS;
};

const getDueTimestamp = (card) => {
  if (!card?.due) return Number.MAX_SAFE_INTEGER;
  const dueTime = new Date(card.due).getTime();
  return Number.isNaN(dueTime) ? Number.MAX_SAFE_INTEGER : dueTime;
};

const normalizeState = (state) => String(state || '').toLowerCase();

const formatIntervalText = (value, unit) => `${value} ${unit}`;

const getSm2Quality = (rating) => {
  switch (rating) {
    case 'again':
      return 0;
    case 'hard':
      return 3;
    case 'good':
      return 4;
    case 'easy':
      return 5;
    default:
      return 0;
  }
};

const getLearningPreview = (card, settings, rating) => {
  const learningSteps = parseLearningSteps(settings?.learningSteps);
  const currentStep = Math.max(1, card?.learningStep || 1);
  const currentStepIndex = Math.min(currentStep - 1, learningSteps.length - 1);
  const currentStepMinutes = learningSteps[currentStepIndex] ?? learningSteps[0];
  const nextStepIndex = Math.min(currentStep, learningSteps.length - 1);
  const nextStepMinutes = learningSteps.at(nextStepIndex) ?? learningSteps.at(-1);

  switch (rating) {
    case 'again':
      return { value: Math.max(1, learningSteps[0]), unit: 'phút' };
    case 'hard':
      return { value: Math.max(1, Math.floor(currentStepMinutes / 2)), unit: 'phút' };
    case 'good':
      return currentStep >= learningSteps.length
        ? { value: 1, unit: 'ngày' }
        : { value: Math.max(1, nextStepMinutes), unit: 'phút' };
    case 'easy':
      return currentStep >= 3
        ? { value: 1, unit: 'ngày' }
        : { value: Math.max(1, nextStepMinutes), unit: 'phút' };
    default:
      return { value: Math.max(1, learningSteps[0]), unit: 'phút' };
  }
};

const getReviewPreview = (card, settings, rating) => {
  const learningSteps = parseLearningSteps(settings?.learningSteps);
  const maxIntervalDays = settings?.maxIntervalDays > 0 ? settings.maxIntervalDays : DEFAULT_MAX_INTERVAL_DAYS;
  const easyBonus = settings?.easyBonus > 0 ? settings.easyBonus : DEFAULT_EASY_BONUS;
  const delayFactor = settings?.delayFactor ?? DEFAULT_DELAY_FACTOR;
  const oldInterval = card?.intervalDays > 0 ? card.intervalDays : 1;
  const oldEaseFactor = card?.easeFactor > 0 ? card.easeFactor : DEFAULT_EASE_FACTOR;
  const dueTime = card?.due ? new Date(card.due).getTime() : Number.NaN;
  const overdueDays = Number.isNaN(dueTime) || dueTime >= Date.now()
    ? 0
    : Math.floor((Date.now() - dueTime) / 86400000);
  const quality = getSm2Quality(rating);
  const newEaseFactor = Math.max(
    1.3,
    oldEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)) - overdueDays * delayFactor * 0.01
  );

  switch (rating) {
    case 'again':
      return { value: Math.max(1, learningSteps[0]), unit: 'phút' };
    case 'hard':
      return { value: Math.min(maxIntervalDays, Math.max(1, Math.round(oldInterval * 1.2))), unit: 'ngày' };
    case 'good':
      return { value: Math.min(maxIntervalDays, Math.max(1, Math.round(oldInterval * newEaseFactor))), unit: 'ngày' };
    case 'easy':
      return {
        value: Math.min(maxIntervalDays, Math.max(1, Math.round(oldInterval * newEaseFactor * easyBonus))),
        unit: 'ngày',
      };
    default:
      return { value: Math.min(maxIntervalDays, Math.max(1, Math.round(oldInterval * newEaseFactor))), unit: 'ngày' };
  }
};

const getDifficultyOptions = (card, settings) => {
  const state = normalizeState(card?.state);
  const isLearning = LEARNING_STATES.has(state);

  const previewFor = (rating) => {
    const interval = isLearning ? getLearningPreview(card, settings, rating) : getReviewPreview(card, settings, rating);
    return `${formatIntervalText(interval.value, interval.unit)}`;
  };

  return [
    {
      rating: 'again',
      label: 'Again',
      hint: previewFor('again'),
      className: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
    },
    {
      rating: 'hard',
      label: 'Hard',
      hint: previewFor('hard'),
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
    },
    {
      rating: 'good',
      label: 'Good',
      hint: previewFor('good'),
      className: 'bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-200',
    },
    {
      rating: 'easy',
      label: 'Easy',
      hint: previewFor('easy'),
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200',
    },
  ];
};

const sortCardsByDue = (cards) =>
  cards
    .map((card, index) => ({ card, index, dueTimestamp: getDueTimestamp(card) }))
    .sort((a, b) => a.dueTimestamp - b.dueTimestamp || a.index - b.index)
    .map((entry) => entry.card);

export default function ReviewFlashcardPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewSettings, setReviewSettings] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    try {
      setLoading(true);
      const [dueResponse, settingsResponse] = await Promise.all([
        spacedRepetitionAPI.getDue(),
        spacedRepetitionAPI.getSettings(),
      ]);
      setCards(dueResponse.data);
      setReviewSettings(settingsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải flashcard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleted = () => {
    setTimeout(() => {
      globalThis.location.href = '/spaced-repetition';
    }, 1500);
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleRate = async (rating) => {
    if (isSubmittingRating) {
      return;
    }

    const currentCard = cards[0];
    if (!currentCard) {
      return;
    }

    try {
      setIsSubmittingRating(true);
      const response = await spacedRepetitionAPI.answer({
        userVocabularyId: currentCard.userVocabularyId,
        rating: rating,
      });
      const updatedCard = response.data || currentCard;

      const remainingCards = cards.slice(1);
      const shouldReturnLater = LEARNING_STATES.has(normalizeState(updatedCard.state));
      const nextCards = sortCardsByDue(shouldReturnLater ? [...remainingCards, updatedCard] : remainingCards);

      if (nextCards.length === 0) {
        setCards([]);
        handleCompleted();
        return;
      }

      setCards(nextCards);
      setUserAnswer('');
      setShowAnswer(false);
    } catch (err) {
      console.error('Lỗi khi gửi đáp án:', err);
      alert('Không thể lưu đáp án. Vui lòng thử lại.');
    } finally {
      setIsSubmittingRating(false);
    }
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
              onClick={() => (globalThis.location.href = '/spaced-repetition')}
              className="btn-primary w-full py-3"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </Layout>
    );

  const currentCard = cards[0];
  const currentState = normalizeState(currentCard?.state);
  const isLearning = LEARNING_STATES.has(currentState);
  const difficultyOptions = getDifficultyOptions(currentCard, reviewSettings);
  const stateCounts = cards.reduce(
    (counts, card) => {
      const state = normalizeState(card.state);
      if (state === 'learning') counts.learning += 1;
      if (state === 'relearning') counts.relearning += 1;
      if (state === 'review') counts.review += 1;
      return counts;
    },
    { learning: 0, relearning: 0, review: 0 }
  );

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 min-h-screen">
        <div className="max-w-3xl w-full mx-auto px-6">
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-sky-50 to-sky-100 border-l-4 border-l-sky-400">
            <p className="text-gray-600 font-medium">Learning</p>
            <p className="text-4xl font-bold text-sky-600 mt-1">{stateCounts.learning}</p>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-500">
            <p className="text-gray-600 font-medium">Relearning</p>
            <p className="text-4xl font-bold text-red-600 mt-1">{stateCounts.relearning}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
            <p className="text-gray-600 font-medium">Review</p>
            <p className="text-4xl font-bold text-green-600 mt-1">{stateCounts.review}</p>
          </div>
        </div>

        <div className="mb-12">
          <div className="card min-h-96 flex flex-col items-center justify-center p-8">
            {showAnswer ? (
              <div className="w-full max-w-3xl">
                <p className="text-gray-500 text-sm mb-6 text-center">Mặt sau</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-sm font-semibold text-blue-700 mb-2">Mặt trước</p>
                    <p className="text-3xl font-bold text-blue-700 break-words">{currentCard.meaning}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-600 mb-2">Đáp án bạn vừa viết</p>
                    <p className={`text-xl font-semibold break-words ${userAnswer.trim() ? 'text-slate-800' : 'text-slate-400'}`}>
                      {userAnswer.trim() || 'Chưa nhập đáp án'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 mb-8 text-center">
                  <p className="text-sm font-semibold text-emerald-700 mb-2">Đáp án mặt sau</p>
                  <p className="text-4xl font-bold text-emerald-700 break-words">{currentCard.word}</p>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-600">
                    Trạng thái hiện tại: <span className="font-semibold capitalize text-slate-800">{currentCard.state}</span>
                    {isLearning ? ' · đang ở giai đoạn học' : ' · đang ở giai đoạn ôn'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {difficultyOptions.map((option) => (
                    <button
                      key={option.rating}
                      type="button"
                      disabled={isSubmittingRating}
                      onClick={() => handleRate(option.rating)}
                      className={`rounded-2xl border p-4 text-left font-semibold transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 ${option.className}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-lg">{option.label}</span>
                        <span className="text-sm font-bold">{option.hint}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form
                className="w-full max-w-2xl text-center"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleRevealAnswer();
                }}
              >
                <p className="text-gray-500 text-sm mb-4">Mặt trước</p>
                <p className="text-5xl font-bold text-blue-600 mb-8">{currentCard.meaning}</p>
                <label className="block text-left text-sm font-semibold text-gray-700 mb-2" htmlFor="typed-answer">
                  Nhập đáp án của bạn
                </label>
                <textarea
                  id="typed-answer"
                  value={userAnswer}
                  onChange={(event) => setUserAnswer(event.target.value)}
                  placeholder="Nhập câu trả lời ở đây..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-28 resize-none"
                />
                <button
                  type="submit"
                  className="mt-6 btn-primary px-8 py-3 text-base"
                >
                  Xem đáp án
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => (globalThis.location.href = '/spaced-repetition')}
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
