import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function ProfilePage() {
  const { user, getProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getProfile();
        setProfile(data);
        setError('');
      } catch (err) {
        setError('Không thể tải thông tin hồ sơ');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getProfile]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setSuccess('Mật khẩu thay đổi thành công!');
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowChangePassword(false);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Thay đổi mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="card mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-5xl font-bold text-white">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-grow">
                <h1 className="text-3xl font-bold text-gray-800">{profile?.username}</h1>
                <p className="text-gray-600 mt-1">{profile?.email}</p>
                <p className="text-gray-600 mt-1">Thành viên từ: 15/02/2024</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="card bg-red-50 border-red-200 mb-6">
              <p className="text-red-600 font-semibold">❌ {error}</p>
            </div>
          )}

          {success && (
            <div className="card bg-green-50 border-green-200 mb-6">
              <p className="text-green-600 font-semibold">{success}</p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="text-center">
                <p className="text-gray-600 text-sm">🏆 Xếp hạng</p>
                <p className="text-4xl font-bold text-blue-600 mt-3">Silver</p>
                <p className="text-xs text-gray-600 mt-2">Thành viên hoạt động</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="text-center">
                <p className="text-gray-600 text-sm">⭐ Điểm xếp hạng</p>
                <p className="text-4xl font-bold text-purple-600 mt-3">2,450</p>
                <p className="text-xs text-gray-600 mt-2">Từ các hoạt động</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <div className="text-center">
                <p className="text-gray-600 text-sm">🔥 Chuỗi liên tục</p>
                <p className="text-4xl font-bold text-pink-600 mt-3">12 ngày</p>
                <p className="text-xs text-gray-600 mt-2">Học tập hàng ngày</p>
              </div>
            </div>
          </div>

          {/* Learning Statistics */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-6">Thống kê học tập</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-600 text-sm">Từ vựng học</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">342</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-gray-600 text-sm">Bài học hoàn thành</p>
                <p className="text-3xl font-bold text-green-600 mt-2">12</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-gray-600 text-sm">Số lần ôn tập</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">156</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-gray-600 text-sm">Tỉ lệ thành công</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">87%</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-6">Thông tin tài khoản</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-gray-600 text-sm">Tên đăng nhập</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">{profile?.username}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-gray-600 text-sm">Email</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">{profile?.email}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-gray-600 text-sm">Trạng thái tài khoản</p>
                  <p className="text-lg font-semibold text-green-600 mt-1">✅ Hoạt động</p>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="card">
            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                🔐 Đổi mật khẩu
              </button>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">Đổi mật khẩu</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu hiện tại"
                      value={passwordData.oldPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, oldPassword: e.target.value })
                      }
                      disabled={passwordLoading}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu mới"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      disabled={passwordLoading}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      placeholder="Xác nhận mật khẩu mới"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      disabled={passwordLoading}
                      className="input-field"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                    >
                      {passwordLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordData({
                          oldPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                        setError('');
                      }}
                      className="btn-secondary flex-1 py-3"
                      disabled={passwordLoading}
                    >
                      ❌ Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
