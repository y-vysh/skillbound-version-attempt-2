import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { PeerProfilePage } from './pages/PeerProfilePage';
import { MySkillsPage } from './pages/MySkillsPage';
import { RequestsPage } from './pages/RequestsPage';
import { SessionsPage } from './pages/SessionsPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { MessagesPage } from './pages/MessagesPage';
import { RewardsPage } from './pages/RewardsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

function GlobalToast() {
  const { toast } = useAuth();
  if (!toast) return null;

  const styles =
    toast.type === 'error'
      ? 'bg-[#ba1a1a] text-white'
      : toast.type === 'info'
      ? 'bg-[#0b1c30] text-white'
      : 'bg-[#15803d] text-white';

  const Icon =
    toast.type === 'error'
      ? AlertCircle
      : toast.type === 'info'
      ? Info
      : CheckCircle2;

  return (
    <div
      role="status"
      className={`fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold max-w-sm ${styles}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{toast.message}</span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/peers/:id" element={<PeerProfilePage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute>
                <MySkillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <RequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <SessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback/:sessionId"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <RewardsPage />
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
            path="/admin"
            element={
              <ProtectedRoute requireAdminRole>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalToast />
      </BrowserRouter>
    </AuthProvider>
  );
}
