import api from '@/api/axios';

export interface SaleLog {
  id: number;
  user_id: number;
  total_amount: string | number;
  payment_method: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
  };
  sale_items?: Array<{
    id: number;
    product_id: number;
    quantity: number;
    unit_price: string;
    subtotal: string;
    product?: {
      name: string;
    };
  }>;
}

export interface SalesLogResponse {
  data: SaleLog[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const getSalesLogs = async (params?: Record<string, any>): Promise<SalesLogResponse> => {
  const response = await api.get('/logs/sales', { params });
  return response.data;
};
