export type CashForecastReceivableRow = {
  id: string;
  lifecycle: string;
  principal: string;
};

export type CashForecastPayableRow = {
  id: string;
  lifecycle: string;
  principal: string;
};

export type CashForecastInstallmentRow = {
  id: string;
  document_id: string;
  principal: string;
  due_on: string;
};

export type CashForecastSettlementRow = {
  id: string;
  receivable_id: string;
  installment_id: string | null;
  amount: string;
  status: string;
};

export type CashForecastPaymentRow = {
  id: string;
  payable_id: string;
  installment_id: string;
  kind: string;
  amount: string;
};

export type CashForecastMovementRow = {
  direction: string;
  amount: string;
  status: string;
};
