import { Route, Routes } from 'react-router-dom';
import { ServiceOrdersRoute } from '../service-orders/ServiceOrdersRoute';
import { ServiceOrderPlanningPage } from '../service-orders/pages/ServiceOrderPlanningPage';
import { ServiceOrderMeasurementPage } from '../service-orders/pages/ServiceOrderMeasurementPage';
import { ServiceOrdersListPage } from '../service-orders/pages/ServiceOrdersListPage';
import { renderWithProviders } from './render-with-providers';

export function renderServiceOrderRoutes(initialEntry: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/app/service-orders"
        element={
          <ServiceOrdersRoute>
            <ServiceOrdersListPage />
          </ServiceOrdersRoute>
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
    </Routes>,
    { router: { initialEntries: [initialEntry] } },
  );
}
