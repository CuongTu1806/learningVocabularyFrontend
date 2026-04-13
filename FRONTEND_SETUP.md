# Learning Vocabulary Platform - Frontend Setup

**Ngày tạo:** 04/04/2026  
**Phiên bản Node.js:** Từ `D:\Program Files\node.exe` (Node.js global)  
**Package Manager:** npm từ `D:\Program Files\npm.cmd`

---

## 📦 Phiên bản Dependencies

### Main Dependencies
```
react                 ^19.2.4      - React framework
react-dom             ^19.2.4      - React DOM rendering
react-router-dom      ^6.20.0      - Client-side routing
axios                 ^1.6.2       - HTTP client for API calls
@tanstack/react-query ^5.28.0      - Server state management
```

### Dev Dependencies
```
vite                           ^8.0.1       - Build tool & dev server
@vitejs/plugin-react           ^6.0.1       - Vite plugin for React
@types/react                   ^19.2.14     - React TypeScript types
@types/react-dom               ^19.2.3      - React DOM TypeScript types
eslint                         ^9.39.4      - Code linter
eslint-plugin-react-hooks      ^7.0.1       - ESLint plugin for React Hooks
eslint-plugin-react-refresh    ^0.5.2       - ESLint plugin for React Refresh
@eslint/js                     ^9.39.4      - ESLint JavaScript config
globals                        ^17.4.0      - Global variable definitions
```

---

## 🚀 Cách Chạy

### 1. **Cài đặt Dependencies**
```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyFrontend
& 'D:\Program Files\npm.cmd' install
```

> **Lưu ý:** Nếu nhận được câu hỏi "Ok to proceed? (y)", hãy nhập `y` và nhấn Enter.

### 2. **Chạy Development Server**

**Terminal 1 - Backend (Spring Boot):**
```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyPlatform
.\mvnw spring-boot:run
```
Backend sẽ chạy tại `http://localhost:8080`

**Terminal 2 - Frontend (React + Vite):**
```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyFrontend
& 'D:\Program Files\npm.cmd' run dev
```
Frontend sẽ chạy tại `http://localhost:5173`

### 3. **Build for Production**
```powershell
& 'D:\Program Files\npm.cmd' run build
```
Output sẽ được tạo trong thư mục `dist/`

### 4. **Preview Production Build**
```powershell
& 'D:\Program Files\npm.cmd' run preview
```

### 5. **Lint Code**
```powershell
& 'D:\Program Files\npm.cmd' run lint
```

---

## 🏗️ Cấu trúc Thư Mục

```
learningVocabularyFrontend/
├── src/
│   ├── components/        # React components (UI)
│   ├── pages/            # Page components (routes)
│   ├── services/         # API services (axios calls)
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React Context (global state)
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main App component
│   ├── App.css           # App global styles
│   ├── main.jsx          # React entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies & scripts
├── vite.config.js        # Vite configuration
├── eslint.config.js      # ESLint configuration
├── .env                  # Environment variables
├── .gitignore            # Git ignore rules
└── README.md             # Vite default README
```

---

## ⚙️ Cấu hình Backend Integration

### Environment Variables (`.env`)
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Learning Vocabulary Platform
```

### Vite Proxy Configuration
```javascript
// vite.config.js
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    }
  }
}
```

**Ưu điểm Proxy:**
- FE gọi `/api/...` sẽ tự động forward tới `http://localhost:8080/api/...`
- Tránh CORS issues trong dev

### Axios Configuration
```javascript
// src/services/api.js (TẠO MỚI)
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

// Auto set Authorization header từ localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 🔐 Authentication Flow

### Endpoints Backend (sẵn có)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký user mới |
| POST | `/api/auth/login` | Đăng nhập (trả JWT) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Đăng xuất |
| POST | `/api/auth/change-password` | Đổi mật khẩu |

### Token Storage
```javascript
// Sau khi login, lưu token vào localStorage
localStorage.setItem('authToken', response.data.token);

// Khi logout, xóa token
localStorage.removeItem('authToken');
```

---

## 📋 Backend API Endpoints (Available)

Tham khảo từ Spring Boot backend:

| Controller | Endpoints |
|-----------|-----------|
| **Auth** | `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/change-password` |
| **Lessons** | `/api/lessons` (GET/POST), `/api/lessons/{id}/vocabularies` |
| **Quiz** | `/api/quiz/{lessonId}` (POST), `/api/quiz/submit`, `/api/quiz/history` |
| **Spaced Repetition** | `/api/spaced_repetition/start/{id}`, `/api/spaced_repetition/answer`, `/api/spaced_repetition/due` |
| **Classes** | `/api/classes/{id}`, `/api/classes/{id}/members`, `/api/classes/{id}/join` |
| **Vocabulary** | `/api/vocabulary/search` |

---

## 🎯 Next Steps

1. ✅ Cài dependencies: `npm install`
2. ✅ Tạo axios client: `src/services/api.js`
3. ✅ Tạo AuthContext: `src/contexts/AuthContext.jsx`
4. ✅ Tạo Router setup: `src/App.jsx`
5. ✅ Tạo trang Login: `src/pages/Login.jsx`
6. ✅ Tạo trang Dashboard: `src/pages/Dashboard.jsx`
7. ✅ Tạo các components: Lesson list, Quiz, Spaced Repetition

---

## 🐛 Troubleshooting

### Error: `npm command not found`
```powershell
# Thêm Node.js vào PATH trong terminal hiện tại
$env:Path += ";D:\Program Files"

# Hoặc dùng full path
& 'D:\Program Files\npm.cmd' install
```

### Error: `VITE_API_BASE_URL not working`
- Đảm bảo file `.env` tồn tại trong root folder
- Restart dev server sau khi thay đổi `.env`
- Truy cập via `import.meta.env.VITE_API_BASE_URL`

### CORS errors từ Backend
- Backend cần enable CORS cho `http://localhost:5173`
- Hoặc sử dụng Vite proxy (đã cấu hình)

### Port 5173 đã được sử dụng
```powershell
# Tìm process dùng port 5173
netstat -ano | findstr :5173

# Kill process (eg: PID 1234)
taskkill /PID 1234 /F

# Hoặc chọn port khác trong vite.config.js
server: {
  port: 5174  // Port khác
}
```

---

## 📝 Ghi chú

- **Vite Dev Server** tự động reload khi file thay đổi (HMR)
- **React Router** cho multi-page navigation
- **React Query** cho caching/prefetching API data
- **Axios** tự động gắn Bearer token vào mọi request
- **ESLint** giúp kiểm tra code quality

---

**Hãy bắt đầu bằng cách chạy:**
```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyFrontend
& 'D:\Program Files\npm.cmd' install
& 'D:\Program Files\npm.cmd' run dev
```

Rồi truy cập `http://localhost:5173` trong browser! 🎉
