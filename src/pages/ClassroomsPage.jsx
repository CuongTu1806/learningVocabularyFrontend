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
      await classAPI.join(id);
      setJoinId('');
      await fetchList();
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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Lớp học</h1>
              <p className="text-gray-600 text-lg">Tạo lớp, mời bạn hoặc tham gia bằng mã lớp</p>
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
            <div className="card bg-red-50 border-red-200 mb-6 p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Tham gia lớp — form ngang giống ô tìm kiếm Dashboard */}
          <div className="card mb-10">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Tham gia lớp có sẵn</h2>
            <p className="text-sm text-gray-600 mb-4">Nhập mã lớp (ID) do chủ lớp cung cấp, sau đó bấm Tham gia.</p>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-12 card">
                <p className="text-lg mb-2">Bạn chưa có lớp nào</p>
                <p className="text-sm">Tạo lớp mới hoặc tham gia bằng mã lớp phía trên.</p>
              </div>
            ) : (
              classrooms.map((c) => (
                <div key={c.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 truncate">{c.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{c.description || 'Không có mô tả'}</p>
                    </div>
                    {c.currentUserIsOwner && (
                      <span className="ml-2 shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        Chủ lớp
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Mã lớp: #{c.id}</p>
                  <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
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
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {showCreateModal ? 'Tạo lớp mới' : 'Sửa thông tin lớp'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Tên lớp *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="VD: Tiếng Anh Công nghệ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Mô tả (tuỳ chọn)</label>
                <textarea
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
