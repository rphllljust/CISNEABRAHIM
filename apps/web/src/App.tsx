import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/context/AuthProvider';
import { ProtectedRoute } from './auth/components/ProtectedRoute';
import { CapabilityRoute } from './shell/CapabilityRoute';
import { AppShellLayout } from './shell/AppShellLayout';
import { ClientsRoute } from './clients/ClientsRoute';
import { ClientCreatePage } from './clients/pages/ClientCreatePage';
import { ClientDetailPage } from './clients/pages/ClientDetailPage';
import { ClientEditPage } from './clients/pages/ClientEditPage';
import { ClientsListPage } from './clients/pages/ClientsListPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AppHomePage } from './pages/AppHomePage';
import { LoginPage } from './pages/LoginPage';
import { PlatformDiagnosticsPage } from './pages/PlatformDiagnosticsPage';
import { ServiceUnavailablePage } from './pages/ServiceUnavailablePage';
import { ShellAccessDeniedPage } from './pages/ShellAccessDeniedPage';
import { SessionExpiredPage } from './pages/SessionExpiredPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          <Route path="/session-expired" element={<SessionExpiredPage />} />
          <Route path="/unavailable" element={<ServiceUnavailablePage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShellLayout />}>
              <Route path="/app" element={<AppHomePage />} />
              <Route
                path="/app/platform"
                element={
                  <CapabilityRoute>
                    <PlatformDiagnosticsPage />
                  </CapabilityRoute>
                }
              />
              <Route
                path="/app/clients"
                element={
                  <ClientsRoute>
                    <ClientsListPage />
                  </ClientsRoute>
                }
              />
              <Route
                path="/app/clients/new"
                element={
                  <ClientsRoute>
                    <ClientCreatePage />
                  </ClientsRoute>
                }
              />
              <Route
                path="/app/clients/:clientId/edit"
                element={
                  <ClientsRoute>
                    <ClientEditPage />
                  </ClientsRoute>
                }
              />
              <Route
                path="/app/clients/:clientId"
                element={
                  <ClientsRoute>
                    <ClientDetailPage />
                  </ClientsRoute>
                }
              />
              <Route path="/app/no-access" element={<ShellAccessDeniedPage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
