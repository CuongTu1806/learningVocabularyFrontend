import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { classAPI, assignmentAPI } from '../services/index';
import { unwrapApiData } from '../utils/apiHelpers';
import { useAuth } from '../contexts/AuthContext';

function renderBoardCommentText(text) {
  return text.split(/(\s+)/).map((part, index) => {
    if (/^[+@][^\s]+$/.test(part)) {
      return (
        <span key={`${part}-${index}`} className="text-blue-700 underline underline-offset-2 font-medium">
          {part}
        </span>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}
export default function ClassroomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('board'); // 'board' | 'assignments' | 'members'
  const [assignments, setAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [boardPosts, setBoardPosts] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [showCreateNotice, setShowCreateNotice] = useState(false);
  const [noticeText, setNoticeText] = useState('');
  const [expandedPosts, setExpandedPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processingApprove, setProcessingApprove] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resClass, resMem] = await Promise.all([classAPI.get(id), classAPI.getMembers(id)]);
      const dataClass = unwrapApiData(resClass);
      const dataMem = unwrapApiData(resMem);
      if (!dataClass) {
        setError(resClass?.data?.message || 'Không tải được lớp học');
        setClassroom(null);
        setMembers([]);
        return;
      }
      setClassroom(dataClass);
      setMembers(Array.isArray(dataMem) ? dataMem : []);
      try {
        setBoardLoading(true);
        setBoardError('');
        const resBoard = await classAPI.getBoard(id);
        const dataBoard = unwrapApiData(resBoard);
        setBoardPosts(Array.isArray(dataBoard) ? dataBoard : []);
      } catch (e) {
        console.error(e);
        setBoardPosts([]);
        setBoardError(e.response?.data?.message || e.message || 'Không tải được bảng tin');
      } finally {
        setBoardLoading(false);
      }
      // load pending join requests
      try {
        const resPending = await classAPI.getPendingMembers(id);
        const dataPending = unwrapApiData(resPending);
        setPendingRequests(Array.isArray(dataPending) ? dataPending : []);
      } catch (e) {
        console.error(e);
        setPendingRequests([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải dữ liệu');
      setClassroom(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    // load assignments initially for board view
    const loadAssignments = async () => {
      try {
        setAssignLoading(true);
        const res = await assignmentAPI.list(Number(id));
        const data = unwrapApiData(res);
        setAssignments(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setAssignments([]);
      } finally {
        setAssignLoading(false);
      }
    };
    loadAssignments();
  }, [load]);

  const handleRemoveMember = async (userId) => {
    if (!globalThis.confirm('Xóa thành viên này khỏi lớp?')) return;
    try {
      await classAPI.removeMember(id, userId);
      setActionMsg('Đã xóa thành viên');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleLeave = async () => {
    if (!globalThis.confirm('Bạn có chắc muốn rời lớp?')) return;
    try {
      await classAPI.leave(id);
      navigate('/classes');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const loadPending = async () => {
    try {
      const res = await classAPI.getPendingMembers(id);
      const data = unwrapApiData(res);
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPendingRequests([]);
    }
  };

  const handleApprove = async (userId) => {
    if (!globalThis.confirm('Duyệt yêu cầu tham gia của người này?')) return;
    try {
      setProcessingApprove(true);
      await classAPI.approveMember(id, userId);
      setActionMsg('Đã duyệt thành viên');
      await load();
      await loadPending();
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Lỗi khi duyệt');
    } finally {
      setProcessingApprove(false);
    }
  };

  const handleReject = async (userId) => {
    if (!globalThis.confirm('Từ chối yêu cầu tham gia của người này?')) return;
    try {
      setProcessingApprove(true);
      await classAPI.rejectMember(id, userId);
      setActionMsg('Đã từ chối yêu cầu');
      await loadPending();
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Lỗi khi từ chối');
    } finally {
      setProcessingApprove(false);
    }
  };

  const handleCreateNotice = async () => {
    const text = noticeText.trim();
    if (!text) {
      alert('Nhập nội dung thông báo');
      return;
    }
    try {
      await classAPI.createBoardPost(id, { content: text });
      setNoticeText('');
      setShowCreateNotice(false);
      const resBoard = await classAPI.getBoard(id);
      const dataBoard = unwrapApiData(resBoard);
      setBoardPosts(Array.isArray(dataBoard) ? dataBoard : []);
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Không tạo được thông báo');
    }
  };

  const togglePostExpanded = (postId) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const addPostComment = async (postId, text) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    try {
      await classAPI.addBoardComment(id, postId, { content: cleaned });
      const resBoard = await classAPI.getBoard(id);
      const dataBoard = unwrapApiData(resBoard);
      setBoardPosts(Array.isArray(dataBoard) ? dataBoard : []);
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Không thêm được bình luận');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const uid = Number(inviteUserId);
    if (!uid || uid < 1) {
      alert('Nhập ID người dùng hợp lệ');
      return;
    }
    try {
      setInviting(true);
      setActionMsg('');
      await classAPI.invite(id, { userId: uid });
      setInviteUserId('');
      setShowInvite(false);
      setActionMsg('Đã mời thành công');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[40vh] text-gray-600">Đang tải...</div>
      </Layout>
    );
  }

  if (error || !classroom) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="card bg-red-50 border-red-200">
            <p className="text-red-700 font-semibold">{error || 'Không tìm thấy lớp'}</p>
            <button type="button" onClick={() => navigate('/classes')} className="btn-primary mt-4">
              Về danh sách lớp
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwner = classroom.currentUserIsOwner === true;

  let boardFeedList = null;
  if (boardLoading) {
    boardFeedList = <div className="card text-center py-10 text-gray-600">Đang tải bảng tin...</div>;
  } else if (boardError) {
    boardFeedList = <div className="card text-center py-10 text-red-600">{boardError}</div>;
  } else if (boardPosts.length === 0) {
    boardFeedList = <div className="card text-center py-10 text-gray-500">Chưa có thông báo nào trong lớp này.</div>;
  } else {
    boardFeedList = (
      <div className="space-y-4">
        {boardPosts.map((post) => {
          const expanded = expandedPosts[post.id] === true;
          const commentCount = post.commentCount ?? (post.comments || []).length;
          return (
            <div key={post.id} className="card bg-white border border-slate-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {(post.authorName || 'C').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{post.authorName || 'Người dùng'}</div>
                      <div className="text-xs text-gray-500">
                        {post.createdAt ? new Date(post.createdAt).toLocaleString('vi-VN') : '—'}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-gray-800 whitespace-pre-wrap leading-6">{post.content}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  type="button"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                  onClick={() => togglePostExpanded(post.id)}
                >
                  {expanded ? 'Ẩn bình luận' : `Hiện bình luận (${commentCount})`}
                </button>
                <span className="text-xs text-slate-500">{commentCount} bình luận</span>
              </div>

              {expanded && (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-blue-700 font-semibold text-sm hover:text-blue-900"
                    onClick={() => togglePostExpanded(post.id)}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs leading-none">
                      👥
                    </span>
                    {commentCount} nhận xét về lớp học
                  </button>

                  <div className="space-y-3 rounded-2xl bg-slate-50/80 border border-slate-200 p-4">
                    {(post.comments || []).length === 0 ? (
                      <div className="text-sm text-slate-500">Chưa có nhận xét nào.</div>
                    ) : (
                      (post.comments || []).map((c) => {
                        const authorInitial = (c.authorName || 'C').charAt(0);
                        return (
                          <div key={c.id} className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold shrink-0">
                              {authorInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-600 font-semibold">
                                {c.authorName || 'Người dùng'}
                                <span className="mx-1 text-slate-400">·</span>
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '—'}
                              </div>
                              <div className="mt-1 text-sm text-gray-800 leading-6 break-words">
                                {renderBoardCommentText(c.content || '')}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                      <div className="w-10 h-10 rounded-full bg-slate-500 text-white flex items-center justify-center font-semibold shrink-0">
                        {(user?.username || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 flex-1 rounded-full border border-slate-300 bg-white pl-4 pr-2 py-2 shadow-sm">
                        <input
                          id={`comment-${post.id}`}
                          type="text"
                          placeholder="Thêm nhận xét trong lớp học..."
                          className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-slate-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const text = e.target.value.trim();
                              if (!text) return;
                              addPostComment(post.id, text);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="w-9 h-9 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                          onClick={async () => {
                            const input = globalThis.document?.getElementById(`comment-${post.id}`);
                            if (!input) return;
                            const text = input.value.trim();
                            if (!text) return;
                            await addPostComment(post.id, text);
                            input.value = '';
                          }}
                          aria-label="Gửi bình luận"
                        >
                          ➤
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  let assignmentsGrid = null;
  if (assignLoading) {
    assignmentsGrid = <div className="text-center py-8 text-gray-600">Đang tải bài tập...</div>;
  } else if (assignments.length === 0) {
    assignmentsGrid = <div className="text-center py-8 text-gray-500">Chưa có bài tập trong lớp này.</div>;
  } else {
    assignmentsGrid = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignments.map((a) => (
          <div key={a.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gray-900">{a.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{a.description || '—'}</p>
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {a.dueDate ? new Date(a.dueDate).toLocaleString('vi-VN') : '—'}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">Tự động ghim lên bảng tin</span>
              <button
                type="button"
                onClick={() => navigate(`/assignments/${a.id}`)}
                className="btn-primary py-1 px-3 text-sm"
              >
                {isOwner ? 'Mở' : 'Làm bài'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-12 min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          <button
            type="button"
            onClick={() => navigate('/classes')}
            className="mb-6 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
          >
            ← Danh sách lớp
          </button>

          <div className="card mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
            <div className="flex flex-wrap justify-between gap-4 items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{classroom.name}</h1>
                <p className="text-gray-600">{classroom.description || 'Không có mô tả'}</p>
                <p className="text-sm text-gray-400 mt-3">Mã lớp: #{classroom.id}</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {isOwner && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 h-fit">
                    Chủ lớp
                  </span>
                )}
                {!isOwner && (
                  <button type="button" onClick={handleLeave} className="btn-secondary py-2 px-4 text-sm">
                    Rời lớp
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs: Board | Assignments | Members */}
          <div className="mt-4 mb-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('board')}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold ${tab === 'board' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                Bảng tin
              </button>
              <button
                type="button"
                onClick={() => setTab('assignments')}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold ${tab === 'assignments' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                Bài tập
              </button>
              <button
                type="button"
                onClick={() => setTab('members')}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold ${tab === 'members' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                Thành viên
              </button>
            </div>
          </div>

          {actionMsg && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm font-medium border border-green-200">
              {actionMsg}
            </div>
          )}

          {showApprovePanel && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Yêu cầu tham gia</h3>
                  <button type="button" onClick={() => setShowApprovePanel(false)} className="text-slate-500 hover:text-slate-800">Đóng</button>
                </div>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Không có yêu cầu mới.</div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((p) => (
                      <div key={p.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-semibold">{p.username || `User #${p.userId}`}</div>
                          <div className="text-xs text-gray-500">Yêu cầu lúc: {p.requestedAt ? new Date(p.requestedAt).toLocaleString('vi-VN') : '—'}</div>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" disabled={processingApprove} onClick={() => handleApprove(p.userId)} className="btn-primary py-1 px-3 text-sm">Duyệt</button>
                          <button type="button" disabled={processingApprove} onClick={() => handleReject(p.userId)} className="btn-secondary py-1 px-3 text-sm">Từ chối</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'board' && (
            <div className="space-y-6">
              <div className="card bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Bảng tin lớp học</h2>
                    <p className="text-sm text-gray-600 mt-1">Thông báo, trao đổi và bài tập được ghim tại một nơi.</p>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setShowCreateNotice(true)}
                      className="btn-primary py-2 px-4 text-sm"
                    >
                      Tạo thông báo
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">{boardFeedList}</div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Bài tập</h3>
                  <button
                    type="button"
                    onClick={() => setTab('assignments')}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Xem tất cả
                  </button>
                </div>
                {assignmentsGrid}
              </div>
            </div>
          )}

          {showCreateNotice && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Tạo thông báo</h3>
                  <button type="button" onClick={() => setShowCreateNotice(false)} className="text-slate-500 hover:text-slate-800">Đóng</button>
                </div>
                <textarea
                  className="input-field min-h-[140px] resize-y"
                  placeholder="Nhập nội dung thông báo..."
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" className="btn-secondary py-2 px-4" onClick={() => setShowCreateNotice(false)}>
                    Hủy
                  </button>
                  <button type="button" className="btn-primary py-2 px-4" onClick={handleCreateNotice}>
                    Đăng thông báo
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'assignments' && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Bài tập</h2>
                {isOwner && (
                  <button type="button" onClick={() => navigate(`/classes/${id}/assignments?create=1`)} className="btn-primary py-2 px-3 text-sm">
                    Giao bài
                  </button>
                )}
              </div>
              {assignmentsGrid}
            </div>
          )}

          {tab === 'members' && (
            <div className="card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800">Thành viên</h2>
                {isOwner && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowInvite(true)} className="btn-primary py-2 px-4 text-sm">
                      Mời thành viên
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await loadPending();
                        setShowApprovePanel(true);
                      }}
                      className="btn-secondary py-2 px-4 text-sm"
                    >
                      Duyệt thành viên
                    </button>
                  </div>
                )}
              </div>

              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa có thành viên (ngoài chủ lớp).</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-600">
                        <th className="py-3 pr-4">Người dùng</th>
                        <th className="py-3 pr-4">Vai trò</th>
                        <th className="py-3 pr-4">Tham gia</th>
                        {isOwner && <th className="py-3 text-right">Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => {
                        const displayName = m.username || m.user?.username || m.displayName || `User #${m.userId}`;
                        return (
                          <tr key={m.id} className="border-b border-gray-100">
                            <td className="py-3">{displayName}</td>
                            <td className="py-3">{m.role || '—'}</td>
                            <td className="py-3 text-gray-600">{m.joinedAt ? new Date(m.joinedAt).toLocaleString('vi-VN') : '—'}</td>
                            {isOwner && (
                              <td className="py-3 text-right">
                                <button type="button" onClick={() => handleRemoveMember(m.userId)} className="text-red-600 hover:underline text-sm font-semibold">Xóa</button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {showInvite && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Mời theo ID người dùng</h3>
                <p className="text-sm text-gray-600 mb-4">Nhập ID tài khoản (user id trong hệ thống).</p>
                <form onSubmit={handleInvite}>
                  <input
                    type="number"
                    min="1"
                    className="input-field mb-4"
                    placeholder="User ID"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    disabled={inviting}
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInvite(false);
                        setInviteUserId('');
                      }}
                      className="btn-secondary py-2 px-6"
                    >
                      Hủy
                    </button>
                    <button type="submit" disabled={inviting} className="btn-primary py-2 px-6">
                      {inviting ? 'Đang gửi...' : 'Mời'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
