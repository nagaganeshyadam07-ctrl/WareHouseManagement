/**
 * Pagination and sorting utilities.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(query: any): PaginationParams {
  const page = Math.max(1, parseInt((query.page || query.pageIndex) as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt((query.pageSize || query.limit) as string) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export function parseSort(query: any, allowedColumns: string[], defaultSort: string = 'id'): SortParams {
  const sortBy = allowedColumns.includes(query.sortBy as string) ? (query.sortBy as string) : defaultSort;
  const rawDirection = (query.sortDirection || query.sortOrder as string)?.toUpperCase();
  const sortOrder = rawDirection === 'DESC' ? 'DESC' : 'ASC';
  return { sortBy, sortOrder };
}

export function paginatedResponse(data: any[], total: number, pagination: PaginationParams) {
  const totalPages = Math.ceil(total / pagination.limit) || 1;
  return {
    data,
    total,
    page: pagination.page,
    pageSize: pagination.limit,
    totalPages,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
    },
  };
}
