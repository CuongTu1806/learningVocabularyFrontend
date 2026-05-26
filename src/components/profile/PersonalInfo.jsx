import React from 'react';

export default function PersonalInfo({ profile = {} }) {
  return (
    <>
      {/* Header - Personal Info */}
      <div className="card mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-5xl font-bold text-white">
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-gray-800">{profile?.username || 'User'}</h1>
            <p className="text-gray-600 mt-1">{profile?.email || 'email@example.com'}</p>
            <p className="text-gray-600 mt-1">Thành viên từ: {profile?.createdAt || '15/02/2024'}</p>
          </div>
        </div>
      </div>

      {/* Ranking & Activity Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm">🏆 Rank hiện tại</p>
            <p className="text-3xl font-bold text-yellow-600 mt-3">{profile?.currentRank || 'Silver'}</p>
            <p className="text-xs text-gray-600 mt-2">Thành viên hoạt động</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm">⭐ Điểm hiện tại</p>
            <p className="text-3xl font-bold text-purple-600 mt-3">{profile?.currentRankPoints?.toLocaleString() || '2,450'}</p>
            <p className="text-xs text-gray-600 mt-2">Điểm xếp hạng</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm">🔥 Streak</p>
            <p className="text-3xl font-bold text-pink-600 mt-3">{profile?.currentStreak || '5'}</p>
            <p className="text-xs text-gray-600 mt-2">Ngày liên tiếp</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm">🥇 Rank cao nhất</p>
            <p className="text-3xl font-bold text-blue-600 mt-3">{profile?.maxRank || 'Gold'}</p>
            <p className="text-xs text-gray-600 mt-2">Đạt được</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm">🎯 Contests</p>
            <p className="text-3xl font-bold text-green-600 mt-3">{profile?.contestsParticipated || '24'}</p>
            <p className="text-xs text-gray-600 mt-2">Đã tham gia</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm">📅 Online tháng này</p>
            <p className="text-3xl font-bold text-orange-600 mt-3">{profile?.daysOnlineThisMonth || '12'}</p>
            <p className="text-xs text-gray-600 mt-2">Ngày hoạt động</p>
          </div>
        </div>
      </div>
    </>
  );
}
