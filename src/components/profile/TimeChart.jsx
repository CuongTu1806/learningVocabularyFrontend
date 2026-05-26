import React, { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
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
const TimeTooltip = (props) => {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    const dateStr = dataPoint?.dateDisplay || '';
    const hours = Math.floor(dataPoint?.total / 60) || 0;
    const mins = (dataPoint?.total % 60) || 0;
    
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
        <p className="font-semibold mb-2">{dateStr}</p>
        {payload.map((entry, index) => (
          <p key={index}>{entry.name}: {entry.value}m</p>
        ))}
        <p className="mt-2 text-yellow-400 font-semibold">
          Tổng: {hours}h {mins}m
        </p>
      </div>
    );
  }
  return null;
};

export default function TimeChart() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await profileService.getTimeStats(period);
      
      // Add dateDisplay to each data point if coming from API
      const dataWithDates = (response.data || []).map(item => ({
        ...item,
        dateDisplay: formatDate(getDateFromOffset(parseInt(item.day)))
      }));
      
      setData(dataWithDates);
      setStats(response.stats || {});
      setError(null);
    } catch (err) {
      console.error('Error fetching time stats:', err);
      setError('Không thể tải dữ liệu');
      setData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchTimeStats();
  }, [fetchTimeStats]);

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

  // Convert to hours for display
  const convertToHours = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Thời gian học</h2>

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
      <div className="w-full h-96 mb-6">
        {loading && <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>}
        {error && <div className="text-center py-20 text-red-500">{error}</div>}
        {!loading && !error && data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                stroke="#6b7280"
                tick={renderCustomXAxisTick}
              />
              <YAxis stroke="#6b7280" label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<TimeTooltip />} />
              <Legend />
              <Bar dataKey="learning" stackId="a" fill="#f97316" name="Learning" />
              <Bar dataKey="relearning" stackId="a" fill="#ef4444" name="Relearning" />
              <Bar dataKey="young" stackId="a" fill="#3b82f6" name="Young" />
              <Bar dataKey="mature" stackId="a" fill="#10b981" name="Mature" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

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
            <p className="text-lg font-bold text-gray-800">{convertToHours(stats.total)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average over period</p>
            <p className="text-lg font-bold text-gray-800">{stats.avgOverPeriod} minutes/day</p>
          </div>
          <div className="md:col-span-3">
            <p className="text-sm text-gray-600">Average for days studied</p>
            <p className="text-lg font-bold text-gray-800">{stats.avgForDaysStudied} minutes/day</p>
          </div>
        </div>
      )}
    </div>
  );
}
