export const CLIENT_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[keyof typeof CLIENT_STATUSES];

export const CONTACT_PURPOSES = {
  Operational: 'operational',
  Commercial: 'commercial',
  Billing: 'billing',
} as const;

export type ContactPurpose = (typeof CONTACT_PURPOSES)[keyof typeof CONTACT_PURPOSES];

export const ADDRESS_PURPOSES = {
  Operational: 'operational',
  Billing: 'billing',
  Correspondence: 'correspondence',
} as const;

export type AddressPurpose = (typeof ADDRESS_PURPOSES)[keyof typeof ADDRESS_PURPOSES];

/** SRC-008 / BR-048 — exigência de PO é configuração do cliente, não identidade. */
export const PURCHASE_ORDER_REQUIREMENTS = {
  NotRequired: 'NOT_REQUIRED',
  BeforeExecution: 'BEFORE_EXECUTION',
  BeforeBilling: 'BEFORE_BILLING',
} as const;

export type PurchaseOrderRequirement =
  (typeof PURCHASE_ORDER_REQUIREMENTS)[keyof typeof PURCHASE_ORDER_REQUIREMENTS];

const PURCHASE_ORDER_REQUIREMENT_SET = new Set<string>(Object.values(PURCHASE_ORDER_REQUIREMENTS));

export function isPurchaseOrderRequirement(value: string): value is PurchaseOrderRequirement {
  return PURCHASE_ORDER_REQUIREMENT_SET.has(value);
}
