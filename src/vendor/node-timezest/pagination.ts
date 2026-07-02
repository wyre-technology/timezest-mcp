export interface PaginationParams {
  /** Page size (default 20, max usually 100) */
  pageSize?: number;
  /** Cursor for next page */
  startingAfter?: string;
  /** Cursor for previous page */
  endingBefore?: string;
}

export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Pagination metadata */
  pagination?: {
    /** Cursor for next page */
    nextCursor?: string;
    /** Cursor for previous page */
    prevCursor?: string;
    /** Total count (if available) */
    totalCount?: number;
    /** Has more pages */
    hasMore?: boolean;
  };
}

/**
 * Helper function to unwrap paginated responses
 * Some APIs return { data: [...] }, others return arrays directly
 */
export function unwrapResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>;

    // Try common pagination response formats
    if (Array.isArray(obj.data)) {
      return obj.data;
    }

    if (Array.isArray(obj.items)) {
      return obj.items;
    }

    if (Array.isArray(obj.results)) {
      return obj.results;
    }
  }

  return [];
}