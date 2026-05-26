/** Phản hồi ApiResponse Spring: { message, data } */
export function unwrapApiData(res) {
  const body = res?.data;
  if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'data')) {
    return body.data;
  }
  return body;
}

export function unwrapApiMessage(res) {
  return res?.data?.message;
}

/** So sánh id user từ API (string/number) an toàn. */
export function sameUserId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

/** Tải blob từ axios (đã có Authorization) và kích hoạt download trình duyệt. */
export function saveBlobAsFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  a.click();
  URL.revokeObjectURL(url);
}

/** Chuẩn hoá contest từ API (camelCase / snake_case) — đặc biệt imageUrl cho câu hỏi. */
export function normalizeContestDetail(contest) {
  if (!contest || typeof contest !== 'object') return contest;
  const probs = contest.problems;
  if (!Array.isArray(probs)) return contest;
  return {
    ...contest,
    problems: probs.map((p) => {
      const rawUrl = p.imageUrl ?? p.image_url ?? p.imageURL;
      let imageUrl =
        rawUrl != null && String(rawUrl).trim() !== '' ? String(rawUrl).trim() : undefined;
      if (imageUrl && !/^https?:\/\//i.test(imageUrl) && imageUrl.startsWith('//')) {
        imageUrl = `${typeof window !== 'undefined' ? window.location.protocol : 'https:'}${imageUrl}`;
      }
      const hasUploadedImage = !!(p.hasUploadedImage ?? p.has_uploaded_image);
      return {
        ...p,
        imageUrl,
        hasUploadedImage,
        orderIndex: p.orderIndex ?? p.order_index ?? 0,
        maxScore: p.maxScore ?? p.max_score,
      };
    }),
  };
}

/** GET /contests/:id/me — snake_case từ một số cấu hình server */
export function normalizeContestMyStats(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const ids = raw.solvedProblemIds ?? raw.solved_problem_ids;
  return {
    ...raw,
    solvedProblemIds: Array.isArray(ids) ? ids.map(Number) : [],
    totalScore: raw.totalScore ?? raw.total_score ?? 0,
    totalProblems: raw.totalProblems ?? raw.total_problems ?? 0,
    problemsAnswered: raw.problemsAnswered ?? raw.problems_answered ?? 0,
    rank: raw.rank != null ? raw.rank : null,
  };
}
