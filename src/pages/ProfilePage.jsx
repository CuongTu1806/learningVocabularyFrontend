import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/profileService';
import Layout from '../components/Layout';
import PersonalInfo from '../components/profile/PersonalInfo';
import ReviewsChart from '../components/profile/ReviewsChart';
import TimeChart from '../components/profile/TimeChart';
import CardCountChart from '../components/profile/CardCountChart';
import ReviewIntervalChart from '../components/profile/ReviewIntervalChart';
import CardEaseChart from '../components/profile/CardEaseChart';
import AddChart from '../components/profile/AddChart';

export default function ProfilePage() {
  const { getProfile, changePassword } = useAuth();
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
        const [userData, statsData] = await Promise.all([
          getProfile(),
          profileService.getProfileStats('month'),
        ]);
        // Merge user data with stats data
        setProfile({
          ...userData,
          ...statsData,
        });
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
        <div className="max-w-6xl mx-auto px-6">
          {/* Messages */}
          {error && (
            <div className="card bg-red-50 border-red-200 mb-6">
              <p className="text-red-600 font-semibold">❌ {error}</p>
            </div>
          )}

          {success && (
            <div className="card bg-green-50 border-green-200 mb-6">
              <p className="text-green-600 font-semibold">✅ {success}</p>
            </div>
          )}

          {/* Personal Info & Ranking */}
          <PersonalInfo profile={profile} />

          {/* Statistics Section */}
          <div className="space-y-8 mb-8">
            {/* Row 1: Reviews & Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ReviewsChart />
              <TimeChart />
            </div>

            {/* Row 2: Card Count & Review Interval */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CardCountChart />
              <ReviewIntervalChart />
            </div>

            {/* Row 3: Card Ease & Add */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CardEaseChart />
              <AddChart />
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
