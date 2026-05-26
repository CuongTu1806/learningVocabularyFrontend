import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonAPI } from '../services/index';
import Layout from '../components/Layout';
import LessonLibraryCard from '../components/LessonLibraryCard';

export default function LessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await lessonAPI.getAll();
      setLessons(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Lỗi tải bài học');
    } finally {
      setLoading(false);
    }
  };

  // Create lesson
  const handleCreateLesson = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên bài học');
      return;
    }

    try {
      await lessonAPI.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      await fetchLessons();
    } catch (err) {
      alert('Lỗi tạo bài học: ' + (err.response?.data?.message || err.message));
    }
  };

  // Update lesson
  const handleUpdateLesson = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên bài học');
      return;
    }

    try {
      await lessonAPI.update(editingLesson.id, formData);
      setShowEditModal(false);
      setEditingLesson(null);
      setFormData({ name: '', description: '' });
      await fetchLessons();
    } catch (err) {
      alert('Lỗi cập nhật bài học: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete lesson
  const handleDeleteLesson = async (lessonId) => {
    try {
      await lessonAPI.delete(lessonId);
      setDeleteConfirm(null);
      await fetchLessons();
    } catch (err) {
      alert('Lỗi xóa bài học: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open edit modal
  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      name: lesson.name || '',
      description: lesson.description || '',
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', description: '' });
  };

  if (loading) return <Layout><div className="text-center p-8 h-96 flex items-center justify-center">Đang tải bài học...</div></Layout>;

  return (
    <Layout>
      <div className="bg-slate-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header with Create Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Lesson Library</h1>
              <p className="text-slate-600 text-lg">Choose a lesson to start your vocabulary journey</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="btn-primary py-2 px-6 inline-flex items-center gap-2"
            >
              Thêm bài học
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="card bg-red-50 border-red-200 mb-6 p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Lessons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-12">
                <p className="text-lg">Chưa có bài học nào</p>
              </div>
            ) : (
              lessons.map((lesson) => (
                <LessonLibraryCard
                  key={lesson.id}
                  lesson={lesson} 
                  onStudy={() => navigate(`/lesson/${lesson.id}`)}
                  onEdit={() => openEditModal(lesson)}
                  onDelete={() => setDeleteConfirm(lesson.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <LessonModal
          mode={showCreateModal ? 'create' : 'edit'}
          formData={formData}
          setFormData={setFormData}
          onSave={showCreateModal ? handleCreateLesson : handleUpdateLesson}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingLesson(null);
            resetForm();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xóa bài học</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa bài học này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary py-2 px-6"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteLesson(deleteConfirm)}
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

function LessonModal({ mode, formData, setFormData, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          {mode === 'create' ? 'Thêm bài học mới' : 'Sửa bài học'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Tên bài học *</label>
            <input
              type="text"
              placeholder="VD: Unit 1 - Greeting"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Mô tả (tuỳ chọn)</label>
            <textarea
              placeholder="Mô tả ngắn về bài học..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            {mode === 'create' ? 'Thêm' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
