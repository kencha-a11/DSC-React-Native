// [API/SERVICE Layer] Purpose: Service layer that defines raw API endpoints (CRUD, barcode lookup, restock, etc.).
import api from "../api/axios";
import { extractDataFromResponse } from "@/utils/extractDataFromResponse";

// ==========================================
// 📦 TYPE DEFINITIONS
// ==========================================

export interface Product {
    id: number;
    name: string;
    barcode: string | null;
    price: string;
    stock_quantity: number;
    status: "stock" | "low stock" | "out of stock";
    image: string;
    low_stock_threshold: number;
    created_at: string;
    updated_at: string;
    categories: Array<{
        id: number;
        name: string;
    }>;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    hasMore: boolean;
}

export interface ProductFilters {
    page?: number;
    perPage?: number;
    search?: string;
    category?: string | null;
    status?: string;
}

// ==========================================
// 🔎 GENERIC FETCH WITH FILTERS
// ==========================================

const fetchProductsApi = async (
    endpoint: string,
    filters: ProductFilters = {}
): Promise<PaginatedResponse<Product>> => {
    const {
        page = 1,
        perPage = 50,
        search = "",
        category = null,
        status = "",
    } = filters;

    console.log(`[SERVICE] Fetching ${endpoint} with filters:`, filters);

    try {
        const response = await api.get(endpoint, {
            params: {
                page,
                perPage,
                search,
                ...(category && category !== "all" && { category }),
                ...(status && { status }),
            },
        });

        console.log(`[SERVICE] ✅ Success fetching ${endpoint}`, response.data);
        return extractDataFromResponse(response);
    } catch (error: any) {
        console.error(
            `[SERVICE] ❌ Error fetching ${endpoint}:`,
            error.response?.data ?? error.message
        );
        return {
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: perPage,
            total: 0,
            hasMore: false,
        };
    }
};

// ==========================================
// 📋 PRODUCT LIST ENDPOINTS
// ==========================================

// [cashier] specific operations
export const getProductsApi = (filters?: ProductFilters) =>
    fetchProductsApi("/products", filters);

export const getSellProductsApi = (filters?: ProductFilters) =>
    fetchProductsApi("/sell/products", filters);

export const getProductByBarcodeApi = async (
    barcode: string
): Promise<Product | null> => {
    console.log("[SERVICE] Looking up product by barcode:", barcode);
    try {
        const response = await api.get(`/products/barcode/${barcode}`);
        console.log("[SERVICE] ✅ Barcode lookup success:", response.data);
        return response.data.success ? response.data.data : null;
    } catch (error: any) {
        console.error(
            "[SERVICE] ❌ Barcode lookup failed:",
            error.response?.data ?? error.message
        );
        return null;
    }
};

// ==========================================
// ✏️ CRUD OPERATIONS
// ==========================================

export const createProductApi = async (formData: FormData) => {
    console.log("[SERVICE] Creating product with formData:", formData);
    try {
        const response = await api.post("/products", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("[SERVICE] ✅ Product created:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[SERVICE] ❌ Create product failed:", error.response?.data);
        throw error;
    }
};

export const updateProductApi = async (id: number, formData: FormData) => {
    console.log("[SERVICE] Updating product:", id, formData);
    try {
        const response = await api.post(`/products/${id}?_method=PUT`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("[SERVICE] ✅ Product updated:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[SERVICE] ❌ Update product failed:", error.response?.data);
        throw error;
    }
};

export const deleteProductApi = async (id: number) => {
    console.log("[SERVICE] Deleting product:", id);
    try {
        const response = await api.delete(`/products/${id}`);
        console.log("[SERVICE] ✅ Product deleted:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[SERVICE] ❌ Delete product failed:", error.response?.data);
        throw error;
    }
};

export const deleteMultipleProductsApi = async (ids: number[]) => {
    console.log("[SERVICE] Bulk deleting products:", ids);
    try {
        const response = await api.delete("/products/multiple", {
            data: { products: ids },
        });
        console.log("[SERVICE] ✅ Bulk delete success:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[SERVICE] ❌ Bulk delete failed:", error.response?.data);
        throw error;
    }
};

// ==========================================
// 🔧 INVENTORY ACTIONS
// ==========================================

export const restockProductApi = async (id: number, quantity: number) => {
    console.log("[SERVICE] Restocking product:", id, "by", quantity);
    try {
        const response = await api.post(`/products/${id}/restock`, { quantity });
        console.log("[SERVICE] ✅ Restock success:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[SERVICE] ❌ Restock failed:", error.response?.data);
        throw error;
    }
};

export const deductProductApi = async (
    id: number,
    quantity: number,
    reason?: string
) => {
    console.log("[SERVICE] Deducting product:", id, "by", quantity, "reason:", reason);
    try {
        const response = await api.post(`/products/${id}/deduct`, {
            quantity,
            reason,
        });
        console.log("[SERVICE] ✅ Deduct success:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[SERVICE] ❌ Deduct failed:", error.response?.data);
        throw error; 
    }
};
