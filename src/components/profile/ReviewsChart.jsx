import React, { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { profileService } from '../../services/profileService';

// Helper function to get date from offset
const getDateFromOffset = (offset) => {
  const today = new Date();
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return date;
};

// Helper function to format date as d/M
const formatDate = (date) => {
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

// Custom tooltip component outside render
const ReviewsTooltip = (props) => {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    const dateStr = dataPoint?.dateDisplay || '';
    const total = (dataPoint?.learning || 0) + (dataPoint?.relearning || 0) + (dataPoint?.young || 0) + (dataPoint?.mature || 0) + (dataPoint?.filtered || 0);
    
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
        <p className="font-semibold mb-2">{dateStr}</p>
        {payload.map((entry, index) => (
          <p key={index}>{entry.name}: {entry.value}</p>
        ))}
        <p className="mt-2 text-yellow-400 font-semibold">
          Tổng: {total}
        </p>
      </div>
    );
  }
  return null;
};

export default function ReviewsChart() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviewsStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await profileService.getReviewsStats(period);
      
      // Add dateDisplay to each data point if coming from API
      const dataWithDates = (response.data || []).map(item => ({
        ...item,
        dateDisplay: formatDate(getDateFromOffset(parseInt(item.day)))
      }));
      
      setData(dataWithDates);
      setStats(response.stats || {});
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews stats:', err);
      setError('Không thể tải dữ liệu');
      // Fallback to empty data
      setData([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReviewsStats();
  }, [fetchReviewsStats]);

  // Custom XAxis tick formatter - only show labels for multiples of 5
  const renderCustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    const value = parseInt(payload.value);
    
    // Only show label for multiples of 5 (including 0)
    if (value % 5 === 0) {
      return (
        <text x={x} y={y + 10} textAnchor="middle" fill="#6b7280">
          {payload.value}
        </text>
      );
    }
    
    // Still draw tick mark for other values
    return (
      <text x={x} y={y} textAnchor="middle" fill="transparent">
        {payload.value}
      </text>
    );
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Số lượng ôn tập</h2>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Period Selector */}
          <div className="flex gap-4 mb-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="month"
                checked={period === 'month'}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">1 tháng</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="quarter"
                checked={period === 'quarter'}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">3 tháng</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="year"
                checked={period === 'year'}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">1 năm</span>
            </label>
          </div>

          {/* Chart */}
          {data.length > 0 && (
            <div className="w-full h-96 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#6b7280"
                    tick={renderCustomXAxisTick}
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip content={<ReviewsTooltip />} />
                  <Legend />
                  <Bar dataKey="filtered" stackId="a" fill="#9ca3af" name="Filtered" />
                  <Bar dataKey="learning" stackId="a" fill="#f97316" name="Learning" />
                  <Bar dataKey="relearning" stackId="a" fill="#ef4444" name="Relearning" />
                  <Bar dataKey="young" stackId="a" fill="#3b82f6" name="Young" />
                  <Bar dataKey="mature" stackId="a" fill="#10b981" name="Mature" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Days Studied</p>
                <p className="text-lg font-bold text-gray-800">
                  {stats.daysStudied} of {stats.daysTotal} ({((stats.daysStudied / stats.daysTotal) * 100).toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-800">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average over period</p>
                <p className="text-lg font-bold text-gray-800">{stats.avgOverPeriod}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-sm text-gray-600">Average for days studied</p>
                <p className="text-lg font-bold text-gray-800">{stats.avgForDaysStudied}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
