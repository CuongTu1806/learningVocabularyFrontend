import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { contestAPI } from '../services/index';
import { unwrapApiData } from '../utils/apiHelpers';

function defaultStartLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultEndLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(21, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local -> LocalDateTime string cho Spring */
function toLocalDateTimeIso(s) {
  if (!s) return '';
  return s.length === 16 ? `${s}:00` : s;
}

const emptyProblem = () => ({
  title: '',
  description: '',
  imageUrl: '',
  /** File ảnh chọn trên máy — upload sau khi tạo contest (ưu tiên hơn URL) */
  imageFile: null,
  answer: '',
  wrongAnswer: '',
  difficulty: '',
  maxScore: 10,
});

export default function ContestCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(defaultStartLocal());
  const [endTime, setEndTime] = useState(defaultEndLocal());
  const [visibility, setVisibility] = useState('PUBLIC');
  const [problems, setProblems] = useState([emptyProblem()]);
  const [saving, setSaving] = useState(false);

  const updateProblem = useCallback((index, field, value) => {
    setProblems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const setProblemImageFile = useCallback((index, file) => {
    setProblems((prev) => {
      const next = [...prev];
      const cur = next[index];
      next[index] = {
        ...cur,
        imageFile: file || null,
        imageUrl: file ? '' : cur.imageUrl,
      };
      return next;
    });
  }, []);

  const addProblem = () => setProblems((p) => [...p, emptyProblem()]);

  const removeProblem = (index) => {
    setProblems((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Nhập tiêu đề cuộc thi');
      return;
    }
    const st = toLocalDateTimeIso(startTime);
    const et = toLocalDateTimeIso(endTime);
    if (!st || !et) {
      alert('Chọn đủ thời gian bắt đầu và kết thúc');
      return;
    }
    if (new Date(et) <= new Date(st)) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    const mapped = [];
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      if (!p.title?.trim()) {
        alert(`Câu ${i + 1}: nhập tiêu đề`);
        return;
      }
      if (!p.answer?.trim()) {
        alert(`Câu ${i + 1}: nhập đáp án đúng (tiếng Anh)`);
        return;
      }
      const ms = Number(p.maxScore);
      if (Number.isNaN(ms) || ms < 1) {
        alert(`Câu ${i + 1}: điểm tối đa phải >= 1`);
        return;
      }
      const hasFile = p.imageFile instanceof File;
      mapped.push({
        title: p.title.trim(),
        description: p.description?.trim() || undefined,
        wrongAnswer: p.wrongAnswer?.trim() || undefined,
        imageUrl: hasFile ? undefined : p.imageUrl?.trim() || undefined,
        answer: p.answer.trim(),
        difficulty: p.difficulty?.trim() || undefined,
        maxScore: ms,
        orderIndex: i + 1,
      });
    }

    if (mapped.length === 0) {
      alert('Thêm ít nhất một câu hỏi');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: st,
      endTime: et,
      visibility: visibility || 'PUBLIC',
      problems: mapped,
    };

    try {
      setSaving(true);
      const res = await contestAPI.create(payload);
      const data = unwrapApiData(res);
      const newId = data?.id;
      if (newId != null) {
        const returned = Array.isArray(data.problems) ? [...data.problems] : [];
        returned.sort(
          (a, b) =>
            (a.orderIndex ?? a.order_index ?? 0) - (b.orderIndex ?? b.order_index ?? 0)
        );
        const uploadErrors = [];
        for (let i = 0; i < returned.length; i++) {
          const file = problems[i]?.imageFile;
          const pid = returned[i]?.id ?? returned[i]?.problem_id;
          if (file instanceof File && pid != null) {
            try {
              await contestAPI.uploadProblemImage(newId, pid, file);
            } catch (e) {
              uploadErrors.push(i + 1);
            }
          }
        }
        if (uploadErrors.length) {
          alert(
            `Cuộc thi đã tạo nhưng không upload được ảnh ở câu: ${uploadErrors.join(
              ', '
            )}. Bạn có thể sửa đề sau (nếu có chức năng) hoặc tạo lại.`
          );
        }
        navigate(`/contests/${newId}/play`);
      } else {
        navigate('/contests');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Không tạo được cuộc thi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50 py-12 min-h-screen">
        <div className="max-w-3xl mx-auto px-6">
          <button
            type="button"
            onClick={() => navigate('/contests')}
            className="text-indigo-600 font-semibold hover:text-indigo-800 mb-6"
          >
            ← Danh sách cuộc thi
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo cuộc thi mới</h1>
          <p className="text-gray-600 mb-8">
            Điền thông tin cuộc thi và các câu hỏi. Ảnh minh họa: upload file (khuyến nghị) hoặc dán URL
            ngoài.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="card space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Thông tin chung</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Vòng loại từ vựng tuần 1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                <textarea
                  className="input-field h-24 resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Luật chơi, gợi ý..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bắt đầu *</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kết thúc *</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hiển thị</label>
                <select
                  className="input-field"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </div>
            </div>

            {problems.map((p, index) => (
              <div key={index} className="card border-indigo-100 bg-white/80 space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <h2 className="text-lg font-bold text-indigo-900">Câu {index + 1}</h2>
                  {problems.length > 1 && (
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => removeProblem(index)}
                    >
                      Xóa câu
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề câu *</label>
                  <input
                    className="input-field"
                    value={p.title}
                    onChange={(e) => updateProblem(index, 'title', e.target.value)}
                    placeholder="VD: Nhìn ảnh — từ tiếng Anh là gì?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả / gợi ý</label>
                  <textarea
                    className="input-field h-20 resize-y"
                    value={p.description}
                    onChange={(e) => updateProblem(index, 'description', e.target.value)}
                    placeholder="Tuỳ chọn"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ảnh minh họa (tuỳ chọn)
                  </label>
                  <input
                    key={`${index}-${p.imageFile ? 'f' : 'n'}`}
                    type="file"
                    accept="image/*"
                    className="input-field text-sm file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-800"
                    onChange={(e) => setProblemImageFile(index, e.target.files?.[0] || null)}
                  />
                  {p.imageFile && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span>
                        Đã chọn: {p.imageFile.name} — upload sau khi tạo cuộc thi.
                      </span>
                      <button
                        type="button"
                        className="text-indigo-600 hover:underline"
                        onClick={() => setProblemImageFile(index, null)}
                      >
                        Bỏ chọn ảnh
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Hoặc URL ảnh (khi không chọn file)
                    </label>
                    <input
                      className="input-field"
                      value={p.imageUrl}
                      disabled={!!p.imageFile}
                      onChange={(e) => updateProblem(index, 'imageUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Đáp án đúng *</label>
                    <input
                      className="input-field"
                      value={p.answer}
                      onChange={(e) => updateProblem(index, 'answer', e.target.value)}
                      placeholder="dog"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Điểm tối đa *</label>
                    <input
                      type="number"
                      min={1}
                      className="input-field"
                      value={p.maxScore}
                      onChange={(e) => updateProblem(index, 'maxScore', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Độ khó</label>
                    <input
                      className="input-field"
                      value={p.difficulty}
                      onChange={(e) => updateProblem(index, 'difficulty', e.target.value)}
                      placeholder="easy / medium..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Đáp án nhiễu
                    </label>
                    <input
                      className="input-field"
                      value={p.wrongAnswer}
                      onChange={(e) => updateProblem(index, 'wrongAnswer', e.target.value)}
                      placeholder="Tuỳ chọn"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn-secondary w-full py-3 border-dashed border-2 border-indigo-300 text-indigo-700"
              onClick={addProblem}
            >
              + Thêm câu hỏi
            </button>

            <div className="flex flex-wrap gap-4 justify-end pt-4">
              <button type="button" className="btn-secondary px-8" onClick={() => navigate('/contests')}>
                Hủy
              </button>
              <button type="submit" className="btn-primary px-8" disabled={saving}>
                {saving ? 'Đang tạo...' : 'Tạo cuộc thi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
