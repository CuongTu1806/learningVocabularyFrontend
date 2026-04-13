import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import LessonsPage from './pages/LessonsPage';
import LessonDetailPage from './pages/LessonDetailPage';
import QuizModePage from './pages/QuizModePage';
import QuizPlayPage from './pages/QuizPlayPage';
import SpacedRepetitionPage from './pages/SpacedRepetitionPage';
import ReviewFlashcardPage from './pages/ReviewFlashcardPage';
import ReviewSettingsPage from './pages/ReviewSettingsPage';
import ProfilePage from './pages/ProfilePage';
import QuizHistoryPage from './pages/QuizHistoryPage';
import QuizResultDetailPage from './pages/QuizResultDetailPage';

// Placeholder pages (create these next)
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons"
          element={
            <ProtectedRoute>
              <LessonsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson/:id"
          element={
            <ProtectedRoute>
              <LessonDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:id"
          element={
            <ProtectedRoute>
              <QuizModePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:id/play"
          element={
            <ProtectedRoute>
              <QuizPlayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spaced-repetition"
          element={
            <ProtectedRoute>
              <SpacedRepetitionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review-flashcard"
          element={
            <ProtectedRoute>
              <ReviewFlashcardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review-settings"
          element={
            <ProtectedRoute>
              <ReviewSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz-history"
          element={
            <ProtectedRoute>
              <QuizHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz-result/:quizId"
          element={
            <ProtectedRoute>
              <QuizResultDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
