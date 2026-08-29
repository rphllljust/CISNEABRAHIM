import { Route, Routes } from 'react-router-dom';
import { ServiceOrderPlanningPage } from '../service-orders/pages/ServiceOrderPlanningPage';
import { renderWithProviders } from './render-with-providers';

export function renderServiceOrderRoutes(initialEntry: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/app/service-orders/:serviceOrderId/planning" element={<ServiceOrderPlanningPage />} />
    </Routes>,
    { router: { initialEntries: [initialEntry] } },
  );
}
