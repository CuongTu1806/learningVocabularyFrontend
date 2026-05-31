import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { assignmentAPI, classAPI } from '../services/index';
import { unwrapApiData, sameUserId, saveBlobAsFile } from '../utils/apiHelpers';

function defaultDueLocalFromIso(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [gradeInputs, setGradeInputs] = useState({});
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalSubmission, setModalSubmission] = useState(null);
  const [studentFiles, setStudentFiles] = useState([]);
  const [moreAssignFiles, setMoreAssignFiles] = useState([]);
  const [uploadingAssign, setUploadingAssign] = useState(false);

  // Normalize student's answer to a choice index for q.choices
  const getSelectedIndex = (studentAnsRaw, q) => {
    if (studentAnsRaw === null || studentAnsRaw === undefined) return -1;
    // numeric index as string or number
    const num = Number(studentAnsRaw);
    if (Number.isFinite(num)) return num;
    let s = String(studentAnsRaw).trim();
    if (!s) return -1;
    // if starts with a letter (A/B/C) possibly followed by punctuation, use first letter
    const first = s.charAt(0).toUpperCase();
    const code = first.codePointAt(0);
    if (code >= 65 && code <= 90) {
      const idx = code - 65;
      if (q && Array.isArray(q.choices) && idx >= 0 && idx < q.choices.length) return idx;
    }
    // match by text (case-insensitive)
    if (q && Array.isArray(q.choices)) {
      const idx = q.choices.findIndex((c) => String(c.text).trim().toLowerCase() === s.toLowerCase());
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const id = Number(assignmentId);
      const res = await assignmentAPI.get(id);
      const data = unwrapApiData(res);
      if (!data) {
        setError(res?.data?.message || 'Không tải được bài tập');
        setAssignment(null);
        return;
      }
      setAssignment(data);
      setEditForm({
        title: data.title || '',
        description: data.description || '',
        dueDate: defaultDueLocalFromIso(data.dueDate),
      });

      let room = null;
      if (data.classId) {
        try {
          const rc = await classAPI.get(data.classId);
          room = unwrapApiData(rc);
          setClassroom(room);
        } catch {
          setClassroom(null);
        }
      } else {
        setClassroom(null);
      }

      const canManage =
        data.currentUserCanGrade === true ||
        room?.currentUserIsOwner === true ||
        sameUserId(user?.userId, data.createdByUserId);

      if (canManage) {
        const rs = await assignmentAPI.getSubmissions(id);
        const list = unwrapApiData(rs);
        if (Array.isArray(list)) {
          setSubmissions(list);
          const g = {};
          list.forEach((s) => {
            g[s.id] = String(s.score ?? '');
          });
          setGradeInputs(g);
        } else {
          setSubmissions([]);
        }
      } else {
        setSubmissions([]);
      }
      // initialize answers if assignment contains questions
      if (data.questions && Array.isArray(data.questions)) {
        const init = {};
        data.questions.forEach((q, idx) => {
          init[idx] = q.type === 'fill' ? '' : null;
        });
        setAnswers(init);
      } else {
        setAnswers({});
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải');
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, user?.userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // If assignment has questions (quiz/fill), submit answers
    if (assignment?.questions && Array.isArray(assignment.questions) && assignment.questions.length > 0) {
      // build answers array
      const payload = { answers: [] };
      for (let i = 0; i < assignment.questions.length; i += 1) {
        payload.answers.push(answers[i] ?? null);
      }
      try {
        setSubmitting(true);
        await assignmentAPI.submit(Number(assignmentId), payload);
        await load();
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const hasText = submitContent.trim().length > 0;
    const hasFiles = studentFiles.length > 0;
    if (!hasText && !hasFiles) {
      alert('Nhập nội dung hoặc chọn ít nhất một file');
      return;
    }
    try {
      setSubmitting(true);
      if (hasFiles) {
        const fd = new FormData();
        if (hasText) fd.append('content', submitContent.trim());
        studentFiles.forEach((f) => fd.append('files', f));
        await assignmentAPI.submitMultipart(Number(assignmentId), fd);
        setSubmitContent('');
        setStudentFiles([]);
      } else {
        const res = await assignmentAPI.submit(Number(assignmentId), { content: submitContent.trim() });
        const msg = res?.data?.message || '';
        if (msg.includes('đã nộp')) {
          alert(msg);
        } else {
          setSubmitContent('');
        }
      }
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAssignmentFile = async (att) => {
    try {
      const res = await assignmentAPI.downloadAssignmentAttachment(att.id);
      saveBlobAsFile(res.data, att.originalFilename || 'file');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDownloadSubmissionFile = async (submissionId, att) => {
    try {
      const res = await assignmentAPI.downloadSubmissionAttachment(submissionId, att.id);
      saveBlobAsFile(res.data, att.originalFilename || 'file');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteAssignmentFile = async (attachmentId) => {
    if (!window.confirm('Xóa file đính kèm này?')) return;
    try {
      await assignmentAPI.deleteAttachment(Number(assignmentId), attachmentId);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleUploadMoreAssignFiles = async () => {
    if (moreAssignFiles.length === 0) {
      alert('Chọn ít nhất một file');
      return;
    }
    try {
      setUploadingAssign(true);
      await assignmentAPI.uploadAttachments(Number(assignmentId), moreAssignFiles);
      setMoreAssignFiles([]);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setUploadingAssign(false);
    }
  };

  const handleGrade = async (submissionId) => {
    const raw = gradeInputs[submissionId];
    const score = parseFloat(String(raw).replace(',', '.'));
    if (Number.isNaN(score)) {
      alert('Nhập điểm hợp lệ');
      return;
    }
    try {
      await assignmentAPI.grade(Number(assignmentId), submissionId, score);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleUpdate = async () => {
    if (!editForm.title.trim() || !editForm.dueDate) {
      alert('Điền đủ tiêu đề và hạn nộp');
      return;
    }
    const due = editForm.dueDate.length === 16 ? `${editForm.dueDate}:00` : editForm.dueDate;
    try {
      setSaving(true);
      await assignmentAPI.update(Number(assignmentId), {
        classId: assignment.classId,
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        dueDate: due,
      });
      setShowEdit(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const isOverdue =
    assignment?.dueDate && new Date(assignment.dueDate).getTime() < Date.now();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-24 text-gray-600">Đang tải...</div>
      </Layout>
    );
  }

  if (error || !assignment) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="card bg-red-50 border-red-200">
            <p className="text-red-700 font-medium">{error || 'Không tìm thấy bài tập'}</p>
            <button type="button" className="btn-primary mt-4" onClick={() => navigate(-1)}>
              Quay lại
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const isTeacher =
    assignment.currentUserCanGrade === true ||
    classroom?.currentUserIsOwner === true ||
    sameUserId(user?.userId, assignment.createdByUserId);
  const hasSubmitted = assignment.currentUserHasSubmitted === true;
  const showStudentForm = !isTeacher && !hasSubmitted && !isOverdue;

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          <button
            type="button"
            onClick={() =>
              assignment.classId
                ? navigate(`/classes/${assignment.classId}`)
                : navigate('/classes')
            }
            className="mb-6 text-blue-600 font-semibold hover:text-blue-800"
          >
            ← Danh sách bài tập
          </button>

          <div className="card mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100">
            <div className="flex flex-wrap justify-between gap-4 items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
                {classroom && (
                  <p className="text-sm text-indigo-700 font-medium mb-2">Lớp: {classroom.name}</p>
                )}
                <p className="text-gray-700 whitespace-pre-wrap">{assignment.description || 'Không có mô tả'}</p>
                <p className="text-sm text-gray-500 mt-4">
                  Hạn nộp:{' '}
                  {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString('vi-VN') : '—'}
                  {isOverdue && <span className="ml-2 text-red-600 font-semibold">(Đã hết hạn)</span>}
                </p>
                {(assignment.attachments?.length > 0 || isTeacher) && (
                  <div className="mt-4 pt-4 border-t border-indigo-100">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Tài liệu đề bài</p>
                    <ul className="space-y-2">
                      {(assignment.attachments || []).map((att) => (
                        <li
                          key={att.id}
                          className="flex flex-wrap items-center gap-2 text-sm text-indigo-800"
                        >
                          <button
                            type="button"
                            className="text-blue-600 hover:underline font-medium"
                            onClick={() => handleDownloadAssignmentFile(att)}
                          >
                            {att.originalFilename || `File #${att.id}`}
                          </button>
                          <span className="text-gray-500 text-xs">
                            ({att.sizeBytes != null ? `${(att.sizeBytes / 1024).toFixed(1)} KB` : '—'})
                          </span>
                          {isTeacher && (
                            <button
                              type="button"
                              className="text-red-600 text-xs hover:underline"
                              onClick={() => handleDeleteAssignmentFile(att.id)}
                            >
                              Xóa
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    {isTeacher && (
                      <div className="mt-3 flex flex-wrap gap-2 items-end">
                        <input
                          type="file"
                          multiple
                          className="input-field text-sm flex-1 min-w-[200px]"
                          onChange={(e) =>
                            setMoreAssignFiles(e.target.files ? Array.from(e.target.files) : [])
                          }
                        />
                        <button
                          type="button"
                          className="btn-secondary text-sm py-2"
                          disabled={uploadingAssign}
                          onClick={handleUploadMoreAssignFiles}
                        >
                          {uploadingAssign ? 'Đang tải lên...' : 'Thêm file'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {isTeacher && (
                <button type="button" className="btn-secondary text-sm" onClick={() => setShowEdit(true)}>
                  Sửa bài tập
                </button>
              )}
            </div>
          </div>

          {isTeacher && submissions.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Bài nộp &amp; chấm điểm</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600">
                      <th className="py-2 pr-2">User ID</th>
                      <th className="py-2 pr-2">Nội dung</th>
                      <th className="py-2 pr-2">File nộp</th>
                      <th className="py-2 pr-2">Điểm</th>
                      <th className="py-2">Chấm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 align-top">
                        <td className="py-3 font-mono">{s.userId}</td>
                        <td className="py-3 max-w-md whitespace-pre-wrap">{s.content || '—'}</td>
                        <td className="py-3 max-w-[180px]">
                          {(s.attachments || []).length === 0 ? (
                            '—'
                          ) : (
                            <ul className="space-y-1">
                              {(s.attachments || []).map((att) => (
                                <li key={att.id}>
                                  <button
                                    type="button"
                                    className="text-blue-600 hover:underline text-left text-xs"
                                    onClick={() => handleDownloadSubmissionFile(s.id, att)}
                                  >
                                    {att.originalFilename || `#${att.id}`}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="py-3">{s.score}</td>
                        <td className="py-3">
                          <div className="flex gap-2 flex-wrap">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              className="input-field w-24 py-1 text-sm"
                              value={gradeInputs[s.id] ?? ''}
                              onChange={(e) =>
                                setGradeInputs({ ...gradeInputs, [s.id]: e.target.value })
                              }
                            />
                            <button
                              type="button"
                              className="btn-primary py-1 px-3 text-sm"
                              onClick={() => handleGrade(s.id)}
                            >
                              Lưu điểm
                            </button>
                            {Array.isArray(s.details) && s.details.length > 0 && (
                              <button
                                type="button"
                                className="btn-secondary py-1 px-3 text-sm"
                                onClick={() => {
                                  setModalSubmission(s);
                                  setShowDetailsModal(true);
                                }}
                              >
                                Xem chi tiết
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isTeacher && submissions.length === 0 && (
            <div className="card mb-8 text-gray-500 text-center py-8">Chưa có bài nộp.</div>
          )}

          {!isTeacher && hasSubmitted && (
            <div className="card bg-green-50 border-green-200 text-green-800 mb-8">
              Bạn đã nộp bài cho bài tập này.
            </div>
          )}

          {!isTeacher && hasSubmitted && assignment.currentUserSubmission?.details?.length > 0 && (
            <div className="card mb-8">
              <h3 className="text-lg font-bold mb-3">Chi tiết bài làm</h3>
              <div className="space-y-3">
                {assignment.currentUserSubmission.details.map((d) => {
                  const q = assignment?.questions?.[d.questionIndex];
                  const studentAnsRaw = d.studentAnswer;
                  const studentAnsNum = Number.isFinite(Number(studentAnsRaw)) ? Number(studentAnsRaw) : null;
                  return (
                    <div key={d.questionIndex} className="p-3 border rounded">
                      <div className="font-semibold">{d.questionText || `Câu ${d.questionIndex + 1}`}</div>
                      <div className="text-sm mt-2">
                        {q && Array.isArray(q.choices) && q.choices.length > 0 ? (
                          (() => {
                            const correctIndex = q.choices.findIndex((c) => String(c.text).trim() === String(d.expectedAnswer).trim());
                            const selectedIndex = getSelectedIndex(studentAnsRaw, q);
                            const studentIsCorrect = selectedIndex >= 0 && selectedIndex === correctIndex;
                            return (
                              <>
                                <ul className="space-y-2 mt-2">
                                  {q.choices.map((ch, ci) => {
                                    const isCorrect = ci === correctIndex;
                                    const isSelected = ci === selectedIndex;
                                    const letter = String.fromCodePoint(65 + ci);
                                    let circleClass = 'bg-gray-100 text-gray-600';
                                    let choiceBg = '';
                                    if (studentIsCorrect) {
                                      if (isSelected) {
                                        circleClass = 'bg-green-100 text-green-800';
                                        choiceBg = 'bg-green-50';
                                      }
                                    } else if (isCorrect) {
                                      circleClass = 'bg-green-100 text-green-800';
                                      choiceBg = 'bg-green-50';
                                    } else if (isSelected) {
                                      circleClass = 'bg-red-100 text-red-800';
                                      choiceBg = 'bg-red-50';
                                    }
                                    return (
                                      <li key={ci} className={`flex items-start gap-3 py-1 px-2 rounded ${choiceBg}`}>
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${circleClass}`}>
                                          {letter}
                                        </div>
                                        <div className={isSelected ? 'font-semibold' : ''}>{ch.text}</div>
                                      </li>
                                    );
                                  })}
                                </ul>
                                {!studentIsCorrect && correctIndex >= 0 && (
                                  <div className="text-sm text-green-700 font-medium mt-2">Đáp án đúng: {String.fromCodePoint(65 + correctIndex)}</div>
                                )}
                              </>
                            );
                          })()
                        ) : (
                          (() => {
                            const isCorrect = Boolean(d.correct);
                            return (
                              <div>
                                <div>
                                  <span className="font-medium">Nộp:</span>{' '}
                                  <span className={isCorrect ? 'text-green-700' : 'text-red-600'}>{d.studentAnswer ?? '—'}</span>
                                </div>
                                {!isCorrect && (
                                  <div className="text-sm text-green-700 font-medium mt-1">Đáp án đúng: {d.expectedAnswer ?? '—'}</div>
                                )}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showStudentForm && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Nộp bài</h2>
              {assignment?.questions && Array.isArray(assignment.questions) && assignment.questions.length > 0 ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    {assignment.questions.map((q, i) => (
                      <div key={i} className="p-3 border rounded">
                        <div className="font-semibold">{q.text || `Câu ${i + 1}`}</div>
                        {q.type === 'fill' ? (
                          <input type="text" className="input-field mt-2" value={answers[i] ?? ''} onChange={(e)=>setAnswers({...answers,[i]:e.target.value})} />
                        ) : (
                          <div className="mt-2 space-y-2">
                            {(q.choices||[]).map((ch, ci) => (
                              <label key={ci} className="flex items-center gap-2">
                                <input type="radio" name={`q-${i}`} checked={answers[i]===ci} onChange={()=>setAnswers({...answers,[i]:ci})} />
                                <span>{ch.text || `Lựa chọn ${ci+1}`}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Nộp bài'}</button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    className="input-field min-h-[160px] resize-y"
                    placeholder="Viết bài làm của bạn (tuỳ chọn nếu đã đính kèm file)..."
                    value={submitContent}
                    onChange={(e) => setSubmitContent(e.target.value)}
                    disabled={submitting}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Đính kèm file</label>
                    <input
                      type="file"
                      multiple
                      className="input-field text-sm"
                      onChange={(e) =>
                        setStudentFiles(e.target.files ? Array.from(e.target.files) : [])
                      }
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối đa 10MB mỗi file. Cần có nội dung hoặc ít nhất một file.
                    </p>
                    {studentFiles.length > 0 && (
                      <ul className="text-xs text-gray-600 mt-2 list-disc list-inside">
                        {studentFiles.map((f) => (
                          <li key={f.name + f.size}>{f.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Đang gửi...' : 'Nộp bài'}
                  </button>
                </form>
              )}
            </div>
          )}

          {!isTeacher && !hasSubmitted && isOverdue && (
            <div className="card bg-amber-50 border-amber-200 text-amber-900">Đã quá hạn nộp bài.</div>
          )}
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Sửa bài tập</h3>
            <div className="space-y-3">
              <input
                className="input-field"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Tiêu đề"
              />
              <textarea
                className="input-field h-24 resize-none"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Mô tả"
              />
              <input
                type="datetime-local"
                className="input-field"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" className="btn-secondary" onClick={() => setShowEdit(false)}>
                Hủy
              </button>
              <button type="button" className="btn-primary" disabled={saving} onClick={handleUpdate}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDetailsModal && modalSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Chi tiết bài nộp - Người dùng {modalSubmission.userId}</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {modalSubmission.details.map((d) => {
                const q = assignment?.questions?.[d.questionIndex];
                const studentAnsRaw = d.studentAnswer;
                const selectedIndex = getSelectedIndex(studentAnsRaw, q);
                const correctIndex = q && Array.isArray(q.choices) ? q.choices.findIndex((c) => String(c.text).trim() === String(d.expectedAnswer).trim()) : -1;
                const studentIsCorrect = selectedIndex >= 0 && selectedIndex === correctIndex;
                return (
                  <div key={d.questionIndex} className="p-3 border rounded">
                    <div className="font-semibold">{d.questionText || `Câu ${d.questionIndex + 1}`}</div>
                    <div className="text-sm mt-2">
                      {q && Array.isArray(q.choices) && q.choices.length > 0 ? (
                        <>
                        <ul className="space-y-2 mt-2">
                          {q.choices.map((ch, ci) => {
                            const isCorrect = ci === correctIndex;
                            const isSelected = ci === selectedIndex;
                            const letter = String.fromCodePoint(65 + ci);
                            let circleClass = 'bg-gray-100 text-gray-600';
                            let choiceBg = '';
                            const studentIsCorrect = selectedIndex >= 0 && selectedIndex === correctIndex;
                            if (studentIsCorrect) {
                              if (isSelected) {
                                circleClass = 'bg-green-100 text-green-800';
                                choiceBg = 'bg-green-50';
                              }
                            } else if (isCorrect) {
                              circleClass = 'bg-green-100 text-green-800';
                              choiceBg = 'bg-green-50';
                            } else if (isSelected) {
                              circleClass = 'bg-red-100 text-red-800';
                              choiceBg = 'bg-red-50';
                            }
                            return (
                              <li key={ci} className={`flex items-start gap-3 py-1 px-2 rounded ${choiceBg}`}>
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${circleClass}`}>
                                  {letter}
                                </div>
                                <div className={isSelected ? 'font-semibold' : ''}>{ch.text}</div>
                              </li>
                            );
                          })}
                        </ul>
                        {console.debug && console.debug('modalDetail', d.questionIndex, 'studentAns', d.studentAnswer, 'selectedIndex', selectedIndex, 'correctIndex', correctIndex)}
                        </>
                      ) : (
                        <div>
                          <div>
                            <span className="font-medium">Nộp:</span>{' '}
                            <span className={d.correct ? 'text-green-700' : 'text-red-600'}>{d.studentAnswer ?? '—'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Đáp án:</span> {d.expectedAnswer ?? '—'}
                          </div>
                        </div>
                      )}
                      <div className="mt-2">
                        {q && Array.isArray(q.choices) && q.choices.length > 0 && !studentIsCorrect && (
                          (() => {
                            const correctLetter = correctIndex >= 0 ? String.fromCodePoint(65 + correctIndex) : null;
                            return correctLetter ? (
                              <div className="text-sm text-green-700 font-medium">Đáp án đúng: {correctLetter}</div>
                            ) : null;
                          })()
                        )}
                        <div className="text-xs text-gray-500 mt-1">Câu #{d.questionIndex + 1}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <button type="button" className="btn-secondary mr-2" onClick={() => { setShowDetailsModal(false); setModalSubmission(null); }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
