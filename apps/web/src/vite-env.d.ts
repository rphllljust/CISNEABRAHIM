/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_FEATURE_MODULE_FINANCE?: string;
  readonly VITE_FEATURE_MODULE_FISCAL?: string;
  readonly VITE_FEATURE_MODULE_ACCOUNTING?: string;
  readonly VITE_FEATURE_MODULE_INVENTORY?: string;
  readonly VITE_FEATURE_MODULE_PAYROLL?: string;
  readonly VITE_FEATURE_MODULE_PROCUREMENT?: string;
  readonly VITE_FEATURE_MODULE_SUPPLIERS?: string;
  readonly VITE_FEATURE_MODULE_CONTRACTS?: string;
  readonly VITE_FEATURE_MODULE_PEOPLE?: string;
  readonly VITE_FEATURE_MODULE_RENTALS?: string;
  readonly VITE_FEATURE_MODULE_TRANSPORT?: string;
  readonly VITE_FEATURE_MODULE_ALERTS?: string;
  readonly VITE_FEATURE_MODULE_REPORTS?: string;
  readonly VITE_FEATURE_MODULE_APPROVAL_MATRIX?: string;
  readonly VITE_FEATURE_MODULE_OPERATIONAL_PROFITABILITY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
