import { Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { ServiceRequestCreatePage } from '../requests/pages/ServiceRequestCreatePage';
import { ServiceRequestDetailPage } from '../requests/pages/ServiceRequestDetailPage';
import { ServiceRequestEditPage } from '../requests/pages/ServiceRequestEditPage';
import { ServiceRequestsListPage } from '../requests/pages/ServiceRequestsListPage';
import { renderWithProviders } from './render-with-providers';

export function renderRequestRoutes(initialEntry: string, page?: ReactElement) {
  return renderWithProviders(
    page ?? (
      <Routes>
        <Route path="/app/requests" element={<ServiceRequestsListPage />} />
        <Route path="/app/requests/new" element={<ServiceRequestCreatePage />} />
        <Route path="/app/requests/:serviceRequestId/edit" element={<ServiceRequestEditPage />} />
        <Route path="/app/requests/:serviceRequestId" element={<ServiceRequestDetailPage />} />
      </Routes>
    ),
    { router: { initialEntries: [initialEntry] } },
  );
}
