import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { classAPI } from '../services/index';
import { unwrapApiData } from '../utils/apiHelpers';

export default function ClassroomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resClass, resMem] = await Promise.all([classAPI.get(id), classAPI.getMembers(id)]);
      const dataClass = unwrapApiData(resClass);
      const dataMem = unwrapApiData(resMem);
      if (!dataClass) {
        setError(resClass?.data?.message || 'Không tải được lớp học');
        setClassroom(null);
        setMembers([]);
        return;
      }
      setClassroom(dataClass);
      setMembers(Array.isArray(dataMem) ? dataMem : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải dữ liệu');
      setClassroom(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    const uid = Number(inviteUserId);
    if (!uid || uid < 1) {
      alert('Nhập ID người dùng hợp lệ');
      return;
    }
    try {
      setInviting(true);
      setActionMsg('');
      await classAPI.invite(id, { userId: uid });
      setInviteUserId('');
      setShowInvite(false);
      setActionMsg('Đã mời thành công');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Xóa thành viên này khỏi lớp?')) return;
    try {
      await classAPI.removeMember(id, userId);
      setActionMsg('Đã xóa thành viên');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Bạn có chắc muốn rời lớp?')) return;
    try {
      await classAPI.leave(id);
      navigate('/classes');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[40vh] text-gray-600">Đang tải...</div>
      </Layout>
    );
  }

  if (error || !classroom) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="card bg-red-50 border-red-200">
            <p className="text-red-700 font-semibold">{error || 'Không tìm thấy lớp'}</p>
            <button type="button" onClick={() => navigate('/classes')} className="btn-primary mt-4">
              Về danh sách lớp
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwner = classroom.currentUserIsOwner === true;

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          <button
            type="button"
            onClick={() => navigate('/classes')}
            className="mb-6 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
          >
            ← Danh sách lớp
          </button>

          <div className="card mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
            <div className="flex flex-wrap justify-between gap-4 items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{classroom.name}</h1>
                <p className="text-gray-600">{classroom.description || 'Không có mô tả'}</p>
                <p className="text-sm text-gray-400 mt-3">Mã lớp: #{classroom.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isOwner && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 h-fit">
                    Chủ lớp
                  </span>
                )}
                {!isOwner && (
                  <button type="button" onClick={handleLeave} className="btn-secondary py-2 px-4 text-sm">
                    Rời lớp
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/classes/${id}/assignments`)}
                  className="btn-primary py-2 px-4 text-sm"
                >
                  Bài tập
                </button>
              </div>
            </div>
          </div>

          {actionMsg && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm font-medium border border-green-200">
              {actionMsg}
            </div>
          )}

          <div className="card">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800">Thành viên</h2>
              {isOwner && (
                <button type="button" onClick={() => setShowInvite(true)} className="btn-primary py-2 px-4 text-sm">
                  Mời thành viên
                </button>
              )}
            </div>

            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có thành viên (ngoài chủ lớp).</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600">
                      <th className="py-3 pr-4">ID user</th>
                      <th className="py-3 pr-4">Vai trò</th>
                      <th className="py-3 pr-4">Tham gia</th>
                      {isOwner && <th className="py-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-gray-100">
                        <td className="py-3 font-mono">{m.userId}</td>
                        <td className="py-3">{m.role || '—'}</td>
                        <td className="py-3 text-gray-600">
                          {m.joinedAt ? new Date(m.joinedAt).toLocaleString('vi-VN') : '—'}
                        </td>
                        {isOwner && (
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.userId)}
                              className="text-red-600 hover:underline text-sm font-semibold"
                            >
                              Xóa
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showInvite && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Mời theo ID người dùng</h3>
                <p className="text-sm text-gray-600 mb-4">Nhập ID tài khoản (user id trong hệ thống).</p>
                <form onSubmit={handleInvite}>
                  <input
                    type="number"
                    min="1"
                    className="input-field mb-4"
                    placeholder="User ID"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    disabled={inviting}
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInvite(false);
                        setInviteUserId('');
                      }}
                      className="btn-secondary py-2 px-6"
                    >
                      Hủy
                    </button>
                    <button type="submit" disabled={inviting} className="btn-primary py-2 px-6">
                      {inviting ? 'Đang gửi...' : 'Mời'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
