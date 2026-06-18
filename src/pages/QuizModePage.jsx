import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function QuizModePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(null);

  const modes = [
    {
      id: 'ENG_TO_VN',
      name: 'Anh → Việt',
      description: 'Xem từ tiếng Anh, chọn nghĩa Tiếng Việt',
      color: 'from-blue-500 to-blue-700',
      icon: '',
    },
    {
      id: 'VN_TO_ENG',
      name: 'Việt → Anh',
      description: 'Xem nghĩa Tiếng Việt, chọn từ tiếng Anh',
      color: 'from-purple-500 to-purple-700',
      icon: '🔤',
    },
    {
      id: 'VN_FILL_ENG',
      name: 'Điền từ tiếng Anh',
      description: 'Tiếng Việt + chỗ trống, bạn điền tiếng Anh',
      color: 'from-pink-500 to-pink-700',
      icon: '',
    },
  ];

  const handleStartQuiz = (mode) => {
    navigate(`/quiz/${id}/play?mode=${mode.id}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Chọn chế độ ôn tập</h1>
            <p className="mt-2 text-lg text-slate-600">Chọn một trong ba chế độ để bắt đầu làm quiz</p>
            <button
              onClick={() => navigate('/lessons')}
              className="mt-4 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              ← Quay lại danh sách bài
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
            {modes.map((mode, index) => (
              <QuizModeCard
                key={mode.id}
                mode={mode}
                index={index + 1}
                isSelected={selectedMode?.id === mode.id}
                onSelect={() => setSelectedMode(mode)}
                onStart={() => handleStartQuiz(mode)}
              />
            ))}
          </div>

          <div className="card border-slate-200 bg-white p-6 text-center">
            <p className="mb-2 font-semibold text-slate-900">Mẹo</p>
            <p className="text-slate-600">
              Kết hợp cả ba chế độ để học hiệu quả! Mỗi chế độ rèn luyện khác nhau.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function QuizModeCard({ mode, index, isSelected, onSelect, onStart }) {
  return (
    <div className={`card border-slate-200 bg-white transition-all ${isSelected ? 'ring-2 ring-slate-400' : 'hover:-translate-y-0.5'}`}>
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xl font-semibold text-slate-900">
          {index}
        </div>
        <h3 className="mb-2 text-center text-xl font-semibold text-slate-900">{mode.name}</h3>
        <p className="mb-4 text-center text-sm text-slate-600">{mode.description}</p>
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
          {isSelected ? 'Đã chọn' : 'Chạm để chọn'}
        </p>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        className="btn-primary w-full py-3 font-semibold"
      >
        Bắt đầu
      </button>
    </div>
  );
}

QuizModeCard.propTypes = {
  mode: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.node,
  }).isRequired,
  index: PropTypes.number.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
};
