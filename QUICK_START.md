# 🚀 Quick Start Reference

## Một câu lệnh = 1 cái gì đó

### **Hãy làm lần lượt:**

#### 1️⃣ **Terminal 1: Chạy Backend**
```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyPlatform
.\mvnw spring-boot:run
```
✅ Backend sẽ chạy tại `http://localhost:8080`

---

#### 2️⃣ **Terminal 2: Chạy Frontend** 
```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyFrontend
& 'D:\Program Files\npm.cmd' run dev
```
✅ Frontend sẽ chạy tại `http://localhost:5173`

---

## 🌐 Truy cập Ứng dụng

**Frontend Browser:** [http://localhost:5173](http://localhost:5173)

---

## 📦 Lần đầu chạy? (cài dependencies)

```powershell
cd d:\HT\ki2_4\TTCS\learningVocabularyFrontend
& 'D:\Program Files\npm.cmd' install
```

---

## 🔧 Rebuild Project

```powershell
# Build production
& 'D:\Program Files\npm.cmd' run build

# Preview production build
& 'D:\Program Files\npm.cmd' run preview
```

---

## 📁 Tệp cấu hình chính

- **Backend config:** `learningVocabularyPlatform/src/main/resources/application.properties`
- **Frontend config:** `learningVocabularyFrontend/vite.config.js`
- **API endpoints:** `learningVocabularyFrontend/src/services/index.js`
- **Auth context:** `learningVocabularyFrontend/src/contexts/AuthContext.jsx`

---

## 📖 Tài liệu đầy đủ

[👉 Xem FRONTEND_SETUP.md để chi tiết](FRONTEND_SETUP.md)  
[👉 Xem FE_PROJECT_COMPLETE.md để tóm tắt](FE_PROJECT_COMPLETE.md)

---

## ❓ Lỗi gì?

**npm not found:**
```powershell
$env:Path += ";D:\Program Files"
```

**Port 5173 bị chiếm?**
```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

**Đó là tất cả! 🎉**
