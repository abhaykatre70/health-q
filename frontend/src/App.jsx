import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import BookAppointment from './pages/BookAppointment';
import ChatbotPage from './pages/ChatbotPage';
import ReportAnalysis from './pages/ReportAnalysis';
import HospitalFinder from './pages/HospitalFinder';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to={role === 'provider' ? '/provider' : '/dashboard'} replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user) return <Navigate to={role === 'provider' ? '/provider' : '/dashboard'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Patient Routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} />
      <Route path="/book" element={<ProtectedRoute requiredRole="patient"><BookAppointment /></ProtectedRoute>} />
      <Route path="/chatbot" element={<ProtectedRoute requiredRole="patient"><ChatbotPage /></ProtectedRoute>} />
      <Route path="/hospitals" element={<HospitalFinder />} />
      <Route path="/analyze" element={<ProtectedRoute requiredRole="patient"><ReportAnalysis /></ProtectedRoute>} />

      {/* Provider Routes */}
      <Route path="/provider" element={<ProtectedRoute requiredRole="provider"><ProviderDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
