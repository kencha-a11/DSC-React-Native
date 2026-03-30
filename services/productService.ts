import api from "@/api/axios";

// ======================== Types ========================

export interface Product {
    id: number;
    name: string;
    barcode: string | null;
    price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    status: "stock" | "low stock" | "out of stock";
    image: string | null;
    image_exists: boolean;
    category_id: number | null;
    category_ids: number[];
    created_at?: string;
    updated_at?: string;
}

export interface ProductFilters {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    perPage?: number;
    sort?: 'stock' | 'out_of_stock';
    _t?: number;
}

export interface ProductsPage {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    hasMore: boolean;
}

// ======================== Transformation ========================

const transformProduct = (raw: any): Product => ({
    id: raw.id,
    name: raw.name,
    barcode: raw.barcode ?? null,
    price: typeof raw.price === "string" ? parseFloat(raw.price) : raw.price,
    stock_quantity: raw.stock_quantity,
    low_stock_threshold: raw.low_stock_threshold,
    status: raw.status,
    image: raw.image_url ?? null,
    image_exists: raw.image_exists ?? false,
    category_id: raw.categories?.[0]?.id ?? raw.category_id ?? null,
    category_ids: raw.categories?.map((c: any) => c.id) ?? [],
    created_at: raw.created_at,
    updated_at: raw.updated_at,
});

// ======================== Fetch ========================

export const getProductsApi = async (filters: ProductFilters = {}, signal?: AbortSignal): Promise<ProductsPage> => {
    const { data } = await api.get("/products", {
        params: {
            page: filters.page ?? 1,
            perPage: filters.perPage ?? 50,
            ...(filters.search && { search: filters.search }),
            ...(filters.category && { category: filters.category }),
            ...(filters.status && { status: filters.status }),
            ...(filters.sort && { sort: filters.sort }),
            _t: Date.now(),
        },
        signal,
        timeout: 30000,
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        },
    });

    // Validate response structure
    if (!data?.data || !Array.isArray(data.data)) {
        throw new Error(`Invalid response from GET /products`);
    }

    return {
        data: data.data.map(transformProduct),
        current_page: data.current_page,
        last_page: data.last_page,
        per_page: data.per_page,
        total: data.total,
        hasMore: data.current_page < data.last_page,
    };
};

export const getProductByBarcodeApi = async (barcode: string): Promise<Product | null> => {
    try {
        const { data } = await api.get(`/products/barcode/${barcode}`);
        return data ? transformProduct(data) : null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

// ======================== Mutations ========================

export const createProductApi = async (formData: FormData): Promise<Product> => {
    const { data } = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return transformProduct(data.product);
};

export const updateProductApi = async (id: number, formData: FormData): Promise<Product> => {
    const { data } = await api.post(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        params: { _method: "PUT" },
    });
    return transformProduct(data.product);
};

export const deleteProductApi = (id: number) => api.delete(`/products/${id}`);

export const deleteMultipleProductsApi = (ids: number[]) =>
    api.post("/products/delete-multiple", { products: ids });

export const restockProductApi = async (id: number, quantity: number) => {
    const { data } = await api.post(`/products/${id}/restock`, { quantity });
    return {
        product: transformProduct(data.product),
        new_stock: data.new_stock,
    };
};

export const deductProductApi = async (id: number, quantity: number, reason?: string) => {
    const { data } = await api.post(`/products/${id}/deduct`, { quantity, reason });
    return {
        product: transformProduct(data.product),
        new_stock: data.new_stock,
    };
};