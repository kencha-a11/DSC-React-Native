// services/managerService.ts
import api from '@/api/axios';

// ==================== Types ====================

export interface DashboardStats {
    total_sales: number;
    total_revenue: number;
    total_products: number;
    total_users: number;
    low_stock_items: number;
    out_of_stock_items: number;
    active_users: number;
    avg_transaction_value: number;
}

export interface DailySalesItem {
    date: string;
    amount: number;
    transactions: number;
}

export interface CategoryPerformanceItem {
    category: string;
    revenue: number;
    items_sold: number;
}

export interface TopProduct {
    id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
    category: string;
}

export interface RecentTransaction {
    id: number;
    user_id: number;
    total_amount: number;
    created_at: string;
    user_name: string;
}

export interface InventoryAlert {
    id: number;
    name: string;
    stock_quantity: number;
    status: string;
    low_stock_threshold: number;
}

export interface KRI {
    id: string;
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: number;
    status: string;
    description: string;
    category: string;
    history: Array<{ period: string; value: number }>;
}

export interface RIMetric {
    value: number;
    target: number;
    unit: string;
    trend: number;
    status: string;
    formula?: string;
    benchmark?: string;
}

export interface RIsAndPIs {
    sales_performance: Record<string, RIMetric>;
    operational_efficiency: Record<string, RIMetric>;
    customer_satisfaction: Record<string, RIMetric>;
}

export interface WinningKPI {
    id: string;
    name: string;
    value: number;
    target: number;
    unit: string;
    achievement: number;
    trend: number;
    priority: string;
    actionItems: string[];
    owner: string;
    dueDate: string;
    progress: number;
    history: Array<{ period: string; value: number }>;
}

export interface CompleteDashboardData {
    stats: DashboardStats | null;
    daily_sales: DailySalesItem[] | null;
    category_performance: CategoryPerformanceItem[] | null;
    top_products: TopProduct[] | null;
    recent_transactions: RecentTransaction[] | null;
    inventory_alerts: InventoryAlert[] | null;
    kris: KRI[] | null;
    ri_pi: RIsAndPIs | null;
    winning_kpis: WinningKPI[] | null;
}

// Helper: add cache-busting timestamp and no-cache headers
const freshRequest = async <T>(url: string, params: Record<string, any> = {}): Promise<T> => {
    const response = await api.get(url, {
        params: {
            ...params,
            _t: Date.now(), // forces fresh request
        },
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
    return response.data.data;
};

// ==================== API Functions (with cache-busting) ====================

export const getDashboardStats = async (start_date?: string, end_date?: string): Promise<DashboardStats> => {
    return freshRequest('/dashboard/stats', { start_date, end_date });
};

export const getDailySalesTrend = async (days: number = 7): Promise<DailySalesItem[]> => {
    return freshRequest('/dashboard/daily-sales', { days });
};

export const getCategoryPerformance = async (start_date?: string, end_date?: string): Promise<CategoryPerformanceItem[]> => {
    return freshRequest('/dashboard/category-performance', { start_date, end_date });
};

export const getTopProducts = async (limit: number = 5, start_date?: string, end_date?: string): Promise<TopProduct[]> => {
    return freshRequest('/dashboard/top-products', { limit, start_date, end_date });
};

export const getRecentTransactions = async (limit: number = 5): Promise<RecentTransaction[]> => {
    return freshRequest('/dashboard/recent-transactions', { limit });
};

export const getInventoryAlerts = async (): Promise<InventoryAlert[]> => {
    return freshRequest('/dashboard/inventory-alerts');
};

export const getKRIs = async (start_date?: string, end_date?: string): Promise<KRI[]> => {
    return freshRequest('/dashboard/kris', { start_date, end_date });
};

export const getRIsAndPIs = async (start_date?: string, end_date?: string): Promise<RIsAndPIs> => {
    return freshRequest('/dashboard/ri-pi', { start_date, end_date });
};

export const getWinningKPIs = async (start_date?: string, end_date?: string): Promise<WinningKPI[]> => {
    return freshRequest('/dashboard/winning-kpis', { start_date, end_date });
};

export const getCompleteDashboard = async (start_date?: string, end_date?: string): Promise<CompleteDashboardData> => {
    return freshRequest('/dashboard/complete', { start_date, end_date });
};