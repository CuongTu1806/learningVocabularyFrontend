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
        <div className="bg-slate-50 py-12 flex items-center justify-center min-h-screen">
          <div className="text-2xl font-semibold text-slate-600">Đang tải cài đặt...</div>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="bg-slate-50 py-12 min-h-screen">
        <div className="mx-auto w-full max-w-2xl px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-slate-900">Cài đặt Spaced Repetition</h1>
          <p className="text-slate-600">Tuỳ chỉnh cơ chế ôn tập theo thuật toán SM-2</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Learning Steps */}
          <div className="card">
            <h3 className="mb-2 text-xl font-semibold text-slate-900">Các bước học</h3>
            <p className="mb-4 text-sm text-slate-500">Learning Steps</p>
            <p className="mb-4 text-slate-600">
              Định nghĩa các khoảng thời gian giữa các lần ôn tập cho những flashcard mới. Ví dụ: 1m, 10m, 30m, 1h
            </p>
            <textarea
              value={formData.learningSteps}
              onChange={(e) => handleChange('learningSteps', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200"
              rows="3"
              placeholder="Ví dụ: 1m, 10m, 30m, 1h"
            />
            <p className="mt-2 text-sm text-slate-500">
              Định dạng: Các giá trị cách nhau bởi dấu phẩy (dung lượng phút hoặc giờ)
            </p>
          </div>

          {/* Max Interval Days */}
          <div className="card">
            <h3 className="mb-2 text-xl font-semibold text-slate-900">Khoảng cách tối đa</h3>
            <p className="mb-4 text-sm text-slate-500">Max Interval</p>
            <p className="mb-4 text-slate-600">
              Khoảng cách tối đa giữa hai lần ôn tập (tính bằng ngày). Ví dụ: 36500 = ~100 năm
            </p>
            <input
              type="number"
              value={formData.maxIntervalDays}
              onChange={(e) => handleChange('maxIntervalDays', Number.parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200"
              min="1"
            />
            <p className="mt-2 text-sm text-slate-500">
              Giá trị lớn hơn = ôn tập ít lại hơn sau khi đạt mức độ cao
            </p>
          </div>

          {/* Easy Bonus */}
          <div className="card">
            <h3 className="mb-2 text-xl font-semibold text-slate-900">Easy Bonus</h3>
            <p className="mb-4 text-sm text-slate-500">Hệ số bonus khi dễ</p>
            <p className="mb-4 text-slate-600">
              Nhân với interval khi bạn đánh giá "Easy". Thường là 1.3 (tăng 30% khoảng cách)
            </p>
            <input
              type="number"
              step="0.1"
              value={formData.easyBonus}
              onChange={(e) => handleChange('easyBonus', Number.parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200"
              min="0.5"
              max="2"
            />
            <p className="mt-2 text-sm text-slate-500">
              Giá trị cao = tăng khoảng cách nhiều hơn khi bạn trả lời dễ dàng
            </p>
          </div>

          {/* Delay Factor */}
          <div className="card">
            <h3 className="mb-2 text-xl font-semibold text-slate-900">Delay Factor</h3>
            <p className="mb-4 text-sm text-slate-500">Hệ số trễ hạn</p>
            <p className="mb-4 text-slate-600">
              Nếu bạn ôn tập trễ hạn, ease factor sẽ giảm theo hệ số này. Thường là 0.6
            </p>
            <input
              type="number"
              step="0.01"
              value={formData.delayFactor}
              onChange={(e) => handleChange('delayFactor', Number.parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200"
              min="0"
              max="1"
            />
            <p className="mt-2 text-sm text-slate-500">
              Giá trị cao = phạt ít hơn khi bạn ôn tập trễ
            </p>
          </div>

          {/* Info Box */}
          <div className="card bg-slate-50">
            <h4 className="mb-2 font-semibold text-slate-900">Về thuật toán SM-2</h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>Again (q=0): Interval ÷ 10, quay lại bước học đầu tiên</li>
              <li>Hard (q=3): Interval × 1.2</li>
              <li>Good (q=4): Interval × EF (Ease Factor)</li>
              <li>Easy (q=5): Interval × EF × Easy Bonus</li>
              <li>Ease Factor = 2.5 + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
              <button type="submit" className="btn-primary flex-1 py-3 font-semibold">
              Lưu cài đặt
            </button>
            <button
              type="button"
              onClick={() => (globalThis.location.href = '/spaced-repetition')}
              className="btn-secondary flex-1 py-3 font-semibold"
            >
              ← Quay lại
            </button>
          </div>
        </form>

        {/* Current Settings Display */}
        {settings && (
          <div className="card bg-slate-50">
            <h3 className="mb-4 text-xl font-semibold text-slate-900">Cài đặt hiện tại</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Learning Steps</p>
                <p className="font-mono font-semibold text-slate-900">{settings.learningSteps}</p>
              </div>
              <div>
                <p className="text-slate-500">Max Interval</p>
                <p className="font-mono font-semibold text-slate-900">{settings.maxIntervalDays} ngày</p>
              </div>
              <div>
                <p className="text-slate-500">Easy Bonus</p>
                <p className="font-mono font-semibold text-slate-900">{settings.easyBonus}</p>
              </div>
              <div>
                <p className="text-slate-500">Delay Factor</p>
                <p className="font-mono font-semibold text-slate-900">{settings.delayFactor}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
}
