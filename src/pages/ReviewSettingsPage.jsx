import { useEffect, useState } from 'react';
import { spacedRepetitionAPI } from '../services';
import Layout from '../components/Layout';

export default function ReviewSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    learningSteps: '',
    maxIntervalDays: 0,
    easyBonus: 0,
    delayFactor: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await spacedRepetitionAPI.getSettings();
      const data = response.data;
      setSettings(data);
      setFormData({
        learningSteps: data.learningSteps,
        maxIntervalDays: data.maxIntervalDays,
        easyBonus: data.easyBonus,
        delayFactor: data.delayFactor,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải cài đặt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await spacedRepetitionAPI.updateSettings(formData);
      setSuccessMessage('Cài đặt đã được lưu thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu cài đặt');
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 flex items-center justify-center min-h-screen">
          <div className="text-3xl font-bold text-gray-600">⏳ Đang tải cài đặt...</div>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 min-h-screen">
        <div className="max-w-2xl w-full mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cài đặt Spaced Repetition</h1>
          <p className="text-gray-600">Tuỳ chỉnh cơ chế ôn tập theo thuật toán SM-2</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 font-semibold">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Learning Steps */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              Các bước học
              <span className="text-sm font-normal text-gray-600">(Learning Steps)</span>
            </h3>
            <p className="text-gray-600 mb-4">
              Định nghĩa các khoảng thời gian giữa các lần ôn tập cho những flashcard mới. Ví dụ: 1m, 10m, 30m, 1h
            </p>
            <textarea
              value={formData.learningSteps}
              onChange={(e) => handleChange('learningSteps', e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none font-mono"
              rows="3"
              placeholder="Ví dụ: 1m, 10m, 30m, 1h"
            />
            <p className="text-sm text-gray-500 mt-2">
              Định dạng: Các giá trị cách nhau bởi dấu phẩy (dung lượng phút hoặc giờ)
            </p>
          </div>

          {/* Max Interval Days */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              📅 Khoảng cách tối đa
              <span className="text-sm font-normal text-gray-600">(Max Interval)</span>
            </h3>
            <p className="text-gray-600 mb-4">
              Khoảng cách tối đa giữa hai lần ôn tập (tính bằng ngày). Ví dụ: 36500 = ~100 năm
            </p>
            <input
              type="number"
              value={formData.maxIntervalDays}
              onChange={(e) => handleChange('maxIntervalDays', parseInt(e.target.value) || 0)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
              min="1"
            />
            <p className="text-sm text-gray-500 mt-2">
              Giá trị lớn hơn = ôn tập ít lại hơn sau khi đạt mức độ cao
            </p>
          </div>

          {/* Easy Bonus */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              ✨ Easy Bonus
              <span className="text-sm font-normal text-gray-600">(Hệ số bonus khi dễ)</span>
            </h3>
            <p className="text-gray-600 mb-4">
              Nhân với interval khi bạn đánh giá "Easy". Thường là 1.3 (tăng 30% khoảng cách)
            </p>
            <input
              type="number"
              step="0.1"
              value={formData.easyBonus}
              onChange={(e) => handleChange('easyBonus', parseFloat(e.target.value) || 0)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
              min="0.5"
              max="2"
            />
            <p className="text-sm text-gray-500 mt-2">
              Giá trị cao = tăng khoảng cách nhiều hơn khi bạn trả lời dễ dàng
            </p>
          </div>

          {/* Delay Factor */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              Delay Factor
              <span className="text-sm font-normal text-gray-600">(Hệ số trễ hạn)</span>
            </h3>
            <p className="text-gray-600 mb-4">
              Nếu bạn ôn tập trễ hạn, ease factor sẽ giảm theo hệ số này. Thường là 0.6
            </p>
            <input
              type="number"
              step="0.01"
              value={formData.delayFactor}
              onChange={(e) => handleChange('delayFactor', parseFloat(e.target.value) || 0)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
              min="0"
              max="1"
            />
            <p className="text-sm text-gray-500 mt-2">
              Giá trị cao = phạt ít hơn khi bạn ôn tập trễ
            </p>
          </div>

          {/* Info Box */}
          <div className="card bg-blue-50 border-l-4 border-l-blue-500">
            <h4 className="font-bold text-blue-900 mb-2">Về thuật toán SM-2:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Again (q=0):</strong> Interval ÷ 10, quay lại bước học đầu tiên</li>
              <li>• <strong>Hard (q=3):</strong> Interval × 1.2</li>
              <li>• <strong>Good (q=4):</strong> Interval × EF (Ease Factor)</li>
              <li>• <strong>Easy (q=5):</strong> Interval × EF × Easy Bonus</li>
              <li>• Ease Factor = 2.5 + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button type="submit" className="btn-primary flex-1 py-3 font-semibold">
              💾 Lưu cài đặt
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = '/spaced-repetition')}
              className="btn-secondary flex-1 py-3 font-semibold"
            >
              ← Quay lại
            </button>
          </div>
        </form>

        {/* Current Settings Display */}
        {settings && (
          <div className="mt-12 card bg-gray-50">
            <h3 className="text-xl font-bold mb-4">Cài đặt hiện tại:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Learning Steps:</p>
                <p className="font-mono font-bold">{settings.learningSteps}</p>
              </div>
              <div>
                <p className="text-gray-600">Max Interval:</p>
                <p className="font-mono font-bold">{settings.maxIntervalDays} ngày</p>
              </div>
              <div>
                <p className="text-gray-600">Easy Bonus:</p>
                <p className="font-mono font-bold">{settings.easyBonus}</p>
              </div>
              <div>
                <p className="text-gray-600">Delay Factor:</p>
                <p className="font-mono font-bold">{settings.delayFactor}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
}
