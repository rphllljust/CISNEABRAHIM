const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLATE_PATTERN = /^[A-Z0-9]{7}$/;

function isBusinessCodeLike(value: string): boolean {
  if (value.length < 3) {
    return false;
  }
  if (/[';]/.test(value)) {
    return false;
  }
  if (/[-_/]/.test(value) && /^[A-Z0-9][A-Z0-9._/-]+$/.test(value)) {
    return true;
  }
  if (/\d/.test(value) && /[A-Z]/.test(value)) {
    return true;
  }
  return /^(SO|PO|RC|SR|OS)/.test(value);
}

export type SearchQueryKind = 'uuid' | 'cnpj' | 'plate' | 'code' | 'text';

export type NormalizedSearchQuery = {
  raw: string;
  kind: SearchQueryKind;
  term: string;
  prefixTerm: string;
};

export function normalizeSearchQuery(raw: string): NormalizedSearchQuery | null {
  const trimmed = raw.trim().slice(0, 120);
  if (trimmed.length < 2) {
    return null;
  }

  if (UUID_PATTERN.test(trimmed)) {
    return {
      raw: trimmed,
      kind: 'uuid',
      term: trimmed.toLowerCase(),
      prefixTerm: trimmed.toLowerCase(),
    };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 14) {
    return {
      raw: trimmed,
      kind: 'cnpj',
      term: digits,
      prefixTerm: digits,
    };
  }

  const plateCandidate = trimmed.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (PLATE_PATTERN.test(plateCandidate)) {
    return {
      raw: trimmed,
      kind: 'plate',
      term: plateCandidate,
      prefixTerm: plateCandidate,
    };
  }

  const codeCandidate = trimmed.replace(/\s+/g, '').toUpperCase();
  if (isBusinessCodeLike(codeCandidate)) {
    return {
      raw: trimmed,
      kind: 'code',
      term: codeCandidate,
      prefixTerm: `${codeCandidate}%`,
    };
  }

  if (trimmed.length < 3) {
    return null;
  }

  return {
    raw: trimmed,
    kind: 'text',
    term: trimmed,
    prefixTerm: `${trimmed}%`,
  };
}

export function escapeLikeWildcards(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}
