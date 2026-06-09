# Learning Vocabulary Platform — Frontend

Giao diện web cho nền tảng học từ vựng: dashboard, bài học, quiz, ôn Spaced Repetition, profile thống kê, lớp học và contest.

> **Backend (Spring Boot API):** [learningVocabularyPlatform](https://github.com/CuongTu1806/learningVocabularyPlatform)  
> Repo này chỉ chứa **frontend**. API, database và media server nằm ở repo backend.

---

## Tính năng (UI)

- Đăng nhập / đăng ký (JWT)
- **Dashboard**: tìm từ vựng (gợi ý + popup audio/ảnh), bảng xếp hạng
- **Bài học**: thư viện bài, chi tiết từ, thêm từ từ từ điển hệ thống
- **Quiz**: nhiều chế độ, lịch sử và chi tiết kết quả
- **Ôn tập**: Spaced Repetition, flashcard, cài đặt ôn
- **Hồ sơ**: thống kê (reviews, thời gian, phân loại thẻ, ease, khoảng ôn, từ mới)
- **Lớp học**, **bài tập**, **contest**

---

## Tech stack

- **React 19** + **Vite 8**
- **React Router 6**
- **Axios**
- **Tailwind CSS 4**
- **Recharts**

---

## Yêu cầu

- **Node.js 18+** (khuyến nghị LTS)
- **npm 9+**
- Backend chạy tại `http://localhost:8080` (hoặc URL trong `.env`)

---

## Cài đặt & chạy

### 1. Clone & cài dependency

```bash
git clone https://github.com/CuongTu1806/learningVocabularyFrontend.git
cd learningVocabularyFrontend
npm install
```

### 2. Cấu hình môi trường (tuỳ chọn)

Mặc định dev dùng proxy Vite: mọi request `/api` → `http://localhost:8080`. **Không cần `.env`** nếu backend chạy local cổng 8080.

Nếu backend ở URL khác, tạo `.env`:

```env
VITE_API_BASE_URL=http://your-host:8080/api
VITE_MEDIA_BASE_URL=http://your-host:8080
```

`VITE_MEDIA_BASE_URL`: base URL phát audio/ảnh (`/mediaFull/...`).

### 3. Chạy dev

```bash
npm run dev
```

Mở **http://localhost:5173** (hoặc cổng Vite in ra terminal).

### 4. Build production

```bash
npm run build
npm run preview
```

---

## Chạy full stack (với Backend)

```bash
# Terminal 1 — backend
git clone https://github.com/CuongTu1806/learningVocabularyPlatform.git
cd learningVocabularyPlatform
# cấu hình MySQL, rồi:
mvn spring-boot:run

# Terminal 2 — frontend (repo này)
npm run dev
```

Chi tiết cấu hình DB, JWT, media: xem README backend.

---

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server + HMR |
| `npm run build` | Build `dist/` |
| `npm run preview` | Xem bản build local |
| `npm run lint` | ESLint |

---

## Cấu trúc (rút gọn)

```
src/
  pages/          # Màn hình (Dashboard, Lessons, Quiz, Profile, …)
  components/     # Layout, Header, biểu đồ profile
  contexts/       # AuthContext
  services/       # Gọi API (axios)
```

---

## Sự cố thường gặp

**API / đăng nhập lỗi**

- Kiểm tra backend đã chạy (`http://localhost:8080`).
- Kiểm tra `VITE_API_BASE_URL` nếu dùng `.env`.

**Audio/ảnh không load**

- Đặt `VITE_MEDIA_BASE_URL=http://localhost:8080`.
- Đảm bảo backend map đúng thư mục `mediaFull` (`app.media.root`).

**Cổng 5173 bận**

```bash
npm run dev -- --port 5174
```

---

## Liên kết

| Thành phần | Repository |
|------------|------------|
| **Frontend (repo này)** | https://github.com/CuongTu1806/learningVocabularyFrontend |
| **Backend** | https://github.com/CuongTu1806/learningVocabularyPlatform |

---

## License

Dự án học tập / đồ án — tuỳ chỉnh license khi public repo.
