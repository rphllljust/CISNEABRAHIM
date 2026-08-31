export function orderByCreatedAtDesc(alias?: string): string {
  const prefix = alias ? `${alias}.` : '';
  return `${prefix}created_at DESC, ${prefix}id DESC`;
}