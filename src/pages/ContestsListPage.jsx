import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { contestAPI } from '../services/index';
import { unwrapApiData } from '../utils/apiHelpers';

function contestStatus(start, end) {
  const now = Date.now();
  const s = start ? new Date(start).getTime() : 0;
  const e = end ? new Date(end).getTime() : Infinity;
  if (now < s) return 'upcoming';
  if (now > e) return 'ended';
  return 'live';
}

export default function ContestsListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await contestAPI.list();
      const list = unwrapApiData(res);
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không tải được danh sách');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout>
      <div className="bg-slate-50 py-12 min-h-screen">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="mb-2 text-4xl font-semibold tracking-tight text-slate-900">Cuộc thi từ vựng</h1>
              <p className="text-slate-600">Chọn cuộc thi để vào phòng làm bài hoặc tạo mới.</p>
            </div>
            <button
              type="button"
              className="btn-primary py-3 px-6 shrink-0"
              onClick={() => navigate('/contests/new')}
            >
              Tạo cuộc thi mới
            </button>
          </div>

          {loading && <div className="py-16 text-center text-slate-600">Đang tải...</div>}
          {error && (
            <div className="card mb-6 border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
          )}

          {!loading && items.length === 0 && !error && (
            <div className="card py-16 text-center text-slate-600">Chưa có cuộc thi nào.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((c) => {
              const st = contestStatus(c.startTime, c.endTime);
              let statusClass = 'bg-gray-100 text-gray-600';
              let statusLabel = 'Đã kết thúc';
              if (st === 'live') {
                statusClass = 'bg-green-100 text-green-800';
                statusLabel = 'Đang diễn ra';
              } else if (st === 'upcoming') {
                statusClass = 'bg-amber-100 text-amber-800';
                statusLabel = 'Sắp diễn ra';
              }
              return (
                <div key={c.id} className="card transition-shadow hover:shadow-lg">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h2 className="text-xl font-semibold text-slate-900">{c.title}</h2>
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mb-4 line-clamp-3 text-sm text-slate-600">{c.description || '—'}</p>
                  <p className="mb-4 text-xs text-slate-500">
                    {c.startTime && (
                      <>
                        Bắt đầu: {new Date(c.startTime).toLocaleString('vi-VN')}
                        <br />
                      </>
                    )}
                    {c.endTime && <>Kết thúc: {new Date(c.endTime).toLocaleString('vi-VN')}</>}
                  </p>
                  <button
                    type="button"
                    className="btn-primary w-full py-2"
                    onClick={() => navigate(`/contests/${c.id}/play`)}
                  >
                    Vào phòng thi
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
