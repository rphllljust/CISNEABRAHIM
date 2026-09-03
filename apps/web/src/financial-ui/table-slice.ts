export const BACKOFFICE_TABLE_PAGE_SIZE = 50;

export function sliceTablePage<T>(items: readonly T[], pageNumber: number, pageSize = BACKOFFICE_TABLE_PAGE_SIZE): T[] {
  const safePage = Math.max(1, pageNumber);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function tablePageCount(itemCount: number, pageSize = BACKOFFICE_TABLE_PAGE_SIZE): number {
  if (itemCount <= 0) {
    return 1;
  }
  return Math.ceil(itemCount / pageSize);
}
