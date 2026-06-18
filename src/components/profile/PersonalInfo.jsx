import React from 'react';
import PropTypes from 'prop-types';

export default function PersonalInfo({ profile = {} }) {
  return (
    <>
      {/* Header - Personal Info */}
      <div className="card mb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-900 text-4xl font-semibold text-white">
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{profile?.username || 'User'}</h1>
            <p className="mt-1 text-slate-500">{profile?.email || 'email@example.com'}</p>
            <p className="mt-1 text-slate-500">Thành viên từ: {profile?.createdAt || '15/02/2024'}</p>
          </div>
        </div>
      </div>

      {/* Ranking & Activity Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="card bg-amber-50/70">
          <div className="text-center">
            <p className="text-sm text-slate-500">Rank hiện tại</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{profile?.currentRank ?? 'Chưa xếp hạng'}</p>
            <p className="mt-2 text-xs text-slate-500">Thành viên hoạt động</p>
          </div>
        </div>

        <div className="card bg-violet-50/70">
          <div className="text-center">
            <p className="text-sm text-slate-500">Điểm hiện tại</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{(profile?.currentRankPoints ?? 0).toLocaleString()}</p>
            <p className="mt-2 text-xs text-slate-500">Điểm xếp hạng</p>
          </div>
        </div>

        <div className="card bg-rose-50/70">
          <div className="text-center">
            <p className="text-sm text-slate-500">Streak</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{profile?.currentStreak ?? 0}</p>
            <p className="mt-2 text-xs text-slate-500">Ngày liên tiếp</p>
          </div>
        </div>

        <div className="card bg-sky-50/70">
          <div className="text-center">
            <p className="text-sm text-slate-500">Điểm cao nhất</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{(profile?.maxRating ?? profile?.maxRankPoints ?? 0).toLocaleString()}</p>
            <p className="mt-2 text-xs text-slate-500">Đạt được</p>
          </div>
        </div>

        <div className="card bg-emerald-50/70">
          <div className="text-center">
            <p className="text-sm text-slate-500">Contests</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{profile?.contestsParticipated ?? 0}</p>
            <p className="mt-2 text-xs text-slate-500">Đã tham gia</p>
          </div>
        </div>

        <div className="card bg-orange-50/70">
          <div className="text-center">
            <p className="text-sm text-slate-500">Online tháng này</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{profile?.daysOnlineThisMonth ?? 0}</p>
            <p className="mt-2 text-xs text-slate-500">Ngày hoạt động</p>
          </div>
        </div>
      </div>
    </>
  );
}

PersonalInfo.propTypes = {
  profile: PropTypes.shape({
    username: PropTypes.string,
    email: PropTypes.string,
    createdAt: PropTypes.string,
    currentRank: PropTypes.string,
    currentRankPoints: PropTypes.number,
    maxRankPoints: PropTypes.number,
    maxRating: PropTypes.number,
    currentStreak: PropTypes.number,
    contestsParticipated: PropTypes.number,
    daysOnlineThisMonth: PropTypes.number,
  }),
};
