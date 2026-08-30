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
import { CatalogRoute } from './catalog/CatalogRoute';
import { ServiceDefinitionComparePage } from './catalog/pages/ServiceDefinitionComparePage';
import { ServiceDefinitionCreatePage } from './catalog/pages/ServiceDefinitionCreatePage';
import { ServiceDefinitionDetailPage } from './catalog/pages/ServiceDefinitionDetailPage';
import { ServiceDefinitionDraftEditPage } from './catalog/pages/ServiceDefinitionDraftEditPage';
import { ServiceDefinitionVersionCreatePage } from './catalog/pages/ServiceDefinitionVersionCreatePage';
import { ServiceDefinitionVersionDetailPage } from './catalog/pages/ServiceDefinitionVersionDetailPage';
import { ServiceDefinitionsListPage } from './catalog/pages/ServiceDefinitionsListPage';
import { BillingRoute } from './billing/BillingRoute';
import { BillingDashboardPage } from './billing/pages/BillingDashboardPage';
import { ServiceOrderBillingDocumentPage } from './billing/pages/ServiceOrderBillingDocumentPage';
import { ServiceOrderBillingPage } from './billing/pages/ServiceOrderBillingPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { PhysicalAssetCreatePage } from './assets/pages/PhysicalAssetCreatePage';
import { PhysicalAssetDetailPage } from './assets/pages/PhysicalAssetDetailPage';
import { PhysicalAssetEditPage } from './assets/pages/PhysicalAssetEditPage';
import { PhysicalAssetsListPage } from './assets/pages/PhysicalAssetsListPage';
import { AssetsRoute } from './assets/AssetsRoute';
import { RequestsRoute } from './requests/RequestsRoute';
import { ServiceOrdersRoute } from './service-orders/ServiceOrdersRoute';
import { ServiceOrderPlanningPage } from './service-orders/pages/ServiceOrderPlanningPage';
import { ExecutionShellLayout } from './service-orders/layout/ExecutionShellLayout';
import { ServiceOrderExecutionPage } from './service-orders/pages/ServiceOrderExecutionPage';
import { ServiceOrderMeasurementPage } from './service-orders/pages/ServiceOrderMeasurementPage';
import { ServiceRequestCreatePage } from './requests/pages/ServiceRequestCreatePage';
import { ServiceRequestDetailPage } from './requests/pages/ServiceRequestDetailPage';
import { ServiceRequestEditPage } from './requests/pages/ServiceRequestEditPage';
import { ServiceRequestsListPage } from './requests/pages/ServiceRequestsListPage';
import { OperationalDashboardPage } from './dashboard/pages/OperationalDashboardPage';
import { AlertCenterPage } from './alerts/pages/AlertCenterPage';
import { SearchResultsPage } from './search/pages/SearchResultsPage';
import { ReportsPage } from './reports/pages/ReportsPage';
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
            <Route element={<ExecutionShellLayout />}>
              <Route
                path="/app/service-orders/:serviceOrderId/execution"
                element={
                  <ServiceOrdersRoute>
                    <ServiceOrderExecutionPage />
                  </ServiceOrdersRoute>
                }
              />
            </Route>
            <Route element={<AppShellLayout />}>
              <Route path="/app" element={<OperationalDashboardPage />} />
              <Route path="/app/alerts" element={<AlertCenterPage />} />
              <Route path="/app/search" element={<SearchResultsPage />} />
              <Route path="/app/reports" element={<ReportsPage />} />
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
              <Route
                path="/app/catalog"
                element={
                  <CatalogRoute>
                    <ServiceDefinitionsListPage />
                  </CatalogRoute>
                }
              />
              <Route
                path="/app/catalog/new"
                element={
                  <CatalogRoute>
                    <ServiceDefinitionCreatePage />
                  </CatalogRoute>
                }
              />
              <Route
                path="/app/catalog/:definitionId/compare"
                element={
                  <CatalogRoute>
                    <ServiceDefinitionComparePage />
                  </CatalogRoute>
                }
              />
              <Route
                path="/app/catalog/:definitionId/versions/new"
                element={
                  <CatalogRoute>
                    <ServiceDefinitionVersionCreatePage />
                  </CatalogRoute>
                }
              />
              <Route
                path="/app/catalog/:definitionId/versions/:versionNumber/edit"
                element={
                  <CatalogRoute>
                    <ServiceDefinitionDraftEditPage />
                  </CatalogRoute>
                }
              />
              <Route
                path="/app/catalog/:definitionId/versions/:versionNumber"
                element={
                  <CatalogRoute>
                    <ServiceDefinitionVersionDetailPage />
                  </CatalogRoute>
                }
              />
              <Route
                path="/app/catalog/:definitionId"
                element={
                  <CatalogRoute>
                    <ServiceDefinitionDetailPage />
                  </CatalogRoute>
                }
              />
              <Route
                path="/app/assets"
                element={
                  <AssetsRoute>
                    <PhysicalAssetsListPage />
                  </AssetsRoute>
                }
              />
              <Route
                path="/app/assets/new"
                element={
                  <AssetsRoute>
                    <PhysicalAssetCreatePage />
                  </AssetsRoute>
                }
              />
              <Route
                path="/app/assets/:assetId/edit"
                element={
                  <AssetsRoute>
                    <PhysicalAssetEditPage />
                  </AssetsRoute>
                }
              />
              <Route
                path="/app/assets/:assetId"
                element={
                  <AssetsRoute>
                    <PhysicalAssetDetailPage />
                  </AssetsRoute>
                }
              />
              <Route
                path="/app/requests"
                element={
                  <RequestsRoute>
                    <ServiceRequestsListPage />
                  </RequestsRoute>
                }
              />
              <Route
                path="/app/requests/new"
                element={
                  <RequestsRoute>
                    <ServiceRequestCreatePage />
                  </RequestsRoute>
                }
              />
              <Route
                path="/app/requests/:serviceRequestId/edit"
                element={
                  <RequestsRoute>
                    <ServiceRequestEditPage />
                  </RequestsRoute>
                }
              />
              <Route
                path="/app/requests/:serviceRequestId"
                element={
                  <RequestsRoute>
                    <ServiceRequestDetailPage />
                  </RequestsRoute>
                }
              />
              <Route
                path="/app/service-orders/:serviceOrderId/planning"
                element={
                  <ServiceOrdersRoute>
                    <ServiceOrderPlanningPage />
                  </ServiceOrdersRoute>
                }
              />
              <Route
                path="/app/service-orders/:serviceOrderId/measurement"
                element={
                  <ServiceOrdersRoute>
                    <ServiceOrderMeasurementPage />
                  </ServiceOrdersRoute>
                }
              />
              <Route
                path="/app/billing"
                element={
                  <BillingRoute>
                    <BillingDashboardPage />
                  </BillingRoute>
                }
              />
              <Route
                path="/app/service-orders/:serviceOrderId/billing/document"
                element={
                  <ServiceOrdersRoute>
                    <ServiceOrderBillingDocumentPage />
                  </ServiceOrdersRoute>
                }
              />
              <Route
                path="/app/service-orders/:serviceOrderId/billing"
                element={
                  <ServiceOrdersRoute>
                    <ServiceOrderBillingPage />
                  </ServiceOrdersRoute>
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
