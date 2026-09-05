import { ACCOUNT_CLASSES, AccountingError, assertDirection, type AccountClass } from './ledger';

/**
 * Semântica contábil centralizada (única fonte de verdade das naturezas).
 *
 * A natureza normal de saldo de uma conta decorre da CLASSE contábil, nunca de
 * convenção de numeração nem do sinal matemático dos valores. Relatórios e o
 * motor devem consultar esta camada em vez de duplicar a regra.
 */
export const CLASS_NORMAL_BALANCE: Record<AccountClass, 'DEBIT' | 'CREDIT'> = {
  [ACCOUNT_CLASSES.Asset]: 'DEBIT',
  [ACCOUNT_CLASSES.Expense]: 'DEBIT',
  [ACCOUNT_CLASSES.Liability]: 'CREDIT',
  [ACCOUNT_CLASSES.Equity]: 'CREDIT',
  [ACCOUNT_CLASSES.Revenue]: 'CREDIT',
} as const;

export type NormalBalance = 'DEBIT' | 'CREDIT';

export function assertKnownAccountClass(value: string): AccountClass {
  const normalized = value.trim().toUpperCase();
  if (!(normalized in CLASS_NORMAL_BALANCE)) {
    throw new AccountingError('ACCOUNTING_INVALID_ACCOUNT_CLASS');
  }
  return normalized as AccountClass;
}

export function normalBalanceForClass(value: string): NormalBalance {
  const accountClass = assertKnownAccountClass(value);
  const balance = CLASS_NORMAL_BALANCE[accountClass];
  return assertDirection(balance) === 'DEBIT' ? 'DEBIT' : 'CREDIT';
}

/**
 * Conta aceita lançamento somente quando está ATIVA e é ANALÍTICA (sem filhos).
 * Conta sintética (com filhos) e conta inativa são estruturas de agregação e
 * não podem receber escrituração direta.
 */
export function accountMayReceivePostings(input: {
  status: string;
  hasChildren: boolean;
}): boolean {
  return input.status === 'ACTIVE' && !input.hasChildren;
}

export function assertAccountPostable(input: {
  status: string;
  hasChildren: boolean;
}): void {
  if (input.status !== 'ACTIVE') {
    throw new AccountingError('ACCOUNTING_ACCOUNT_INACTIVE');
  }
  if (input.hasChildren) {
    throw new AccountingError('ACCOUNTING_ACCOUNT_SYNTHETIC');
  }
}
