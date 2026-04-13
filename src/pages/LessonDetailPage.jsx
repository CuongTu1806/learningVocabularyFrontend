import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonAPI } from '../services/index';
import Layout from '../components/Layout';

export default function LessonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vocabularies, setVocabularies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVocab, setEditingVocab] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    pronunciation: '',
    example: '',
  });

  // Fetch vocabularies
  useEffect(() => {
    fetchVocabularies();
  }, [id]);

  const fetchVocabularies = async () => {
    try {
      setLoading(true);
      const response = await lessonAPI.getVocabularies(id);
      setVocabularies(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Lỗi tải từ vựng');
    } finally {
      setLoading(false);
    }
  };

  // Add vocabulary
  const handleAddVocab = async () => {
    if (!formData.word.trim() || !formData.meaning.trim()) {
      alert('Vui lòng điền từ vựng và nghĩa');
      return;
    }

    try {
      await lessonAPI.addVocabulary(id, formData);
      setShowAddModal(false);
      setFormData({ word: '', meaning: '', pronunciation: '', example: '' });
      await fetchVocabularies();
    } catch (err) {
      alert('Lỗi thêm từ vựng: ' + (err.response?.data?.message || err.message));
    }
  };

  // Update vocabulary
  const handleUpdateVocab = async () => {
    if (!formData.word.trim() || !formData.meaning.trim()) {
      alert('Vui lòng điền từ vựng và nghĩa');
      return;
    }

    try {
      await lessonAPI.updateVocabulary(id, editingVocab.id, formData);
      setShowEditModal(false);
      setEditingVocab(null);
      setFormData({ word: '', meaning: '', pronunciation: '', example: '' });
      await fetchVocabularies();
    } catch (err) {
      alert('Lỗi cập nhật từ vựng: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete vocabulary
  const handleDeleteVocab = async (vocabId) => {
    try {
      await lessonAPI.deleteVocabulary(id, vocabId);
      setDeleteConfirm(null);
      await fetchVocabularies();
    } catch (err) {
      alert('Lỗi xóa từ vựng: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open edit modal
  const openEditModal = (vocab) => {
    setEditingVocab(vocab);
    setFormData({
      word: vocab.word || vocab.english || '',
      meaning: vocab.meaning || vocab.vietnamese || '',
      pronunciation: vocab.pronunciation || '',
      example: vocab.example || '',
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ word: '', meaning: '', pronunciation: '', example: '' });
  };

  if (loading) return <Layout><div className="text-center p-8 h-96 flex items-center justify-center">⏳ Đang tải từ vựng...</div></Layout>;

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Chi tiết bài học</h1>
              <p className="text-gray-600 text-lg">{vocabularies.length} từ vựng</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <button 
                onClick={() => navigate('/lessons')}
                className="btn-secondary text-center py-3 px-6"
              >
                ← Quay lại
              </button>
              <button 
                onClick={() => navigate(`/quiz/${id}`)}
                className="btn-primary text-center py-3 px-6"
              >
                🎯 Ôn tập bài này
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="card bg-red-50 border-red-200 mb-6 p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Add Vocabulary Button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="btn-primary py-2 px-6 inline-flex items-center gap-2"
            >
              Thêm từ vựng
            </button>
          </div>

          {/* Vocabulary List */}
          <div className="card">
            {vocabularies.length === 0 ? (
              <p className="text-center text-gray-500 py-12 text-lg">Chưa có từ vựng nào</p>
            ) : (
              <div className="space-y-4">
                {vocabularies.map((vocab, idx) => (
                  <VocabularyItem 
                    key={vocab.id} 
                    vocab={vocab} 
                    idx={idx + 1}
                    onEdit={() => openEditModal(vocab)}
                    onDelete={() => setDeleteConfirm(vocab.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <VocabularyModal
          mode={showAddModal ? 'add' : 'edit'}
          formData={formData}
          setFormData={setFormData}
          onSave={showAddModal ? handleAddVocab : handleUpdateVocab}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setEditingVocab(null);
            resetForm();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xóa từ vựng</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa từ vựng này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary py-2 px-6"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteVocab(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function VocabularyItem({ vocab, idx, onEdit, onDelete }) {
  return (
    <div className="p-4 border-b border-gray-200 last:border-0 hover:bg-blue-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-blue-600 text-lg">{idx}.</span>
            <div>
              <p className="text-lg font-bold text-gray-900">{vocab.word || vocab.english}</p>
              <p className="text-sm text-gray-600">/ {vocab.pronunciation || 'N/A'} /</p>
            </div>
          </div>
          <p className="text-gray-700 ml-8">Nghĩa: <strong>{vocab.meaning || vocab.vietnamese}</strong></p>
          {vocab.example && (
            <p className="text-gray-600 ml-8 text-sm mt-1">Ví dụ: <em>{vocab.example}</em></p>
          )}
        </div>
        <div className="flex gap-2 ml-4 flex-shrink-0">
          <button
            onClick={onEdit}
            className="btn-secondary py-1 px-3 text-sm"
          >
            Sửa
          </button>
          <button
            onClick={onDelete}
            className="bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-1 px-3 rounded-lg transition-all text-sm"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

function VocabularyModal({ mode, formData, setFormData, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          {mode === 'add' ? 'Thêm từ vựng mới' : 'Sửa từ vựng'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Từ vựng (English) *</label>
            <input
              type="text"
              placeholder="VD: Computer"
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Nghĩa (Tiếng Việt) *</label>
            <input
              type="text"
              placeholder="VD: Máy tính"
              value={formData.meaning}
              onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Phát âm</label>
            <input
              type="text"
              placeholder="VD: kəm-ˈpjü-tər"
              value={formData.pronunciation}
              onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Ví dụ</label>
            <textarea
              placeholder="VD: I use a computer every day"
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none h-20"
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-secondary py-2 px-6"
          >
            Hủy
          </button>
          <button
            onClick={onSave}
            className="btn-primary py-2 px-6"
          >
            {mode === 'add' ? 'Thêm' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
