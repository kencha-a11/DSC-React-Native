import api from '@/api/axios';

export interface InventoryLog {
  id: number;
  user_name: string;
  action: string;
  quantity_change: number;
  product_name: string;
  created_at: string;
}

export interface InventoryLogResponse {
  data: InventoryLog[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const getInventoryLogs = async (params?: { page?: number; limit?: number; search?: string; user_id?: number }): Promise<InventoryLogResponse> => {
  const response = await api.get('/logs/inventory', { params });
  return response.data;
};
