# 🎯 Frontend Project Setup - Complete Summary

**Tạo lúc:** 04/04/2026  
**Trạng thái:** ✅ Sẵn sàng chạy

---

## 📋 Checklist - Các bước đã hoàn thành

- ✅ Tạo project React + Vite 5.0.8  
- ✅ Cài tất cả dependencies (npm install - 180 packages)
- ✅ Set up Vite config với proxy `/api` → `http://localhost:8080`
- ✅ Tạo axios client với auto Bearer token injection
- ✅ Tạo API services wrapper cho tất cả endpoints (auth, lesson, quiz, spaced-repetition, classes, vocabulary)
- ✅ Tạo AuthContext + useAuth hook cho global auth management
- ✅ Set up React Router với login/dashboard/protected routes
- ✅ Config environment variables (.env)
- ✅ Tạo file README chi tiết

---

## 📦 Dependencies Đã Cài

### Main Dependencies (phục vụ app)
```
react                 ^19.2.4       React framework
react-dom             ^19.2.4       React DOM rendering  
react-router-dom      ^6.20.0       Client-side routing
axios                 ^1.6.2        HTTP client API calls
@tanstack/react-query ^5.28.0       Server state management
```

### Dev Dependencies (phục vụ compile/lint)
```
vite                           ^8.0.1       Build tool & dev server
@vitejs/plugin-react           ^6.0.1       React plugin for Vite
eslint                         ^9.39.4      Code linter
@types/react                   ^19.2.14     TypeScript types  
@types/react-dom               ^19.2.3      TypeScript types
```

**Total:** 180 packages installed ✅ (0 vulnerabilities)

---

## 🚀 Lệnh Chạy

### 1️⃣ **Backend (Spring Boot)**
```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyPlatform
.\mvnw spring-boot:run
# Backend sẽ run tại http://localhost:8080
```

### 2️⃣ **Frontend (React)**
```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyFrontend
& 'D:\Program Files\npm.cmd' run dev
# Frontend sẽ run tại http://localhost:5173
```

> **2 terminal riêng:** 1 terminal cho backend, 1 terminal cho frontend

### Các lệnh khác:
```powershell
# Build production bundle
& 'D:\Program Files\npm.cmd' run build

# Preview production build
& 'D:\Program Files\npm.cmd' run preview

# Lint code
& 'D:\Program Files\npm.cmd' run lint
```

---

## 📁 Project Structure

```
learningVocabularyFrontend/
├── src/
│   ├── components/              # React UI components (TODO)
│   ├── pages/                   # Page components (TODO)
│   ├── services/
│   │   ├── api.js              # Axios instance + interceptors ✅
│   │   └── index.js            # API endpoints wrapper ✅
│   ├── hooks/                   # Custom hooks (TODO)
│   ├── contexts/
│   │   └── AuthContext.jsx      # Auth state management ✅
│   ├── utils/                   # Utility functions (TODO)
│   ├── App.jsx                 # Main app + routing ✅
│   ├── App.css
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
├── public/                      # Static files (images, icons)
├── index.html                  # HTML template
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite configuration ✅
├── .env                        # Environment variables ✅
├── .gitignore
└── eslint.config.js            # ESLint config
```

---

## ⚙️ Configuration Highlights

### 🔌 Vite Proxy (tự động forward API calls)
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
**Lợi ích:** FE gọi `/api/auth/login` tự động forward tới `http://localhost:8080/api/auth/login`

### 🔐 Axios Interceptor (tự động gắn JWT token)
```javascript
// src/services/api.js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
**Lợi ích:** Không cần thêm token vào mỗi request, tự động làm

### 🌍 Environment Variables
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Learning Vocabulary Platform
```
**Truy cập code:** `import.meta.env.VITE_API_BASE_URL`

---

## 📡 API Services (Đã tạo xong)

**File:** `src/services/index.js`

```javascript
// Auth
authAPI.login(credentials)
authAPI.register(data)
authAPI.logout()
authAPI.refresh()
authAPI.changePassword(data)

// Lessons
lessonAPI.getAll()
lessonAPI.create(data)
lessonAPI.getVocabularies(lessonId)

// Quiz
quizAPI.create(lessonId)
quizAPI.submit(data)
quizAPI.getHistory()

// Spaced Repetition
spacedRepetitionAPI.getDue()
spacedRepetitionAPI.start(userVocabularyId)
spacedRepetitionAPI.answer(data)

// Classes
classAPI.get(id)
classAPI.join(id)

// Vocabulary
vocabularyAPI.search(query)
```

---

## 🔐 Authentication Flow

### Login Process:
```
1. User điền username + password
2. FE gọi POST /api/auth/login
3. Backend trả back JWT token
4. FE lưu token vào localStorage
5. Axios auto thêm "Authorization: Bearer <token>" vào request tiếp theo
6. FE redirect tới dashboard
```

### Token Management:
```javascript
// Save token
const { token } = await authAPI.login(credentials);
localStorage.setItem('authToken', token);

// Axios tự động gắn vào header

// On logout
localStorage.removeItem('authToken');
```

---

## 🎯 Next Steps (TODO)

**Priority 1: Core Pages**
1. [ ] Cải thiện Login page (styling, validation, register link)
2. [ ] Cải thiện Dashboard page (layout, sidebar navigation)
3. [ ] Tạo Lessons page (list + create lessons)

**Priority 2: Features**
4. [ ] Tạo Lesson detail page (xem từ vựng)
5. [ ] Tạo Quiz mechanism (play + submit)
6. [ ] Tạo Spaced Repetition calendar

**Priority 3: UX**
7. [ ] Add loading states
8. [ ] Add error boundaries
9. [ ] Add responsive design (mobile)
10. [ ] Add notifications (toast/snackbar)

---

## ❌ Troubleshooting

### **"npm not found"**
```powershell
$env:Path += ";D:\Program Files"
& 'D:\Program Files\npm.cmd' run dev
```

### **"Cannot find module '@tanstack/react-query'"**
```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyFrontend
& 'D:\Program Files\npm.cmd' install
```

### **"Vite proxy not working"**
- Restart dev server (Ctrl+C then run again)
- Ensure backend is running on 8080
- Check browser console for actual error

### **"CORS error from backend"**
- Use Vite proxy (already configured)
- OR backend needs to allow `http://localhost:5173`

### **"Port 5173 already in use"**
```powershell
# Find process using port 5173
netstat -ano | findstr :5173

# Kill it
taskkill /PID <PID> /F

# Or change port in vite.config.js to 5174
```

---

## 📝 Các file tạo mới

| File | Mô tả |
|------|-------|
| `package.json` | Updated với axios, react-router-dom, react-query |
| `vite.config.js` | Added proxy config cho API calls |
| `.env` | Environment variables |
| `src/services/api.js` | Axios client instance |
| `src/services/index.js` | API endpoints wrapper |
| `src/contexts/AuthContext.jsx` | Auth state management |
| `src/App.jsx` | React Router setup + basic pages |

---

## ✨ Summary

**Backend:** Spring Boot tại `http://localhost:8080`  
**Frontend:** React + Vite tại `http://localhost:5173`  
**Dependencies:** ✅ 180 packages installed, 0 vulnerabilities  
**Ready to:** ✅ run `npm run dev` and start coding!

---

## 🔗 Important Resources

- [FRONTEND_SETUP.md](FRONTEND_SETUP.md) - Detailed setup guide
- [learningVocabularyFrontend](learningVocabularyFrontend/) - Frontend project folder
- [learningVocabularyPlatform](learningVocabularyPlatform/) - Backend project folder

---

**Happy coding! 🚀**
