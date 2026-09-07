export interface PageMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export type SortDirection = "asc" | "desc";
