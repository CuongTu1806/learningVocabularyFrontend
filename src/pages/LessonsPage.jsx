import React, { useEffect, useMemo, useState } from 'react';
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
  const [exactLessonIdInput, setExactLessonIdInput] = useState('');
  const [appliedExactLessonId, setAppliedExactLessonId] = useState('');
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
    const keyword = searchText.trim();
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
  }, [searchText]);

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

  const filteredLessons = useMemo(() => {
    const appliedExactId = appliedExactLessonId.trim();

    return lessons.filter((lesson) => {
      if (appliedExactId) {
        return String(lesson.id) === appliedExactId;
      }

      return true;
    });
  }, [lessons, appliedExactLessonId]);

  const handleExactSearch = (event) => {
    event.preventDefault();
    const value = exactLessonIdInput.trim();
    if (!value) {
      setAppliedExactLessonId('');
      return;
    }
    if (!/^\d+$/.test(value)) {
      alert('Mã bài học phải là số');
      return;
    }
    setAppliedExactLessonId(value);
    setSearchText('');
  };

  const clearSearch = () => {
    setSearchText('');
    setExactLessonIdInput('');
    setAppliedExactLessonId('');
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

  let lessonsContent;
  if (searchText.trim()) {
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
  } else if (filteredLessons.length === 0) {
    lessonsContent = (
      <div className="col-span-full text-center text-gray-500 py-12">
        <p className="text-lg">Không tìm thấy bài học phù hợp</p>
      </div>
    );
  } else {
    lessonsContent = filteredLessons.map((lesson) => (
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
        <div className="max-w-6xl mx-auto px-6">
          {/* Header with Create Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
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

          <div className="card mb-8">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
              <div>
                <label htmlFor="lesson-search-input" className="block text-sm font-semibold text-gray-700 mb-2">Tìm bài học</label>
                <input
                  id="lesson-search-input"
                  type="text"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    if (appliedExactLessonId) {
                      setAppliedExactLessonId('');
                    }
                  }}
                  placeholder="Tìm theo tên bài học hoặc tên người tạo public"
                  className="input-field"
                />
              </div>
              <form onSubmit={handleExactSearch}>
                <label htmlFor="lesson-id-input" className="block text-sm font-semibold text-gray-700 mb-2">Mã bài học</label>
                <input
                  id="lesson-id-input"
                  type="text"
                  value={exactLessonIdInput}
                  onChange={(e) => setExactLessonIdInput(e.target.value)}
                  placeholder="Nhập ID lesson"
                  className="input-field"
                />
              </form>
              <div className="flex items-end gap-2">
                <button type="button" onClick={handleExactSearch} className="btn-primary py-3 px-5">
                  Tìm mã
                </button>
                <button type="button" onClick={clearSearch} className="btn-secondary py-3 px-5">
                  Xóa lọc
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
              <span>Tìm tương đối theo tên bài học hoặc tên người tạo công khai.</span>
              <span className="text-slate-300">|</span>
              <span>Tìm mã sẽ khớp chính xác theo id lesson.</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="card bg-red-50 border-red-200 mb-6 p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Lessons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <label htmlFor="lesson-title-input" className="block text-gray-700 font-semibold mb-2">Tên bài học *</label>
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
