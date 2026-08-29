import { useEffect, useState } from 'react';
import {
  listLaborTypes,
  listMeasurementModelPolicies,
  listPhysicalResourceTypes,
  listPricingModelPolicies,
  listUnitsOfMeasure,
  type LaborTypeOption,
  type PolicyOption,
  type ResourceTypeOption,
  type UnitOfMeasureOption,
} from '../api/catalog-reference-api';

export type CatalogReferenceData = {
  units: UnitOfMeasureOption[];
  resourceTypes: ResourceTypeOption[];
  laborTypes: LaborTypeOption[];
  pricingModels: PolicyOption[];
  measurementModels: PolicyOption[];
};

const EMPTY_REFERENCE_DATA: CatalogReferenceData = {
  units: [],
  resourceTypes: [],
  laborTypes: [],
  pricingModels: [],
  measurementModels: [],
};

export function useCatalogReferenceData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CatalogReferenceData>(EMPTY_REFERENCE_DATA);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void Promise.all([
      listUnitsOfMeasure(controller.signal),
      listPhysicalResourceTypes(controller.signal),
      listLaborTypes(controller.signal),
      listPricingModelPolicies(controller.signal),
      listMeasurementModelPolicies(controller.signal),
    ])
      .then(([units, resourceTypes, laborTypes, pricingModels, measurementModels]) => {
        if (!cancelled) {
          setData({ units, resourceTypes, laborTypes, pricingModels, measurementModels });
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(EMPTY_REFERENCE_DATA);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { loading, data };
}
