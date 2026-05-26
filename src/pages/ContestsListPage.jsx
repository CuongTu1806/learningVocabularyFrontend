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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Cuộc thi từ vựng</h1>
              <p className="text-gray-600">Chọn cuộc thi để vào phòng làm bài hoặc tạo mới.</p>
            </div>
            <button
              type="button"
              className="btn-primary py-3 px-6 shrink-0"
              onClick={() => navigate('/contests/new')}
            >
              Tạo cuộc thi mới
            </button>
          </div>

          {loading && (
            <div className="text-center py-16 text-gray-600">Đang tải...</div>
          )}
          {error && (
            <div className="card bg-red-50 border-red-200 text-red-700 p-4 mb-6">{error}</div>
          )}

          {!loading && items.length === 0 && !error && (
            <div className="card text-center text-gray-500 py-16">Chưa có cuộc thi nào.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((c) => {
              const st = contestStatus(c.startTime, c.endTime);
              return (
                <div key={c.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h2 className="text-xl font-bold text-gray-900">{c.title}</h2>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        st === 'live'
                          ? 'bg-green-100 text-green-800'
                          : st === 'upcoming'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {st === 'live' ? 'Đang diễn ra' : st === 'upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{c.description || '—'}</p>
                  <p className="text-xs text-gray-500 mb-4">
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
