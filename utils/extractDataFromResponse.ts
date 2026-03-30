// utils/extractDataFromResponse.ts

/**
 * Extracts a paginated response from an Axios response.
 * Handles: { data: { data: [], current_page, ... } } and { data: [], current_page, ... }
 */
export function extractDataFromResponse<T = any>(response: any): {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    hasMore: boolean;
} {
    const raw = response?.data ?? response ?? {};

    const data: T[] = Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw)
            ? raw
            : [];

    const currentPage = Math.max(1, Number(raw.current_page) || 1);
    const lastPage = Math.max(1, Number(raw.last_page) || 1);
    const perPage = Math.max(1, Number(raw.per_page) || 10);
    const total = Math.max(0, Number(raw.total) || data.length);
    const hasMore = typeof raw.hasMore === "boolean"
        ? raw.hasMore
        : currentPage < lastPage;

    return {
        data,
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total,
        hasMore
    };
}

/**
 * Extracts a single item from an Axios response.
 * Handles: { data: { id, ... } } and { id, ... } (flat)
 */
export function extractItemFromResponse<T = any>(response: any): T {
    const raw = response?.data ?? response;
    // If the server wraps in { data: {...} }, unwrap it
    return (raw?.data ?? raw) as T;
}

/**
 * Extracts a message from response (for delete operations, etc.)
 */
export function extractMessageFromResponse(response: any): string {
    const raw = response?.data ?? response;
    return raw?.message || raw?.data?.message || "Operation completed";
}