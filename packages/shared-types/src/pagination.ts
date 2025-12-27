/**
 * Cursor-based pagination input
 * More efficient than offset-based for large datasets
 */
export interface CursorPaginationInput {
  /**
   * Cursor pointing to a specific record
   * Use the endCursor from previous response for next page
   */
  cursor?: string;

  /**
   * Maximum number of records to return
   * @default 20
   * @maximum 100
   */
  limit?: number;

  /**
   * Field to sort by
   * @default 'createdAt'
   */
  sortBy?: string;

  /**
   * Sort order
   * @default 'desc'
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Page information for cursor-based pagination
 */
export interface PageInfo {
  /**
   * Whether there are more records after this page
   */
  hasNextPage: boolean;

  /**
   * Whether there are records before this page
   */
  hasPreviousPage: boolean;

  /**
   * Cursor pointing to the first record in this page
   */
  startCursor: string | null;

  /**
   * Cursor pointing to the last record in this page
   * Use this as 'cursor' param for next page
   */
  endCursor: string | null;
}

/**
 * Cursor-based pagination output
 */
export interface CursorPaginationOutput<T> {
  /**
   * Array of records for this page
   */
  data: T[];

  /**
   * Pagination metadata
   */
  pageInfo: PageInfo;

  /**
   * Total count of records (optional, expensive to compute)
   */
  totalCount?: number;
}

/**
 * Offset-based pagination input (legacy, less efficient)
 */
export interface OffsetPaginationInput {
  /**
   * Page number (1-indexed)
   * @default 1
   */
  page?: number;

  /**
   * Records per page
   * @default 20
   * @maximum 100
   */
  limit?: number;

  /**
   * Field to sort by
   */
  sortBy?: string;

  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Offset-based pagination output
 */
export interface OffsetPaginationOutput<T> {
  /**
   * Array of records for this page
   */
  data: T[];

  /**
   * Current page number
   */
  page: number;

  /**
   * Records per page
   */
  limit: number;

  /**
   * Total number of records
   */
  totalCount: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there's a next page
   */
  hasNextPage: boolean;

  /**
   * Whether there's a previous page
   */
  hasPreviousPage: boolean;
}

/**
 * Helper to build cursor from record ID
 */
export function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

/**
 * Helper to extract ID from cursor
 */
export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}
