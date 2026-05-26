import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lessonAPI, vocabularyAPI } from '../services/index';
import Layout from '../components/Layout';

const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8080';

const getWordLabel = (vocab) => vocab?.word || vocab?.english || 'N/A';
const getMeaningLabel = (vocab) => vocab?.meaning || vocab?.vietnamese || 'N/A';
const getAudioPath = (vocab) => vocab?.audio_path || vocab?.audioPath || '';
const getImagePath = (vocab) => vocab?.image_path || vocab?.imagePath || '';

const mapSearchResultToLessonPayload = (item) => ({
  word: item?.word || item?.term || item?.vocabulary || item?.english || '',
  meaning: item?.meaning || item?.definition || item?.vietnamese || '',
  pronunciation: item?.pronunciation || '',
  example: item?.example || '',
  audio_path: item?.audio_path || item?.audioPath || '',
  image_path: item?.image_path || item?.imagePath || '',
  pos: item?.pos || item?.partOfSpeech || '',
});

const buildMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${MEDIA_BASE_URL}${normalizedPath}`;
};

export default function LessonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [vocabularies, setVocabularies] = useState([]);
  const [selectedVocabId, setSelectedVocabId] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVocab, setEditingVocab] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingSearchWord, setAddingSearchWord] = useState(null);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    pronunciation: '',
    example: '',
  });

  // Fetch vocabularies
  const fetchLessonDetail = useCallback(async () => {
    try {
      setLoading(true);
      const [lessonResponse, vocabResponse] = await Promise.all([
        lessonAPI.get(id),
        lessonAPI.getVocabularies(id),
      ]);
      const lessonData = lessonResponse.data || null;
      const items = vocabResponse.data || [];
      setLesson(lessonData);
      setVocabularies(items);
      setSelectedVocabId((prevId) => {
        if (items.length === 0) return null;
        const selectedStillExists = items.some((item) => item.id === prevId);
        return selectedStillExists ? prevId : items[0].id;
      });
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Lỗi tải từ vựng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLessonDetail();
  }, [fetchLessonDetail]);

  useEffect(() => {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await vocabularyAPI.search(keyword);
        setSearchResults(response.data || []);
      } catch (err) {
        console.error('Search vocab error:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Add vocabulary
  const handleAddVocab = async () => {
    if (!formData.word.trim() || !formData.meaning.trim()) {
      alert('Vui lòng điền từ vựng và nghĩa');
      return;
    }

    try {
      await lessonAPI.addVocabulary(id, formData);
      setShowAddModal(false);
      setFormData({ word: '', meaning: '', pronunciation: '', example: '' });
      await fetchLessonDetail();
    } catch (err) {
      alert('Lỗi thêm từ vựng: ' + (err.response?.data?.message || err.message));
    }
  };

  // Update vocabulary
  const handleUpdateVocab = async () => {
    if (!formData.word.trim() || !formData.meaning.trim()) {
      alert('Vui lòng điền từ vựng và nghĩa');
      return;
    }

    try {
      await lessonAPI.updateVocabulary(id, editingVocab.id, formData);
      setShowEditModal(false);
      setEditingVocab(null);
      setFormData({ word: '', meaning: '', pronunciation: '', example: '' });
      await fetchLessonDetail();
    } catch (err) {
      alert('Lỗi cập nhật từ vựng: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete vocabulary
  const handleDeleteVocab = async (vocabId) => {
    try {
      await lessonAPI.deleteVocabulary(id, vocabId);
      setDeleteConfirm(null);
      await fetchLessonDetail();
    } catch (err) {
      alert('Lỗi xóa từ vựng: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open edit modal
  const openEditModal = (vocab) => {
    setEditingVocab(vocab);
    setFormData({
      word: vocab.word || vocab.english || '',
      meaning: vocab.meaning || vocab.vietnamese || '',
      pronunciation: vocab.pronunciation || '',
      example: vocab.example || '',
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ word: '', meaning: '', pronunciation: '', example: '' });
  };

  const isOwner = lesson?.ownerId != null && Number(lesson.ownerId) === Number(user?.userId);

  const handleDownloadLesson = async () => {
    try {
      setImporting(true);
      const response = await lessonAPI.download(id);
      const importedLesson = response.data;
      if (importedLesson?.id) {
        navigate(`/lesson/${importedLesson.id}`);
      } else {
        await fetchLessonDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Khong the tai bai hoc ve');
    } finally {
      setImporting(false);
    }
  };

  const handleSelectVocab = (vocabId) => {
    if (vocabId === selectedVocabId) return;
    setIsDetailVisible(false);
    setTimeout(() => {
      setSelectedVocabId(vocabId);
      setIsDetailVisible(true);
    }, 120);
  };

  const selectedVocab = vocabularies.find((item) => item.id === selectedVocabId) || null;

  const playAudio = () => {
    const audioPath = getAudioPath(selectedVocab);
    if (!audioPath) return;
    const audioUrl = buildMediaUrl(audioPath);
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      alert('Không thể phát audio cho từ này');
    });
  };

  const playSearchAudio = (audioPath) => {
    if (!audioPath) return;
    const audioUrl = buildMediaUrl(audioPath);
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      alert('Khong the phat audio cho tu nay');
    });
  };

  const handleAddFromSearch = async (item) => {
    const payload = mapSearchResultToLessonPayload(item);
    if (!payload.word || !payload.meaning) {
      alert('Tu duoc chon thieu du lieu word/meaning');
      return;
    }

    const wordKey = payload.word.toLowerCase();
    const exists = vocabularies.some((v) => getWordLabel(v).toLowerCase() === wordKey);
    if (exists) {
      alert('Tu nay da ton tai trong bai hoc');
      return;
    }

    try {
      setAddingSearchWord(wordKey);
      await lessonAPI.addVocabulary(id, payload);
      await fetchLessonDetail();
      setSearchKeyword('');
      setSearchResults([]);
    } catch (err) {
      alert('Loi them tu: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddingSearchWord(null);
    }
  };

  if (loading) return <Layout><div className="text-center p-8 h-96 flex items-center justify-center">Dang tai tu vung...</div></Layout>;

  return (
    <Layout hideFooter mainClassName="overflow-hidden">
      <div className="h-full bg-slate-100 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="h-full min-h-0 flex flex-col gap-4">
            <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl px-4 md:px-6 py-4 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                  
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Chi tiet bai hoc</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1">{vocabularies.length} tu vung</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/lessons')}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors font-medium"
                  >
                    Quay lai
                  </button>
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => {
                          resetForm();
                          setShowAddModal(true);
                        }}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Them tu vung
                      </button>
                      <button
                        onClick={() => navigate(`/quiz/${id}`)}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-semibold"
                      >
                        On tap
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleDownloadLesson}
                      disabled={importing}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 transition-colors font-semibold"
                    >
                      {importing ? 'Dang tai ve...' : 'Tai bai hoc ve'}
                    </button>
                  )}
                </div>
              </div>
            </header>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {vocabularies.length === 0 ? (
                <p className="text-center text-slate-500 py-16 text-lg">Chua co tu vung nao</p>
              ) : (
                <div className="h-full grid grid-cols-1 md:grid-cols-10">
                  <aside className="md:col-span-3 min-h-0 border-r border-slate-200 bg-slate-50/60 flex flex-col overflow-hidden">
                    <div className="px-4 py-4 border-b border-slate-200 bg-white">
                      <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Danh sach tu</h2>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2">
                      {vocabularies.map((vocab) => {
                        const isActive = vocab.id === selectedVocabId;
                        return (
                          <button
                            type="button"
                            key={vocab.id}
                            onClick={() => handleSelectVocab(vocab.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <span className="block truncate font-medium">{getWordLabel(vocab)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </aside>

                  <section className="md:col-span-7 p-5 md:p-8 bg-white overflow-y-auto">
                    {selectedVocab ? (
                      <div
                        className={`h-full flex flex-col transition-all duration-300 ${
                          isDetailVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        }`}
                      >
                        {isOwner && (
                          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Tim va them tu vung</p>
                            {searching && <span className="text-xs text-blue-600">Dang tim...</span>}
                          </div>

                          <div className="relative">
                            <input
                              type="text"
                              value={searchKeyword}
                              onChange={(e) => setSearchKeyword(e.target.value)}
                              placeholder="Go de tim tu vung toan he thong..."
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />

                            {searchKeyword.trim() && (
                              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-56 rounded-xl border border-slate-200 bg-white shadow-lg overflow-y-auto space-y-2 p-2 pr-1">
                                {searchResults.length > 0 && (
                                  searchResults.map((item, index) => {
                                    const itemWord = getWordLabel(item);
                                    const itemMeaning = getMeaningLabel(item);
                                    const itemAudio = getAudioPath(item);
                                    const itemImage = getImagePath(item);
                                    const adding = addingSearchWord === itemWord.toLowerCase();
                                    return (
                                      <div
                                        key={`${itemWord}-${index}`}
                                        className="rounded-xl border border-slate-200 bg-white p-3 flex items-start gap-3"
                                      >
                                        {itemImage ? (
                                          <img
                                            src={buildMediaUrl(itemImage)}
                                            alt={itemWord}
                                            className="w-14 h-14 rounded-lg border border-slate-200 object-cover shrink-0"
                                          />
                                        ) : (
                                          <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-100 shrink-0" />
                                        )}

                                        <div className="min-w-0 flex-1">
                                          <p className="font-semibold text-slate-900 truncate">{itemWord}</p>
                                          <p className="text-sm text-slate-600 truncate">{itemMeaning}</p>
                                          <div className="mt-2 flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => playSearchAudio(itemAudio)}
                                              disabled={!itemAudio}
                                              className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                                              title={itemAudio ? 'Phat audio' : 'Khong co audio'}
                                            >
                                              <span className="text-xs">🔊</span>
                                            </button>
                                            <span className="text-xs text-slate-500 truncate">{item.pronunciation ? `/${item.pronunciation}/` : 'No pronunciation'}</span>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleAddFromSearch(item)}
                                          disabled={adding}
                                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                          title="Them vao bai hoc"
                                        >
                                          {adding ? '...' : '+'}
                                        </button>
                                      </div>
                                    );
                                  })
                                )}

                                {!searching && searchResults.length === 0 && (
                                  <p className="text-sm text-slate-500 px-2 py-2">Khong tim thay tu phu hop.</p>
                                )}
                              </div>
                            )}
                          </div>
                          </div>
                        )}

                        <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                                {getWordLabel(selectedVocab)}
                              </h3>
                              <button
                                type="button"
                                onClick={playAudio}
                                disabled={!getAudioPath(selectedVocab)}
                                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                title={getAudioPath(selectedVocab) ? 'Phat audio' : 'Chua co audio'}
                              >
                                <span className="text-lg">🔊</span>
                              </button>
                            </div>

                            <p className="text-base md:text-lg text-blue-700 font-medium">
                              / {selectedVocab.pronunciation || 'N/A'} /
                            </p>
                          </div>

                          {getImagePath(selectedVocab) && (
                            <div className="shrink-0 md:w-[216px] lg:w-[240px] rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                              <img
                                src={buildMediaUrl(getImagePath(selectedVocab))}
                                alt={getWordLabel(selectedVocab)}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-[150px] md:h-[160px] object-cover scale-[1.06] origin-center"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Nghia</p>
                            <p className="text-xl font-semibold text-slate-900">{getMeaningLabel(selectedVocab)}</p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Vi du</p>
                            <p className="text-lg leading-relaxed text-slate-700 italic">
                              {selectedVocab.example || 'Chua co vi du cho tu nay.'}
                            </p>
                          </div>
                        </div>

                        {isOwner && (
                          <div className="mt-auto pt-6 flex flex-wrap gap-3">
                            <button
                              onClick={() => openEditModal(selectedVocab)}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors font-semibold"
                            >
                              Sua
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(selectedVocab.id)}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-semibold"
                            >
                              Xoa
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        Chon mot tu vung de xem chi tiet.
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <VocabularyModal
          mode={showAddModal ? 'add' : 'edit'}
          formData={formData}
          setFormData={setFormData}
          onSave={showAddModal ? handleAddVocab : handleUpdateVocab}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setEditingVocab(null);
            resetForm();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xóa từ vựng</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa từ vựng này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary py-2 px-6"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteVocab(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
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

function VocabularyModal({ mode, formData, setFormData, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          {mode === 'add' ? 'Thêm từ vựng mới' : 'Sửa từ vựng'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Từ vựng (English) *</label>
            <input
              type="text"
              placeholder="VD: Computer"
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Nghĩa (Tiếng Việt) *</label>
            <input
              type="text"
              placeholder="VD: Máy tính"
              value={formData.meaning}
              onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Phát âm</label>
            <input
              type="text"
              placeholder="VD: kəm-ˈpjü-tər"
              value={formData.pronunciation}
              onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Ví dụ</label>
            <textarea
              placeholder="VD: I use a computer every day"
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none h-20"
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-secondary py-2 px-6"
          >
            Hủy
          </button>
          <button
            onClick={onSave}
            className="btn-primary py-2 px-6"
          >
            {mode === 'add' ? 'Thêm' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
