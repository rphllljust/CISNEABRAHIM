export const REPORT_TYPES = {
  ServiceOrdersByPeriod: 'SERVICE_ORDERS_BY_PERIOD',
  ServiceOrdersByClient: 'SERVICE_ORDERS_BY_CLIENT',
  ServiceOrdersByService: 'SERVICE_ORDERS_BY_SERVICE',
  ServiceOrdersOverdue: 'SERVICE_ORDERS_OVERDUE',
  OperationalProductivity: 'OPERATIONAL_PRODUCTIVITY',
  AssetUtilization: 'ASSET_UTILIZATION',
  Measurements: 'MEASUREMENTS',
  FinancialAging: 'FINANCIAL_AGING',
  Billing: 'BILLING',
  Receipts: 'RECEIPTS',
} as const;

export type ReportType = (typeof REPORT_TYPES)[keyof typeof REPORT_TYPES];

const REPORT_TYPE_SET = new Set<string>(Object.values(REPORT_TYPES));

export function isReportType(value: string): value is ReportType {
  return REPORT_TYPE_SET.has(value);
}

export const REPORT_FORMATS = {
  Csv: 'CSV',
  Xlsx: 'XLSX',
  Pdf: 'PDF',
} as const;

export type ReportFormat = (typeof REPORT_FORMATS)[keyof typeof REPORT_FORMATS];

export type ReportFilters = {
  period?: string;
  from?: string;
  to?: string;
  unitId?: string;
  clientId?: string;
  serviceDefinitionId?: string;
  status?: string;
};

export type ReportContract = {
  name: string;
  filters: ReportFilters;
  columns: string[];
  sort: { field: string; direction: 'ASC' | 'DESC' };
  timezone: string;
  generatedAt: string | null;
  actor: { identityId: string; sessionId: string };
  scope: { summary: string };
};

export type ReportColumnDef = {
  key: string;
  header: string;
};

export const REPORT_DEFINITIONS: Record<
  ReportType,
  {
    label: string;
    columns: ReportColumnDef[];
    defaultSort: { field: string; direction: 'ASC' | 'DESC' };
    sensitive: boolean;
  }
> = {
  [REPORT_TYPES.ServiceOrdersByPeriod]: {
    label: 'OS por período',
    columns: [
      { key: 'orderNumber', header: 'Número OS' },
      { key: 'unitId', header: 'Unidade' },
      { key: 'clientName', header: 'Cliente' },
      { key: 'status', header: 'Status' },
      { key: 'createdAt', header: 'Criada em' },
      { key: 'completedAt', header: 'Concluída em' },
    ],
    defaultSort: { field: 'createdAt', direction: 'DESC' },
    sensitive: false,
  },
  [REPORT_TYPES.ServiceOrdersByClient]: {
    label: 'OS por cliente',
    columns: [
      { key: 'clientName', header: 'Cliente' },
      { key: 'orderNumber', header: 'Número OS' },
      { key: 'status', header: 'Status' },
      { key: 'unitId', header: 'Unidade' },
      { key: 'createdAt', header: 'Criada em' },
    ],
    defaultSort: { field: 'clientName', direction: 'ASC' },
    sensitive: false,
  },
  [REPORT_TYPES.ServiceOrdersByService]: {
    label: 'OS por serviço',
    columns: [
      { key: 'serviceCode', header: 'Serviço' },
      { key: 'orderNumber', header: 'Número OS' },
      { key: 'status', header: 'Status' },
      { key: 'unitId', header: 'Unidade' },
      { key: 'createdAt', header: 'Criada em' },
    ],
    defaultSort: { field: 'serviceCode', direction: 'ASC' },
    sensitive: false,
  },
  [REPORT_TYPES.ServiceOrdersOverdue]: {
    label: 'OS vencidas',
    columns: [
      { key: 'orderNumber', header: 'Número OS' },
      { key: 'unitId', header: 'Unidade' },
      { key: 'status', header: 'Status' },
      { key: 'deadline', header: 'Prazo' },
      { key: 'delayDays', header: 'Dias atraso' },
    ],
    defaultSort: { field: 'delayDays', direction: 'DESC' },
    sensitive: false,
  },
  [REPORT_TYPES.OperationalProductivity]: {
    label: 'Produtividade operacional',
    columns: [
      { key: 'metric', header: 'Métrica' },
      { key: 'value', header: 'Valor' },
      { key: 'denominator', header: 'Denominador' },
    ],
    defaultSort: { field: 'metric', direction: 'ASC' },
    sensitive: false,
  },
  [REPORT_TYPES.AssetUtilization]: {
    label: 'Utilização de ativos',
    columns: [
      { key: 'assetCode', header: 'Código ativo' },
      { key: 'assetName', header: 'Nome' },
      { key: 'unitId', header: 'Unidade' },
      { key: 'allocationStatus', header: 'Alocação' },
      { key: 'serviceOrderNumber', header: 'OS' },
    ],
    defaultSort: { field: 'assetCode', direction: 'ASC' },
    sensitive: false,
  },
  [REPORT_TYPES.Measurements]: {
    label: 'Medições',
    columns: [
      { key: 'measurementId', header: 'ID medição' },
      { key: 'orderNumber', header: 'OS' },
      { key: 'status', header: 'Status' },
      { key: 'unitId', header: 'Unidade' },
      { key: 'submittedAt', header: 'Enviada em' },
    ],
    defaultSort: { field: 'submittedAt', direction: 'DESC' },
    sensitive: false,
  },
  [REPORT_TYPES.FinancialAging]: {
    label: 'Aging financeiro',
    columns: [
      { key: 'bucket', header: 'Faixa' },
      { key: 'count', header: 'Quantidade' },
      { key: 'amount', header: 'Valor' },
    ],
    defaultSort: { field: 'bucket', direction: 'ASC' },
    sensitive: true,
  },
  [REPORT_TYPES.Billing]: {
    label: 'Faturamentos',
    columns: [
      { key: 'billingRecordId', header: 'ID faturamento' },
      { key: 'orderNumber', header: 'OS' },
      { key: 'clientName', header: 'Cliente' },
      { key: 'status', header: 'Status' },
      { key: 'preparedAt', header: 'Preparado em' },
    ],
    defaultSort: { field: 'preparedAt', direction: 'DESC' },
    sensitive: true,
  },
  [REPORT_TYPES.Receipts]: {
    label: 'Recebimentos',
    columns: [
      { key: 'documentNumber', header: 'Documento' },
      { key: 'clientName', header: 'Cliente' },
      { key: 'status', header: 'Status' },
      { key: 'dueDate', header: 'Vencimento' },
      { key: 'amount', header: 'Valor' },
    ],
    defaultSort: { field: 'dueDate', direction: 'ASC' },
    sensitive: true,
  },
};

export const REPORT_POLICY = {
  previewLimit: 20,
  syncRowThreshold: 500,
  batchSize: 250,
  maxRows: 50_000,
} as const;
