const FORMULA_PREFIX = /^[=+\-@]/;

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const text = String(value);
  const escaped = text.replace(/"/g, '""');
  const needsQuote = /[",\n\r]/.test(escaped) || FORMULA_PREFIX.test(escaped.trimStart());
  const safe = FORMULA_PREFIX.test(escaped.trimStart()) ? `'${escaped}` : escaped;
  return needsQuote || FORMULA_PREFIX.test(escaped.trimStart()) ? `"${safe}"` : safe;
}

export function buildCsvLine(values: unknown[]): string {
  return `${values.map(sanitizeCsvCell).join(',')}\n`;
}

export function buildCsvContent(headers: string[], rows: Record<string, unknown>[], columns: string[]): string {
  const lines = [buildCsvLine(headers)];
  for (const row of rows) {
    lines.push(buildCsvLine(columns.map((column) => row[column] ?? '')));
  }
  return lines.join('');
}
