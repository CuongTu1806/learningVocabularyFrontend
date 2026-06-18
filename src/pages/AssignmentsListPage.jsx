import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { assignmentAPI, classAPI } from '../services/index';
import { unwrapApiData, sameUserId } from '../utils/apiHelpers';

function defaultDueLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function createAssignmentQuestion(questionMode) {
  return {
    id: crypto.randomUUID(),
    text: '',
    choices: questionMode === 'quiz' ? [] : undefined,
  };
}

function updateQuestionTextInList(list, questionId, text) {
  return list.map((question) => (question.id === questionId ? { ...question, text } : question));
}

function updateChoiceTextInList(list, questionId, choiceId, text) {
  return list.map((question) => {
    if (question.id !== questionId) return question;
    const choices = (question.choices || []).map((choice) => (choice.id === choiceId ? { ...choice, text } : choice));
    return { ...question, choices };
  });
}

function updateChoiceCorrectInList(list, questionId, choiceId, correct) {
  return list.map((question) => {
    if (question.id !== questionId) return question;
    const choices = (question.choices || []).map((choice) => (choice.id === choiceId ? { ...choice, correct } : choice));
    return { ...question, choices };
  });
}

function addChoiceToQuestionInList(list, questionId) {
  return list.map((question) =>
    question.id === questionId
      ? {
          ...question,
          choices: [...(question.choices || []), { id: crypto.randomUUID(), text: '', correct: false }],
        }
      : question,
  );
}

function removeQuestionFromList(list, questionId) {
  return list.filter((question) => question.id !== questionId);
}

export default function AssignmentsListPage() {
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: defaultDueLocal(),
  });
  const [createFiles, setCreateFiles] = useState([]);
  const [questionMode, setQuestionMode] = useState('file'); // 'file' | 'quiz' | 'fill'
  const [questions, setQuestions] = useState([]);

  const isClassScope = Boolean(classId);
  const canCreate =
    isClassScope &&
    classroom &&
    (classroom.currentUserIsOwner === true ||
      sameUserId(classroom.ownerId, user?.userId));

  useEffect(() => {
    if (!isClassScope) return;
    const params = new URLSearchParams(location.search);
    if (params.get('create') === '1') {
      setShowModal(true);
    }
  }, [isClassScope, location.search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cid = classId ? Number(classId) : undefined;
      if (classId && Number.isNaN(cid)) {
        setError('Mã lớp không hợp lệ');
        setItems([]);
        return;
      }
      if (isClassScope) {
        const [resClass, resAsg] = await Promise.all([
          classAPI.get(cid),
          assignmentAPI.list(cid),
        ]);
        const c = unwrapApiData(resClass);
        if (!c) {
          setError(resClass?.data?.message || 'Không tải được lớp');
          setClassroom(null);
          setItems([]);
          return;
        }
        setClassroom(c);
        const list = unwrapApiData(resAsg);
        setItems(Array.isArray(list) ? list : []);
      } else {
        const resAsg = await assignmentAPI.list();
        const list = unwrapApiData(resAsg);
        setClassroom(null);
        setItems(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải danh sách');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [classId, isClassScope]);

  useEffect(() => {
    load();
  }, [load]);

  const updateQuestionText = (questionId, text) => setQuestions((currentQuestions) => updateQuestionTextInList(currentQuestions, questionId, text));
  const updateChoiceText = (questionId, choiceId, text) => setQuestions((currentQuestions) => updateChoiceTextInList(currentQuestions, questionId, choiceId, text));
  const updateChoiceCorrect = (questionId, choiceId, correct) => setQuestions((currentQuestions) => updateChoiceCorrectInList(currentQuestions, questionId, choiceId, correct));
  const addChoiceToQuestion = (questionId) => setQuestions((currentQuestions) => addChoiceToQuestionInList(currentQuestions, questionId));
  const removeQuestion = (questionId) => setQuestions((currentQuestions) => removeQuestionFromList(currentQuestions, questionId));
  const addQuestion = () => setQuestions((currentQuestions) => [...currentQuestions, createAssignmentQuestion(questionMode)]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      alert('Nhập tiêu đề bài tập');
      return;
    }
    if (!form.dueDate) {
      alert('Chọn hạn nộp');
      return;
    }
    const due = form.dueDate.length === 16 ? `${form.dueDate}:00` : form.dueDate;
    let assignmentType = 'fill';
    if (questionMode === 'file') assignmentType = 'file';
    if (questionMode === 'quiz') assignmentType = 'quiz';
    try {
      setSaving(true);
      const payload = {
        classId: Number(classId),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDate: due,
        type: assignmentType,
      };
      if (questionMode !== 'file') payload.questions = questions;
      const res = await assignmentAPI.create(payload);
      const created = unwrapApiData(res);
      const newId = created?.id;
      if (newId != null && createFiles.length > 0) {
        await assignmentAPI.uploadAttachments(newId, createFiles);
      }
      setShowModal(false);
      setForm({ title: '', description: '', dueDate: defaultDueLocal() });
      setCreateFiles([]);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await assignmentAPI.delete(id);
      setDeleteId(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center p-16 text-gray-600">Đang tải bài tập...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 py-12 min-h-screen">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => (isClassScope ? navigate(`/classes/${classId}`) : navigate('/dashboard'))}
              className="mb-4 font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              {isClassScope ? '← Về lớp học' : '← Trang chủ'}
            </button>
            <h1 className="mb-2 text-4xl font-semibold tracking-tight text-slate-900">
              {isClassScope ? 'Bài tập trong lớp' : 'Bài tập tôi đã giao'}
            </h1>
            {(() => {
              let heading = 'Các bài tập bạn đã tạo (chủ lớp)';
              if (isClassScope) {
                heading = classroom?.name ? `Lớp: ${classroom.name}` : 'Danh sách bài tập theo lớp';
              }
              return <p className="text-lg text-slate-600">{heading}</p>;
            })()}
          </div>

          {error && (
            <div className="card mb-6 border-red-200 bg-red-50 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {canCreate && (
            <div className="mb-8 text-sm text-slate-500">Mở từ trang lớp để tạo bài tập.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.length === 0 ? (
              <div className="col-span-full card py-12 text-center text-slate-600">
                {isClassScope ? 'Chưa có bài tập nào trong lớp này.' : 'Bạn chưa tạo bài tập nào.'}
              </div>
            ) : (
              items.map((a) => (
                <div key={a.id} className="card transition-shadow hover:shadow-lg">
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">{a.title}</h3>
                  <p className="mb-3 line-clamp-2 text-sm text-slate-600">{a.description || '—'}</p>
                  <p className="mb-4 text-xs text-slate-500">
                    Hạn nộp:{' '}
                    {a.dueDate
                      ? new Date(a.dueDate).toLocaleString('vi-VN')
                      : '—'}
                  </p>
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/assignments/${a.id}`)}
                      className="btn-primary flex-1 text-center py-2 text-sm min-w-[120px]"
                    >
                      Mở bài tập
                    </button>
                    {((isClassScope &&
                      (classroom?.currentUserIsOwner === true ||
                        sameUserId(user?.userId, a.createdByUserId))) ||
                      (!isClassScope && sameUserId(user?.userId, a.createdByUserId))) && (
                      <button
                        type="button"
                        onClick={() => setDeleteId(a.id)}
                        className="btn-secondary text-red-600 border border-red-200 py-2 px-4 text-sm"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="mb-6 text-2xl font-semibold text-slate-900">Giao bài mới</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="assignment-type" className="mb-2 block font-semibold text-slate-700">Loại bài tập</label>
                <div id="assignment-type" className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => setQuestionMode('file')} className={`px-3 py-1 rounded ${questionMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Nộp file / văn bản</button>
                  <button type="button" onClick={() => setQuestionMode('quiz')} className={`px-3 py-1 rounded ${questionMode === 'quiz' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Trắc nghiệm</button>
                  <button type="button" onClick={() => setQuestionMode('fill')} className={`px-3 py-1 rounded ${questionMode === 'fill' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Điền đáp án</button>
                </div>
              </div>
              <div>
                <label htmlFor="assignment-title" className="block font-semibold text-gray-700 mb-2">Tiêu đề *</label>
                <input
                  id="assignment-title"
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Bài tập tuần 1"
                />
              </div>
              <div>
                <label htmlFor="assignment-description" className="block font-semibold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  id="assignment-description"
                  className="input-field h-24 resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Yêu cầu chi tiết..."
                />
              </div>
              <div>
                <label htmlFor="assignment-due" className="block font-semibold text-gray-700 mb-2">Hạn nộp *</label>
                <input
                  id="assignment-due"
                  type="datetime-local"
                  className="input-field"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Phải sau thời điểm hiện tại (theo quy tắc server)</p>
              </div>
              <div>
                <label htmlFor="assignment-files" className="block font-semibold text-gray-700 mb-2">Đính kèm đề (tuỳ chọn)</label>
                <input
                  id="assignment-files"
                  type="file"
                  multiple
                  className="input-field text-sm"
                  onChange={(e) =>
                    setCreateFiles(e.target.files ? Array.from(e.target.files) : [])
                  }
                />
                <p className="text-xs text-gray-500 mt-1">Tối đa 10MB mỗi file, nhiều file (tối đa 20 mỗi lần).</p>
              </div>

              {questionMode !== 'file' && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Câu hỏi ({questionMode === 'quiz' ? 'Trắc nghiệm' : 'Điền đáp án'})</h4>
                  <div className="space-y-3">
                    {questions.map((q, qi) => (
                      <div key={q.id || q.text || qi} className="p-3 border rounded">
                        <input className="input-field mb-2" value={q.text} onChange={(e) => updateQuestionText(q.id, e.target.value)} placeholder={`Câu hỏi ${qi + 1}`} />
                        {questionMode === 'quiz' && (
                          <div className="space-y-2">
                            {(q.choices||[]).map((ch, ci) => (
                              <div key={ch.id || ch.text || ci} className="flex items-center gap-2">
                                <input type="text" className="input-field flex-1" value={ch.text} onChange={(e)=>updateChoiceText(q.id, ch.id, e.target.value)} />
                                <label className="text-sm"><input type="checkbox" checked={ch.correct} onChange={(e)=>updateChoiceCorrect(q.id, ch.id, e.target.checked)} /> Đúng</label>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <button type="button" className="btn-secondary" onClick={()=>addChoiceToQuestion(q.id)}>Thêm lựa chọn</button>
                              <button type="button" className="text-red-600" onClick={()=>removeQuestion(q.id)}>Xóa câu hỏi</button>
                            </div>
                          </div>
                        )}
                        {questionMode === 'fill' && (
                          <div className="text-sm text-gray-600 mt-2">Nhập đáp án đúng cho câu hỏi ở dưới (học sinh sẽ nhập văn bản)</div>
                        )}
                      </div>
                    ))}
                    <div>
                      <button type="button" className="btn-primary" onClick={addQuestion}>Thêm câu hỏi</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" className="btn-secondary px-6" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button type="button" className="btn-primary px-6" disabled={saving} onClick={handleCreate}>
                {saving ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xóa bài tập?</h3>
            <p className="text-gray-600 mb-6">Các bài nộp liên quan cũng bị xóa.</p>
            <div className="flex gap-4 justify-end">
              <button type="button" className="btn-secondary px-6" onClick={() => setDeleteId(null)}>
                Hủy
              </button>
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg"
                onClick={() => handleDelete(deleteId)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
