// services/saleService.ts
import api from "@/api/axios";

export interface SaleItem {
    product_id: number;
    quantity: number;
}

export interface CreateSalePayload {
    items: SaleItem[];
    total_amount: number;
    device_datetime?: string; // optional ISO string
}

export interface SaleResponse {
    message: string;
    sale_id: number;
}

export async function createSale(payload: CreateSalePayload): Promise<SaleResponse> {
    try {
        const response = await api.post<SaleResponse>("/sales/store", payload);
        return response.data;
    } catch (error: any) {
        console.error("[sellService] ❌ Error creating sale:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to create sale");
    }
}
