/**
 * Application boundary for purchase-order balance changes triggered by billing (ADR-003).
 * Billing participates in the same transaction via these functions; commercial owns com.* writes.
 */
export {
  consumePurchaseOrderBalanceForBilling,
  releasePurchaseOrderBalanceForBillingVoid,
  PurchaseOrderConsumptionPersistenceError,
} from '../repositories/purchase-order-consumption.persistence';