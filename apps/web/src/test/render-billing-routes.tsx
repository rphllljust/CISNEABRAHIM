import { Route, Routes } from 'react-router-dom';
import { BillingDashboardPage } from '../billing/pages/BillingDashboardPage';
import { ServiceOrderBillingDocumentPage } from '../billing/pages/ServiceOrderBillingDocumentPage';
import { ServiceOrderBillingPage } from '../billing/pages/ServiceOrderBillingPage';
import { renderWithProviders } from './render-with-providers';

export function renderBillingRoutes(initialEntry: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/app/billing" element={<BillingDashboardPage />} />
      <Route path="/app/service-orders/:serviceOrderId/billing/document" element={<ServiceOrderBillingDocumentPage />} />
      <Route path="/app/service-orders/:serviceOrderId/billing" element={<ServiceOrderBillingPage />} />
    </Routes>,
    { router: { initialEntries: [initialEntry] } },
  );
}
