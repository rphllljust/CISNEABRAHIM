/**
 * Mandatory conceptual separations — CISNE enterprise nucleus.
 * Enforced by module boundaries; future modules must not collapse these pairs.
 */
export const DOMAIN_DISTINCTIONS = [
  {
    left: 'ServiceOrder',
    right: 'Billing',
    rule: 'ServiceOrder is operational; Billing prepares charge from approved measurement.',
  },
  {
    left: 'Billing',
    right: 'Receivable',
    rule: 'BillingDocument is internal OPERATIONS charge; Receivable belongs to FINANCE.',
  },
  {
    left: 'Receivable',
    right: 'FiscalDocument',
    rule: 'Open receivable is not an authorized official fiscal document (FISCAL).',
  },
  {
    left: 'FiscalDocument',
    right: 'AccountingEntry',
    rule: 'Authorized NF-e/NFS-e is not a posted ledger entry (ACCOUNTING).',
  },
  {
    left: 'Asset',
    right: 'InventoryItem',
    rule: 'Operational physical asset is not a stock SKU (INVENTORY).',
  },
  {
    left: 'Employee',
    right: 'PayrollContract',
    rule: 'Person identity is not an employment contract (PAYROLL).',
  },
  {
    left: 'ServiceOrder',
    right: 'Measurement',
    rule: 'Measurement consolidates execution facts; does not mutate ServiceOrder state.',
  },
  {
    left: 'Measurement',
    right: 'Billing',
    rule: 'Billing prepares charge from approved measurement; billing is not receivable.',
  },
  {
    left: 'BillingDocument',
    right: 'FiscalDocument',
    rule: 'Internal billing PDF is not official NF-e/NFS-e (FISCAL).',
  },
  {
    left: 'PurchaseOrder',
    right: 'Payable',
    rule: 'Commercial PO balance is not accounts payable (FINANCE).',
  },
  {
    left: 'LaborAssignment',
    right: 'PayrollEvent',
    rule: 'Operational labor allocation is not payroll calculation.',
  },
  {
    left: 'BankTransaction',
    right: 'AccountingEntry',
    rule: 'Bank movement is not posted ledger entry (ACCOUNTING).',
  },
  {
    left: 'FinancialTransaction',
    right: 'JournalEntry',
    rule: 'Treasury cash movement is not a double-entry journal (ACCOUNTING).',
  },
  {
    left: 'TaxCalculation',
    right: 'FiscalDocument',
    rule: 'Tax computation is not authorized fiscal document.',
  },
  {
    left: 'TaxCalculation',
    right: 'JournalEntry',
    rule: 'Tax calculation does not post to the ledger; only a later posting event may generate accounting.',
  },
  {
    left: 'PayrollResult',
    right: 'JournalEntry',
    rule: 'Payroll close may emit PayrollClosed; Payroll never writes acc.* and does not invent official formulas.',
  },
  {
    left: 'BankStatementLine',
    right: 'FinancialTransaction',
    rule: 'Imported bank line is not a posted treasury movement; reconciliation match links them.',
  },
  {
    left: 'Asset',
    right: 'FixedAssetAccounting',
    rule: 'Operational physical asset (ast.*) is not the accounting fixed-asset register (acc.*).',
  },
  {
    left: 'Budget',
    right: 'JournalEntry',
    rule: 'Budget is a planning document; it never mutates posted ledger journals.',
  },
  {
    left: 'CashForecast',
    right: 'FinancialTransaction',
    rule: 'Cash forecast remaining is not realized treasury cash and is not a bank statement balance.',
  },
  {
    left: 'Supplier',
    right: 'Client',
    rule: 'Supplier is the procurement/payable counterpart; Client is the commercial customer. They are distinct masters.',
  },
  {
    left: 'CustomerPurchaseOrder',
    right: 'SupplierPurchaseOrder',
    rule: 'CustomerPurchaseOrder (com.purchase_orders) is a commercial document received from a client. SupplierPurchaseOrder (prc.*) is the internal buying document.',
  },
  {
    left: 'SupplierPurchaseOrder',
    right: 'Payable',
    rule: 'Issuing a supplier PO is not accounts payable. Payable opens only from a posted receipt.',
  },
  {
    left: 'GoodsReceipt',
    right: 'StockMovement',
    rule: 'Procurement receipt authorizes a payable; it does not post inventory stock movements.',
  },
  {
    left: 'SupplierInvoice',
    right: 'Payable',
    rule: 'SupplierInvoice is the supplier billing document in prc.*. Payable is finance. Validation opens or attaches at most one payable.',
  },
  {
    left: 'SupplierInvoice',
    right: 'FiscalDocument',
    rule: 'SupplierInvoice is an internal procurement document. It is not an official NF-e/NFS-e (FISCAL).',
  },
  {
    left: 'ThreeWayMatch',
    right: 'SupplierInvoice',
    rule: 'Three-way match is a derived conference of PO, receipt and invoice. It does not mutate those documents and does not auto-approve divergence.',
  },
  {
    left: 'ApprovalMatrix',
    right: 'Grant',
    rule: 'Financial approval matrix is a versioned policy of role, capability, scope and monetary limit. It is not an identity-action grant and never stores person names.',
  },
  {
    left: 'Expense',
    right: 'Payable',
    rule: 'Expense is a finance request with items, approval and optional reimbursement. It is not a Payable. Approval opens at most one OPERATIONAL_EXPENSE payable when reimbursable.',
  },
  {
    left: 'ReceivableCollection',
    right: 'Receivable',
    rule: 'Collection tracks overdue recovery (action, promise, history). It does not mutate receivable principal or due_date. Aging remains derived from the receivable.',
  },
] as const;

export type DomainDistinction = (typeof DOMAIN_DISTINCTIONS)[number];

export const MANDATORY_DISTINCT_PAIRS = [
  ['ServiceOrder', 'Billing'],
  ['Billing', 'Receivable'],
  ['Receivable', 'FiscalDocument'],
  ['FiscalDocument', 'AccountingEntry'],
  ['Asset', 'InventoryItem'],
  ['Employee', 'PayrollContract'],
] as const;
