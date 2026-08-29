import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/context/AuthProvider';
import { ProtectedRoute } from './auth/components/ProtectedRoute';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AppHomePage } from './pages/AppHomePage';
import { LoginPage } from './pages/LoginPage';
import { ServiceUnavailablePage } from './pages/ServiceUnavailablePage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          <Route path="/unavailable" element={<ServiceUnavailablePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppHomePage />} />
          </Route>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
