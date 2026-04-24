import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { assignmentAPI, classAPI } from '../services/index';
import { unwrapApiData, sameUserId } from '../utils/apiHelpers';

function defaultDueLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AssignmentsListPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: defaultDueLocal(),
  });
  const [createFiles, setCreateFiles] = useState([]);

  const isClassScope = Boolean(classId);
  const canCreate =
    isClassScope &&
    classroom &&
    (classroom.currentUserIsOwner === true ||
      sameUserId(classroom.ownerId, user?.userId));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cid = classId ? Number(classId) : undefined;
      if (classId && Number.isNaN(cid)) {
        setError('Mã lớp không hợp lệ');
        setItems([]);
        return;
      }
      if (isClassScope) {
        const [resClass, resAsg] = await Promise.all([
          classAPI.get(cid),
          assignmentAPI.list(cid),
        ]);
        const c = unwrapApiData(resClass);
        if (!c) {
          setError(resClass?.data?.message || 'Không tải được lớp');
          setClassroom(null);
          setItems([]);
          return;
        }
        setClassroom(c);
        const list = unwrapApiData(resAsg);
        setItems(Array.isArray(list) ? list : []);
      } else {
        const resAsg = await assignmentAPI.list();
        const list = unwrapApiData(resAsg);
        setClassroom(null);
        setItems(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải danh sách');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [classId, isClassScope]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      alert('Nhập tiêu đề bài tập');
      return;
    }
    if (!form.dueDate) {
      alert('Chọn hạn nộp');
      return;
    }
    const due = `${form.dueDate.length === 16 ? `${form.dueDate}:00` : form.dueDate}`;
    try {
      setSaving(true);
      const res = await assignmentAPI.create({
        classId: Number(classId),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDate: due,
      });
      const created = unwrapApiData(res);
      const newId = created?.id;
      if (newId != null && createFiles.length > 0) {
        await assignmentAPI.uploadAttachments(newId, createFiles);
      }
      setShowModal(false);
      setForm({ title: '', description: '', dueDate: defaultDueLocal() });
      setCreateFiles([]);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await assignmentAPI.delete(id);
      setDeleteId(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center p-16 text-gray-600">Đang tải bài tập...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => (isClassScope ? navigate(`/classes/${classId}`) : navigate('/dashboard'))}
              className="text-blue-600 hover:text-blue-800 font-semibold mb-4"
            >
              {isClassScope ? '← Về lớp học' : '← Trang chủ'}
            </button>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              {isClassScope ? 'Bài tập trong lớp' : 'Bài tập tôi đã giao'}
            </h1>
            <p className="text-gray-600 text-lg">
              {isClassScope
                ? classroom?.name
                  ? `Lớp: ${classroom.name}`
                  : 'Danh sách bài tập theo lớp'
                : 'Các bài tập bạn đã tạo (chủ lớp)'}
            </p>
          </div>

          {error && (
            <div className="card bg-red-50 border-red-200 mb-6 p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {canCreate && (
            <div className="flex justify-end mb-8">
              <button
                type="button"
                onClick={() => {
                  setForm({ title: '', description: '', dueDate: defaultDueLocal() });
                  setCreateFiles([]);
                  setShowModal(true);
                }}
                className="btn-primary py-2 px-6"
              >
                Giao bài mới
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.length === 0 ? (
              <div className="col-span-full card text-center text-gray-500 py-12">
                {isClassScope ? 'Chưa có bài tập nào trong lớp này.' : 'Bạn chưa tạo bài tập nào.'}
              </div>
            ) : (
              items.map((a) => (
                <div key={a.id} className="card hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{a.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{a.description || '—'}</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Hạn nộp:{' '}
                    {a.dueDate
                      ? new Date(a.dueDate).toLocaleString('vi-VN')
                      : '—'}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => navigate(`/assignments/${a.id}`)}
                      className="btn-primary flex-1 text-center py-2 text-sm min-w-[120px]"
                    >
                      Mở bài tập
                    </button>
                    {((isClassScope &&
                      (classroom?.currentUserIsOwner === true ||
                        sameUserId(user?.userId, a.createdByUserId))) ||
                      (!isClassScope && sameUserId(user?.userId, a.createdByUserId))) && (
                      <button
                        type="button"
                        onClick={() => setDeleteId(a.id)}
                        className="btn-secondary text-red-600 border border-red-200 py-2 px-4 text-sm"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Giao bài mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">Tiêu đề *</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Bài tập tuần 1"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  className="input-field h-24 resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Yêu cầu chi tiết..."
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-2">Hạn nộp *</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Phải sau thời điểm hiện tại (theo quy tắc server)</p>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-2">Đính kèm đề (tuỳ chọn)</label>
                <input
                  type="file"
                  multiple
                  className="input-field text-sm"
                  onChange={(e) =>
                    setCreateFiles(e.target.files ? Array.from(e.target.files) : [])
                  }
                />
                <p className="text-xs text-gray-500 mt-1">Tối đa 10MB mỗi file, nhiều file (tối đa 20 mỗi lần).</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" className="btn-secondary px-6" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button type="button" className="btn-primary px-6" disabled={saving} onClick={handleCreate}>
                {saving ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xóa bài tập?</h3>
            <p className="text-gray-600 mb-6">Các bài nộp liên quan cũng bị xóa.</p>
            <div className="flex gap-4 justify-end">
              <button type="button" className="btn-secondary px-6" onClick={() => setDeleteId(null)}>
                Hủy
              </button>
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg"
                onClick={() => handleDelete(deleteId)}
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
