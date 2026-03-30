import api from "@/api/axios";

// ======================== Types ========================

export interface CategoryProduct {
    id: number;
    name: string;
    barcode: string | null;
    price: number;
    stock_quantity: number;
    status: string;
    image_url: string | null;
    image_exists: boolean;
}

export interface Category {
    id: number;
    category_name: string;
    products: CategoryProduct[];
    product_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface PaginatedCategories {
    data: Category[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    hasMore: boolean;
}

export interface CategoryProductsResponse {
    category: {
        id: number;
        name: string;
    };
    products: {
        data: CategoryProduct[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        hasMore: boolean;
    };
}

// ======================== Transformation ========================

const transformCategory = (raw: any): Category => ({
    id: raw.id,
    category_name: raw.category_name,
    products: raw.products ?? [],
    product_count: raw.product_count ?? raw.products?.length ?? 0,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
});

// ======================== Fetch ========================

export const getCategoriesApi = async (perPage = 10): Promise<PaginatedCategories> => {
    const { data } = await api.get("/categories", {
        params: {
            perPage,
            _t: Date.now(), // cache busting
        },
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        },
    });
    return {
        data: (data.data ?? []).map(transformCategory),
        current_page: data.current_page,
        last_page: data.last_page,
        per_page: data.per_page,
        total: data.total,
        hasMore: data.current_page < data.last_page,
    };
};

export const getCategoryByIdApi = async (id: number): Promise<Category | null> => {
    try {
        const { data } = await api.get(`/categories/${id}`, {
            params: {
                _t: Date.now(),
            },
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
        });
        return transformCategory(data);
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCategoryProductsApi = async (id: number, page = 1, perPage = 20): Promise<CategoryProductsResponse> => {
    const { data } = await api.get(`/categories/${id}/products`, {
        params: {
            page,
            perPage,
            _t: Date.now(),
        },
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        },
    });
    return data;
};

// ======================== Mutations ========================

export const createCategoryApi = async (name: string, productIds?: number[]): Promise<Category> => {
    const { data } = await api.post("/categories", {
        category_name: name,
        product_ids: productIds ?? [],
    });
    return transformCategory(data.data ?? data);
};

export const updateCategoryApi = async (id: number, name: string, productIds?: number[]): Promise<Category> => {
    const payload: Record<string, any> = { category_name: name };
    if (productIds !== undefined) payload.product_ids = productIds;
    const { data } = await api.put(`/categories/${id}`, payload);
    return transformCategory(data.data ?? data);
};

export const deleteCategoryApi = (id: number) => api.delete(`/categories/${id}`);

export const deleteMultipleCategoriesApi = async (ids: number[]) => {
    if (!ids.length) throw new Error("No categories selected");
    const { data } = await api.post("/categories/delete-multiple", { category_ids: ids });
    return { deleted_count: data.deleted_count };
};