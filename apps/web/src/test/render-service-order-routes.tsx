import { Route, Routes } from 'react-router-dom';
import { ServiceOrderPlanningPage } from '../service-orders/pages/ServiceOrderPlanningPage';
import { ServiceOrderMeasurementPage } from '../service-orders/pages/ServiceOrderMeasurementPage';
import { renderWithProviders } from './render-with-providers';

export function renderServiceOrderRoutes(initialEntry: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/app/service-orders/:serviceOrderId/planning" element={<ServiceOrderPlanningPage />} />
      <Route path="/app/service-orders/:serviceOrderId/measurement" element={<ServiceOrderMeasurementPage />} />
    </Routes>,
    { router: { initialEntries: [initialEntry] } },
  );
}
