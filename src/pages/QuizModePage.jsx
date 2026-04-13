import React, { useState } from 'react';
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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Chọn chế độ ôn tập</h1>
            <p className="text-gray-600 text-lg mb-6">Chọn một trong ba chế độ để bắt đầu làm quiz</p>
            <button 
              onClick={() => navigate('/lessons')}
              className="text-blue-600 hover:underline text-sm font-semibold"
            >
              ← Quay lại danh sách bài
            </button>
          </div>

          {/* Mode Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {modes.map((mode) => (
              <QuizModeCard
              key={mode.id}
              mode={mode}
              isSelected={selectedMode?.id === mode.id}
              onSelect={() => setSelectedMode(mode)}
              onStart={() => handleStartQuiz(mode)}
            />
          ))}
        </div>

        {/* Info Box */}
        <div className="glass-effect p-6 text-center">
          <p className="text-gray-800 font-semibold mb-2">Mẹo:</p>
          <p className="text-gray-700">
            Kết hợp cả ba chế độ để học hiệu quả! Mỗi chế độ rèn luyện khác nhau.
          </p>
        </div>
        </div>
      </div>
    </Layout>
  );
}

function QuizModeCard({ mode, isSelected, onSelect, onStart }) {
  return (
    <div
      onClick={onSelect}
      className={`card cursor-pointer transform transition-all ${
        isSelected ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-102'
      }`}
    >
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${mode.color} flex items-center justify-center text-3xl mb-4 mx-auto`}>
        {mode.icon}
      </div>
      <h3 className="text-xl font-bold text-center mb-2">{mode.name}</h3>
      <p className="text-gray-600 text-center text-sm mb-6">{mode.description}</p>
      
      <button
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
