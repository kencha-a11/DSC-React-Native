// services/api/dashboard.ts
import api from '@/api/axios';

interface DateRange {
    start_date?: string;
    end_date?: string;
}

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
    // FIX #4: Matches the 'as category' alias in the controller SELECT
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
    history: { period: string; value: number }[];
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
    history: { period: string; value: number }[];
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

// ─── Individual endpoints ────────────────────────────────────────────────────

export const getDashboardStats = async (dateRange?: DateRange): Promise<DashboardStats> => {
    const response = await api.get<{ success: boolean; data: DashboardStats }>(
        '/dashboard/stats',
        { params: dateRange },
    );
    return response.data.data;
};

export const getDailySalesTrend = async (days: number = 7): Promise<DailySalesItem[]> => {
    const response = await api.get<{ success: boolean; data: DailySalesItem[] }>(
        '/dashboard/daily-sales',
        { params: { days } },
    );
    return response.data.data;
};

export const getCategoryPerformance = async (dateRange?: DateRange): Promise<CategoryPerformanceItem[]> => {
    const response = await api.get<{ success: boolean; data: CategoryPerformanceItem[] }>(
        '/dashboard/category-performance',
        { params: dateRange },
    );
    return response.data.data;
};

export const getTopProducts = async (
    limit: number = 5,
    dateRange?: DateRange,
): Promise<TopProduct[]> => {
    const response = await api.get<{ success: boolean; data: TopProduct[] }>(
        '/dashboard/top-products',
        { params: { limit, ...dateRange } },
    );
    return response.data.data;
};

export const getRecentTransactions = async (limit: number = 5): Promise<RecentTransaction[]> => {
    const response = await api.get<{ success: boolean; data: RecentTransaction[] }>(
        '/dashboard/recent-transactions',
        { params: { limit } },
    );
    return response.data.data;
};

export const getInventoryAlerts = async (): Promise<InventoryAlert[]> => {
    const response = await api.get<{ success: boolean; data: InventoryAlert[] }>(
        '/dashboard/inventory-alerts',
    );
    return response.data.data;
};

export const getKRIs = async (dateRange?: DateRange): Promise<KRI[]> => {
    const response = await api.get<{ success: boolean; data: KRI[] }>(
        '/dashboard/kris',
        { params: dateRange },
    );
    return response.data.data;
};

export const getRIsAndPIs = async (dateRange?: DateRange): Promise<RIsAndPIs> => {
    const response = await api.get<{ success: boolean; data: RIsAndPIs }>(
        '/dashboard/ri-pi',
        { params: dateRange },
    );
    return response.data.data;
};

export const getWinningKPIs = async (dateRange?: DateRange): Promise<WinningKPI[]> => {
    const response = await api.get<{ success: boolean; data: WinningKPI[] }>(
        '/dashboard/winning-kpis',
        { params: dateRange },
    );
    return response.data.data;
};

// ─── Complete dashboard (single request, preferred) ──────────────────────────
// FIX #6: Use this instead of 5 separate calls in the screen. The controller
// already handles partial failures internally, so null-check each field.

export const getCompleteDashboard = async (
    dateRange?: DateRange,
): Promise<CompleteDashboardData> => {
    const response = await api.get<{ success: boolean; data: CompleteDashboardData }>(
        '/dashboard/complete',
        { params: dateRange },
    );
    return response.data.data;
};