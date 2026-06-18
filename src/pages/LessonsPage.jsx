import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { lessonAPI } from '../services/index';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import LessonLibraryCard from '../components/LessonLibraryCard';

export default function LessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [publicSearchLessons, setPublicSearchLessons] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [appliedSearchText, setAppliedSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchingPublic, setSearchingPublic] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'PRIVATE',
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    const keyword = appliedSearchText.trim();
    if (!keyword) {
      setPublicSearchLessons([]);
      setSearchingPublic(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingPublic(true);
        const response = await lessonAPI.searchPublic(keyword);
        setPublicSearchLessons(response.data || []);
      } catch (err) {
        console.error('Search public lessons error:', err);
        setPublicSearchLessons([]);
      } finally {
        setSearchingPublic(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [appliedSearchText]);

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
      await lessonAPI.create({
        title: formData.name.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
      });
      setShowCreateModal(false);
      setFormData({ name: '', description: '', visibility: 'PRIVATE' });
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
      await lessonAPI.update(editingLesson.id, {
        title: formData.name.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
      });
      setShowEditModal(false);
      setEditingLesson(null);
      setFormData({ name: '', description: '', visibility: 'PRIVATE' });
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
      name: lesson.title || lesson.name || '',
      description: lesson.description || '',
      visibility: (lesson.visibility || 'PRIVATE').toUpperCase(),
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', description: '', visibility: 'PRIVATE' });
  };

  const handleDownloadLesson = async (lessonId) => {
    try {
      const response = await lessonAPI.download(lessonId);
      const importedLesson = response.data;
      if (importedLesson?.id) {
        navigate(`/lesson/${importedLesson.id}`);
      } else {
        await fetchLessons();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Không thể tải bài học về');
    }
  };

  const handleSearchLessons = (event) => {
    event.preventDefault();
    setAppliedSearchText(searchText);
  };

  let lessonsContent;
  if (appliedSearchText.trim()) {
    if (searchingPublic) {
      lessonsContent = (
        <div className="col-span-full text-center text-gray-500 py-12">
          <p className="text-lg">Đang tìm bài học công khai...</p>
        </div>
      );
    } else if (publicSearchLessons.length === 0) {
      lessonsContent = (
        <div className="col-span-full text-center text-gray-500 py-12">
          <p className="text-lg">Không tìm thấy bài học công khai phù hợp</p>
        </div>
      );
    } else {
      lessonsContent = publicSearchLessons.map((lesson) => (
        <LessonLibraryCard
          key={lesson.id}
          lesson={lesson}
          onStudy={() => navigate(`/lesson/${lesson.id}`)}
          onEdit={() => openEditModal(lesson)}
          onDelete={() => setDeleteConfirm(lesson.id)}
          onDownload={() => handleDownloadLesson(lesson.id)}
          canManage={Number(lesson.ownerId) === Number(user?.userId)}
        />
      ));
    }
  } else if (lessons.length === 0) {
    lessonsContent = (
      <div className="col-span-full text-center text-gray-500 py-12">
        <p className="text-lg">Chưa có bài học nào</p>
      </div>
    );
  } else {
    lessonsContent = lessons.map((lesson) => (
      <LessonLibraryCard
        key={lesson.id}
        lesson={lesson}
        onStudy={() => navigate(`/lesson/${lesson.id}`)}
        onEdit={() => openEditModal(lesson)}
        onDelete={() => setDeleteConfirm(lesson.id)}
        onDownload={() => handleDownloadLesson(lesson.id)}
        canManage={Number(lesson.ownerId) === Number(user?.userId)}
      />
    ));
  }

  if (loading) return <Layout><div className="text-center p-8 h-96 flex items-center justify-center">Đang tải bài học...</div></Layout>;

  return (
    <Layout>
      <div className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header with Create Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="mb-2 text-4xl font-semibold tracking-tight text-slate-900">Lesson Library</h1>
              <p className="text-lg text-slate-600">Chọn một bài học để bắt đầu luyện từ vựng</p>
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

          <div className="card mb-8">
            <form onSubmit={handleSearchLessons} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label htmlFor="lesson-search-input" className="mb-2 block text-sm font-semibold text-slate-700">Tìm bài học</label>
                <input
                  id="lesson-search-input"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm theo tên bài học hoặc tên người tạo public"
                  className="input-field"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary py-3 px-5">
                  Tìm kiếm
                </button>
              </div>
            </form>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
              <span>Chỉ hiển thị kết quả sau khi bấm Tìm kiếm.</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="card mb-6 bg-red-50">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Lessons Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lessonsContent}
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
          <div className="card max-w-sm w-full p-8">
            <h3 className="mb-4 text-xl font-semibold text-slate-900">Xóa bài học</h3>
            <p className="mb-6 text-slate-600">Bạn có chắc chắn muốn xóa bài học này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary py-2 px-6"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteLesson(deleteConfirm)}
                className="rounded-xl bg-red-600 px-6 py-2 font-semibold text-white transition-all hover:bg-red-700"
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
      <div className="card max-w-md w-full p-8">
        <h3 className="mb-6 text-2xl font-semibold text-slate-900">
          {mode === 'create' ? 'Thêm bài học mới' : 'Sửa bài học'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="lesson-title-input" className="mb-2 block font-semibold text-slate-700">Tên bài học *</label>
            <input
              id="lesson-title-input"
              type="text"
              placeholder="VD: Unit 1 - Greeting"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

            <div>
            <label htmlFor="lesson-visibility-select" className="block text-gray-700 font-semibold mb-2">Trạng thái</label>
              <select
              id="lesson-visibility-select"
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>

          <div>
            <label htmlFor="lesson-description-input" className="block text-gray-700 font-semibold mb-2">Mô tả (tuỳ chọn)</label>
            <textarea
              id="lesson-description-input"
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

LessonModal.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    visibility: PropTypes.string.isRequired,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
