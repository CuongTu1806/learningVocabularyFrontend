# 🔄 Space Repetition - Hướng Dẫn Sử Dụng

## Tổng Quan
FrontEnd Spaced Repetition đã được hoàn chỉnh với 3 trang chính:
- **Trang Ôn tập**: Hiển thị lịch và thống kê
- **Trang Flashcard**: Chơi flashcard với 4 mức đánh giá (Again/Hard/Good/Easy)
- **Trang Cài đặt**: Tuỳ chỉnh thuật toán SM-2

## 📋 Các Trang Được Tạo

### 1. SpacedRepetitionPage (`/spaced-repetition`)
**Vị trí file:** `src/pages/SpacedRepetitionPage.jsx`

**Tính năng:**
- 📊 **Daily Summary**: Hiển thị 3 card với thống kê:
  - Cần học (Learning): Những card mới hoặc đang trong learning phase
  - Cần ôn (Review): Những card cần ôn tập theo SM-2
  - Tổng cộng: Tất cả card cần làm hôm nay
- 📅 **Monthly Calendar**: 
  - Hiển thị lịch 1 tháng
  - Mỗi ngày có số lượng card cần ôn (nếu > 0)
  - Highlight ngày có card
- ▶️ **Start Button**: Bắt đầu session ôn tập (disabled nếu không có card)
- ⚙️ **Settings Link**: Vào trang cài đặt

**API được sử dụng:**
```javascript
spacedRepetitionAPI.getSummary()     // GET /api/spaced_repetition/summary
spacedRepetitionAPI.getCalendar(year, month)  // GET /api/spaced_repetition/calendar?year=2026&month=4
```

---

### 2. ReviewFlashcardPage (`/review-flashcard`)
**Vị trí file:** `src/pages/ReviewFlashcardPage.jsx`

**Tính năng:**
- 🎴 **Flashcard Display**:
  - Mặt trước: Từ vựng (word)
  - Mặt sau: Ý nghĩa (meaning)
  - Click để lật card
- 📊 **Card Thông tin** (khi lật):
  - Bước học (Learning Step)
  - Trạng thái (State: new/learning/review/relearning)
  - Interval hiện tại (ngày)
  - Ease Factor (hệ số dễ nhớ)
- ⭐ **4 Nút Đánh giá** (hiển thị khi lật card):
  - 🔴 **Again** (q=0): Quên ngay, quay lại bước 1
  - 🟠 **Hard** (q=3): Khó, tăng interval 1.2x
  - 🟢 **Good** (q=4): Bình thường, tăng interval × EF
  - ✅ **Easy** (q=5): Dễ, tăng interval × EF × 1.3
- ⏳ **Progress Bar**: Hiển thị tiến độ (X/total)

**Flow:**
1. Tải danh sách card có due ngày hôm nay
2. Hiển thị card đầu tiên
3. User nhấn rating button
4. Ghi lại rating vào backend
5. Chuyển sang card tiếp theo
6. Khi hết, hiển thị completion message

**API được sử dụng:**
```javascript
spacedRepetitionAPI.getDue(limit = 20)  // GET /api/spaced_repetition/due?limit=20
spacedRepetitionAPI.answer(data)        // POST /api/spaced_repetition/answer
// data = { userVocabularyId, rating }
// rating = "again" | "hard" | "good" | "easy"
```

---

### 3. ReviewSettingsPage (`/review-settings`)
**Vị trí file:** `src/pages/ReviewSettingsPage.jsx`

**Tính năng:**
- ⏱️ **Learning Steps**: Khoảng thời gian giữa các lần ôn cho card mới
  - Mặc định: "1m, 10m, 30m, 1h"
- 📅 **Max Interval Days**: Khoảng cách tối đa (ngày)
  - Mặc định: 36500 (≈100 năm)
- ✨ **Easy Bonus**: Nhân với interval khi rating "Easy"
  - Mặc định: 1.3 (tăng 30%)
- ⏱️ **Delay Factor**: Hệ số phạt khi ôn trễ hạn
  - Mặc định: 0.05

**API được sử dụng:**
```javascript
spacedRepetitionAPI.getSettings()        // GET /api/spaced_repetition/settings
spacedRepetitionAPI.updateSettings(data) // PUT /api/spaced_repetition/settings
```

---

## 🔗 Navigation

### Header (tên: `Header.jsx`)
- Có link "🔄 Ôn tập" → `/spaced-repetition`

### Dashboard (tên: `Dashboard.jsx`)
- 3 quick action cards:
  1. 📖 Bài học → `/lessons`
  2. 🎮 Luyện tập → `/lessons` (để chọn bài, rồi chọn mode quiz)
  3. 🔄 Ôn tập → `/spaced-repetition`

### Routing (trong `App.jsx`)
```javascript
<Route path="/spaced-repetition" element={<SpacedRepetitionPage />} />
<Route path="/review-flashcard" element={<ReviewFlashcardPage />} />
<Route path="/review-settings" element={<ReviewSettingsPage />} />
```

---

## 🧪 Hướng Dẫn Test

### 1️⃣ **Backend Preparation**
```bash
# Ensure backend is running on http://localhost:8080
cd d:\HT\ki2_4\TTCS\learningVocabularyPlatform
mvn spring-boot:run
# OR
./mvnw spring-boot:run
```

### 2️⃣ **Frontend Start**
```bash
cd d:\HT\ki2_4\TTCS\learningVocabularyFrontend
npm run dev
# Access at http://localhost:5173 (or shown port)
```

### 3️⃣ **Test Flow**

**A. Login**
- Đăng nhập dengan credentials từ backend

**B. Dashboard**
- Click "🔄 Ôn tập" card → Chuyển đến SpacedRepetitionPage

**C. Spaced Repetition Main Page**
- Xem Daily Summary (3 cards):
  - ✅ Learning: số card đang learn
  - ✅ Review: số card cần review
  - ✅ Total: tổng cộng
- Xem Calendar:
  - 📅 Highlight những ngày có card (nếu có)
  - Ghi số card mỗi ngày
- Click "▶️ Bắt đầu ôn tập" → Vào ReviewFlashcardPage

**D. Flashcard Player**
- Card 1/12 đặc trưu:
  - Hiển thị từ vựng (ví dụ: "apple")
  - Click → Lật xem ý nghĩa ("quả táo")
  - Hiển thị thông tin card
- Choose rating (Again/Hard/Good/Easy)
  - Backend nhận yêu cầu → Calculate EF, interval mới → Save → Return updated card
- Tiếp tục với card tiếp theo
- Sau card cuối → Completion message

**E. Settings (Optional)**
- Click ⚙️ "Cài đặt Spaced Repetition"
- Modify learning steps, max interval, etc.
- Click "💾 Lưu cài đặt"
- Xem current settings ở dưới

---

## 📊 Backend Data Seed

File `seed_review_schedule_due_test.sql` tạo sẵn:
- **12 cards due TODAY** (user_vocabulary_id: 14-25)
- **5 cards due TOMORROW** (user_vocabulary_id: 26-30)
- All in "review" state
- Various interval_days & ease_factor

Dữ liệu này giúp test ngay mà không phải tạo flashcard mới.

---

## 🐛 Debugging Tips

### Issue: "No due cards"
- ✅ Kiểm tra backend có chạy `seed_review_schedule_due_test.sql`?
- ✅ Check database: `SELECT COUNT(*) FROM review_schedule WHERE next_review_date <= NOW()`

### Issue: Rating không gửi được
- 🔍 Check browser console (F12 → Console)
- 🔍 Check Network tab → xem request POST `/api/spaced_repetition/answer`
- ✅ Ensure Bearer token sent in Authorization header

### Issue: Calendar không hiển thị
- 🔍 Check Network → GET `/api/spaced_repetition/calendar?year=2026&month=4`
- ✅ Verify response contains `[{date: "YYYY-MM-DD", dueCount: N}, ...]`

---

## 📝 Files Modified/Created

### Created Files:
```
src/pages/SpacedRepetitionPage.jsx
src/pages/ReviewFlashcardPage.jsx
src/pages/ReviewSettingsPage.jsx
```

### Modified Files:
```
src/App.jsx                 (added 3 routes + imports)
src/components/Header.jsx   (added link)
src/pages/Dashboard.jsx     (updated quick actions)
src/services/index.js       (updated spacedRepetitionAPI)
```

---

## ✨ Backend SM-2 Algorithm Implementation

**Backend Logic** (ReviewScheduleService):
1. Get card with `next_review_date <= NOW()`
2. When user rates (again/hard/good/easy):
   - Calculate new Ease Factor:
     ```
     EF_new = EF_old + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
     ```
   - Calculate new Interval:
     - again (q=0): `I_new = I_old / 10`
     - hard (q=3): `I_new = I_old * 1.2`
     - good (q=4): `I_new = I_old * EF`
     - easy (q=5): `I_new = I_old * EF * 1.3` (easy bonus)
   - Update `due = now + I_new days`
   - Save history (rating, EF_old/EF_new, I_old/I_new)
   - Update card state if needed

---

**Tất cả tính năng đã sẵn sàng! 🎉**
