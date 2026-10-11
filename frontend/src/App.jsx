import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './components/layout/MainLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Review from './pages/Review';
import GitHubIntegration from './pages/GitHubIntegration';
import Repository from './pages/Repository';
import PullRequest from './pages/PullRequest';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';
import Reports from './pages/Reports';
import AIChat from './pages/AIChat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Security from './pages/Security';
import Quality from './pages/Quality';
import Performance from './pages/Performance';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#05070A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-mono text-text-muted tracking-wider">INITIALIZING INTELLIREVIEW...</p>
        </div>
      </div>
    );
  }

  return token ? children : <Navigate to="/" replace state={{ authRequired: true, destination: location.pathname }} />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/workspace" element={<Navigate to="/review" replace />} />
      <Route path="/review" element={<MainLayout><Review /></MainLayout>} />
      <Route path="/security" element={<ProtectedRoute><MainLayout><Security /></MainLayout></ProtectedRoute>} />
      <Route path="/quality" element={<ProtectedRoute><MainLayout><Quality /></MainLayout></ProtectedRoute>} />
      <Route path="/performance" element={<ProtectedRoute><MainLayout><Performance /></MainLayout></ProtectedRoute>} />
      <Route path="/github" element={<ProtectedRoute><MainLayout><GitHubIntegration /></MainLayout></ProtectedRoute>} />
      <Route path="/github/:owner/:repo" element={<ProtectedRoute><MainLayout><Repository /></MainLayout></ProtectedRoute>} />
      <Route path="/github/:owner/:repo/pull/:prNumber" element={<ProtectedRoute><MainLayout><PullRequest /></MainLayout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><MainLayout><History /></MainLayout></ProtectedRoute>} />
      <Route path="/history/:scanId" element={<ProtectedRoute><MainLayout><HistoryDetail /></MainLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><MainLayout><AIChat /></MainLayout></ProtectedRoute>} />
      <Route path="/assistant" element={<Navigate to="/chat" replace />} />
      <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <AppRoutes />
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
