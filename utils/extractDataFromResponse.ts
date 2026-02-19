export function extractDataFromResponse(response: any) {
    const raw = response?.data ?? response ?? {};

    // If raw.data is an array, use it; otherwise, if raw itself is array, use it
    const data = Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw)
            ? raw
            : [];

    const perPage = Math.max(1, Number(raw.per_page) || 10);
    const currentPage = Math.max(1, Number(raw.current_page) || 1);
    const lastPage = Math.max(1, Number(raw.last_page) || 1);
    const total = Math.max(0, Number(raw.total) || data.length);

    const hasMore =
        typeof raw.hasMore === "boolean" ? raw.hasMore : currentPage < lastPage;

    return {
        data,
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total,
        hasMore,
    };
}
