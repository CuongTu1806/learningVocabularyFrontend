import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { profileService } from '../../services/profileService';

// Custom tooltip component outside render
const CardEaseTooltip = (props) => {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    const { ease, count } = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
        <p className="font-bold">{ease}</p>
        <p>{count} cards</p>
      </div>
    );
  }
  return null;
};

export default function CardEaseChart() {
  const [chartData, setChartData] = useState([]);
  const [medianEase, setMedianEase] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCardEaseStats();
  }, []);

  const fetchCardEaseStats = async () => {
    try {
      setLoading(true);
      const response = await profileService.getCardEaseStats();
      setChartData(response.data || []);
      const pct =
        response.medianEasePercent ??
        Math.round((response.medianEaseFactor ?? 0) * 100);
      setMedianEase(Number.isFinite(pct) ? pct : 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching card ease stats:', err);
      setError('Không thể tải dữ liệu');
      setChartData([]);
      setMedianEase(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Card Ease</h2>

      {loading && <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>}
      {error && <div className="text-center py-20 text-red-500">{error}</div>}
      {!loading && !error && chartData.length > 0 && (
        <>
          {/* Chart */}
          <div className="w-full h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="ease" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CardEaseTooltip />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="count" fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
            <p className="text-sm text-gray-600">Trung vị ease (thang hiển thị)</p>
            <p className="text-2xl font-bold text-green-600">{medianEase}%</p>
             hơn thì thẻ xuất hiện ôn thường xuyên hơn.
            
          </div>

          {/* Legend */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Ease Factor Distribution:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {chartData.map((item) => (
                <div
                  key={item.ease}
                  className="p-3 rounded-lg border"
                  style={{ borderColor: item.color, backgroundColor: item.color + '20' }}
                >
                  <p className="text-sm font-bold" style={{ color: item.color }}>
                    {item.ease}
                  </p>
                  <p className="text-xs text-gray-600">{item.count} cards</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
