export { formatMoneyBrl, sumMoneyLines } from '../../billing/utils/billing-format';

export function isNegativeMoney(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  const numeric = Number(value.trim());
  return Number.isFinite(numeric) && numeric < 0;
}
