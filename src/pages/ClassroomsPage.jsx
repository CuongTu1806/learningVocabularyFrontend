import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { classAPI } from '../services/index';
import { unwrapApiData } from '../utils/apiHelpers';

export default function ClassroomsPage() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await classAPI.list();
      const data = unwrapApiData(res);
      setClassrooms(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không tải được danh sách lớp');
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên lớp');
      return;
    }
    try {
      await classAPI.create({ name: formData.name.trim(), description: formData.description.trim() || undefined });
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      await fetchList();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên lớp');
      return;
    }
    try {
      await classAPI.update(editingClass.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setShowEditModal(false);
      setEditingClass(null);
      setFormData({ name: '', description: '' });
      await fetchList();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await classAPI.delete(id);
      setDeleteConfirm(null);
      await fetchList();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const id = Number(joinId);
    if (!id || id < 1) {
      alert('Nhập mã lớp (số) hợp lệ');
      return;
    }
    try {
      setJoining(true);
      const res = await classAPI.join(id);
      // do not auto-enter — wait for owner approval
      setJoinMessage(res?.data?.message || 'Yêu cầu tham gia đã được gửi. Vui lòng chờ duyệt.');
      setJoinId('');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setJoining(false);
    }
  };

  const openEdit = (c) => {
    setEditingClass(c);
    setFormData({
      name: c.name || '',
      description: c.description || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => setFormData({ name: '', description: '' });

  if (loading) {
    return (
      <Layout>
        <div className="text-center p-8 h-96 flex items-center justify-center text-gray-600">Đang tải lớp học...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 py-12 min-h-screen">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="mb-2 text-4xl font-semibold tracking-tight text-slate-900">Lớp học</h1>
              <p className="text-lg text-slate-600">Tạo lớp, mời bạn hoặc tham gia bằng mã lớp</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="btn-primary py-2 px-6 inline-flex items-center gap-2"
            >
              Tạo lớp mới
            </button>
          </div>

          {error && (
            <div className="card mb-6 border-red-200 bg-red-50 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Tham gia lớp — form ngang giống ô tìm kiếm Dashboard */}
          <div className="card mb-10">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Tham gia lớp có sẵn</h2>
            <p className="mb-4 text-sm text-slate-600">Nhập mã lớp (ID) do chủ lớp cung cấp, sau đó bấm Tham gia.</p>
            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                min="1"
                placeholder="Ví dụ: 3"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="input-field flex-1"
                disabled={joining}
              />
              <button type="submit" disabled={joining} className="btn-primary px-8 py-3 whitespace-nowrap">
                {joining ? 'Đang tham gia...' : 'Tham gia'}
              </button>
            </form>
            {joinMessage && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border-amber-200 text-amber-800 text-sm">
                {joinMessage}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.length === 0 ? (
              <div className="col-span-full card py-12 text-center text-slate-600">
                <p className="text-lg mb-2">Bạn chưa có lớp nào</p>
                <p className="text-sm">Tạo lớp mới hoặc tham gia bằng mã lớp phía trên.</p>
              </div>
            ) : (
              classrooms.map((c) => (
                <div key={c.id} className="card transition-shadow hover:shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-xl font-semibold text-slate-900">{c.name}</h3>
                      <p className="line-clamp-2 text-sm text-slate-600">{c.description || 'Không có mô tả'}</p>
                    </div>
                    {c.currentUserIsOwner && (
                      <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        Chủ lớp
                      </span>
                    )}
                  </div>
                  <p className="mb-4 text-xs text-slate-500">Mã lớp: #{c.id}</p>
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/classes/${c.id}`)}
                      className="btn-primary text-center py-2 text-sm w-full"
                    >
                      Vào lớp
                    </button>
                    {c.currentUserIsOwner && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="flex-1 btn-secondary text-center py-2 text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(c.id)}
                          className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2 rounded-lg text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="mb-6 text-2xl font-semibold text-slate-900">
              {showCreateModal ? 'Tạo lớp mới' : 'Sửa thông tin lớp'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="classroom-name" className="mb-2 block font-semibold text-slate-700">Tên lớp *</label>
                <input
                  id="classroom-name"
                  type="text"
                  className="input-field"
                  placeholder="VD: Tiếng Anh Công nghệ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="classroom-description" className="mb-2 block font-semibold text-slate-700">Mô tả (tuỳ chọn)</label>
                <textarea
                  id="classroom-description"
                  className="input-field resize-none h-24"
                  placeholder="Giới thiệu ngắn..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingClass(null);
                  resetForm();
                }}
                className="btn-secondary py-2 px-6"
              >
                Hủy
              </button>
              <button type="button" onClick={showCreateModal ? handleCreate : handleUpdate} className="btn-primary py-2 px-6">
                {showCreateModal ? 'Tạo' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xóa lớp học</h3>
            <p className="text-gray-600 mb-6">Xóa lớp sẽ xóa luôn danh sách thành viên trong lớp. Bạn chắc chắn?</p>
            <div className="flex gap-4 justify-end">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-secondary py-2 px-6">
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg"
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
