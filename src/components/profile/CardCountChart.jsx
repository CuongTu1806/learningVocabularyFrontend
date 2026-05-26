import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { profileService } from '../../services/profileService';

// Custom tooltip component outside render
const CardCountTooltip = (props) => {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    const { name, value, payload: dataPayload } = payload[0];
    const total = dataPayload.total || 85;
    const percentage = ((value / total) * 100).toFixed(1);
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
        <p className="font-bold">{name}</p>
        <p>{value} ({percentage}%)</p>
      </div>
    );
  }
  return null;
};

export default function CardCountChart() {
  const [chartData, setChartData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCardCountStats();
  }, []);

  const fetchCardCountStats = async () => {
    try {
      setLoading(true);
      const response = await profileService.getCardCountStats();
      setChartData(response.data || []);
      setTotal(response.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching card count stats:', err);
      setError('Không thể tải dữ liệu');
      setChartData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Phân loại từ vựng</h2>

      {loading && <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>}
      {error && <div className="text-center py-20 text-red-500">{error}</div>}
      {!loading && !error && chartData.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Pie Chart */}
          <div className="flex-1">
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    paddingAngle={0.5}
                    dataKey="value"
                    label={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CardCountTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend and Stats */}
          <div className="flex-1 space-y-4">
            <div className="space-y-3">
              {chartData.map((item) => {
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-semibold text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{item.value}</p>
                      <p className="text-sm text-gray-600">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="font-bold text-gray-700">Total</span>
                  <span className="text-lg font-bold text-blue-600">{total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
