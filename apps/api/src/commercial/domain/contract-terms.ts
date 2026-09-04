import {
  multiplyMoneyByPercent,
  normalizeMoneyAmount,
  sumMoneyAmounts,
} from '../../platform/kernel/money-math';

/**
 * Termos comerciais de CustomerContract armazenados em commercial_terms (jsonb)
 * de forma tipada e versionada. Reajuste e limites nunca alteram o histórico;
 * são lidos/validados em cada operação e calculados por funções puras.
 */

export type ContractAdjustmentRecord = {
  /** Data efetiva do reajuste (YYYY-MM-DD). */
  effectiveOn: string;
  /** Percentual aplicado sobre os preços unitários (escala 4, ex.: 5.0000 = 5%). */
  percent: string;
  indexCode?: string | null;
};

export type ContractCommercialLimits = {
  /** Limite global de valor contratado (R$). */
  maxTotalAmount?: string | null;
  /** Permite estouro de limite? */
  allowOverrun?: boolean | null;
};

export type ContractCommercialTerms = {
  adjustments?: ContractAdjustmentRecord[] | null;
  limits?: ContractCommercialLimits | null;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readDate(value: unknown): string | null {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    return null;
  }
  return value;
}

function readPercent(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!/^\d{1,4}(\.\d{1,4})?$/.test(trimmed)) {
    return null;
  }
  try {
    const normalized = normalizeMoneyAmount(trimmed);
    if (/^0+\.?0*$/.test(normalized)) {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

function readMoney(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    return normalizeMoneyAmount(value.trim());
  } catch {
    return null;
  }
}

/** Parse tolerante: campos ausentes/inválidos são descartados (compatibilidade). */
export function parseContractCommercialTerms(value: unknown): ContractCommercialTerms {
  if (!isPlainRecord(value)) {
    return {};
  }
  const terms: ContractCommercialTerms = {};
  if (Array.isArray(value['adjustments'])) {
    const adjustments: ContractAdjustmentRecord[] = [];
    for (const entry of value['adjustments']) {
      if (!isPlainRecord(entry)) {
        continue;
      }
      const effectiveOn = readDate(entry['effectiveOn']);
      const percent = readPercent(entry['percent']);
      if (!effectiveOn || !percent) {
        continue;
      }
      const record: ContractAdjustmentRecord = { effectiveOn, percent };
      if (typeof entry['indexCode'] === 'string' && entry['indexCode'].trim()) {
        record.indexCode = entry['indexCode'].trim();
      }
      adjustments.push(record);
    }
    if (adjustments.length > 0) {
      terms.adjustments = adjustments;
    }
  }
  if (isPlainRecord(value['limits'])) {
    const limits: ContractCommercialLimits = {};
    const maxTotalAmount = readMoney(value['limits']['maxTotalAmount']);
    if (maxTotalAmount !== null) {
      limits.maxTotalAmount = maxTotalAmount;
    }
    if (typeof value['limits']['allowOverrun'] === 'boolean') {
      limits.allowOverrun = value['limits']['allowOverrun'];
    }
    if (Object.keys(limits).length > 0) {
      terms.limits = limits;
    }
  }
  return terms;
}

/**
 * Preço unitário reajustado: price * (1 + percent/100), arredondamento half-up
 * e soma em escala inteira (BigInt) — sem ponto flutuante.
 */
export function applyUnitPriceAdjustment(unitPrice: string, percent: string): string {
  const base = normalizeMoneyAmount(unitPrice);
  const increase = multiplyMoneyByPercent(base, normalizeMoneyAmount(percent));
  return sumMoneyAmounts([base, increase]);
}

/** Vigência efetiva de um reajuste na data informada. */
export function isAdjustmentEffective(record: ContractAdjustmentRecord, asOf: string): boolean {
  return asOf >= record.effectiveOn;
}
