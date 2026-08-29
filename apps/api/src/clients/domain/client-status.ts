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
