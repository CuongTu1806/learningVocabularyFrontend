import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { profileService } from '../../services/profileService';

// Custom tooltip component outside render
const ReviewIntervalTooltip = (props) => {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    const { days, count } = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
        <p className="font-bold">{days} days</p>
        <p>{count} cards</p>
      </div>
    );
  }
  return null;
};

export default function ReviewIntervalChart() {
  const [chartData, setChartData] = useState([]);
  const [medianInterval, setMedianInterval] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviewIntervalStats();
  }, []);

  const fetchReviewIntervalStats = async () => {
    try {
      setLoading(true);
      const response = await profileService.getReviewIntervalStats();
      setChartData(response.data || []);
      setMedianInterval(response.medianInterval || 0);
      setTotal(response.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching review interval stats:', err);
      setError('Không thể tải dữ liệu');
      setChartData([]);
      setMedianInterval(0);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Review Interval (Days)</h2>

      {loading && <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>}
      {error && <div className="text-center py-20 text-red-500">{error}</div>}
      {!loading && !error && chartData.length > 0 && (
        <>
          {/* Chart */}
          <div className="w-full h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="days" 
                  stroke="#6b7280" 
                  type="number"
                  label={{ value: 'Days', position: 'insideBottomRight', offset: -10 }}
                />
                <YAxis stroke="#6b7280" label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<ReviewIntervalTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Median Interval</p>
              <p className="text-lg font-bold text-gray-800">{medianInterval.toFixed(1)} days</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Cards</p>
              <p className="text-lg font-bold text-gray-800">{total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Max Interval</p>
              <p className="text-lg font-bold text-gray-800">{chartData.length > 0 ? chartData[chartData.length - 1].days : 0} days</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
