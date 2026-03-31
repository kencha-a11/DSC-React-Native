// services/api/dashboard.ts
import api from '@/api/axios';

// Helper to add cache-busting timestamp
const withCacheBust = (params?: Record<string, any>) => {
    return {
        ...params,
        _t: Date.now(),
    };
};

interface DateRange {
    start_date?: string;
    end_date?: string;
}

interface DashboardStats {
    total_sales: number;
    total_revenue: number;
    total_products: number;
    total_users: number;
    low_stock_items: number;
    out_of_stock_items: number;
    active_users: number;
    avg_transaction_value: number;
}

interface DailySalesItem {
    date: string;
    amount: number;
    transactions: number;
}

interface CategoryPerformanceItem {
    category: string;
    revenue: number;
    items_sold: number;
}

interface TopProduct {
    id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
    category: string;
}

interface RecentTransaction {
    id: number;
    user_id: number;
    total_amount: number;
    created_at: string;
    user_name: string;
}

interface InventoryAlert {
    id: number;
    name: string;
    stock_quantity: number;
    status: string;
    low_stock_threshold: number;
}

interface KRI {
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

interface RIPerformance {
    [key: string]: {
        value: number;
        target: number;
        unit: string;
        trend: number;
        status: string;
        formula?: string;
        benchmark?: string;
    };
}

interface RIsAndPIs {
    sales_performance: Record<string, RIPerformance>;
    operational_efficiency: Record<string, RIPerformance>;
    customer_satisfaction: Record<string, RIPerformance>;
}

interface WinningKPI {
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

interface CompleteDashboardData {
    stats: DashboardStats;
    daily_sales: DailySalesItem[];
    category_performance: CategoryPerformanceItem[];
    top_products: TopProduct[];
    recent_transactions: RecentTransaction[];
    inventory_alerts: InventoryAlert[];
    kris: KRI[];
    ri_pi: RIsAndPIs;
    winning_kpis: WinningKPI[];
}

/**
 * Get dashboard statistics (top cards)
 * @param dateRange Optional start/end dates
 */
export const getDashboardStats = async (dateRange?: DateRange): Promise<DashboardStats> => {
    const response = await api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats', {
        params: withCacheBust(dateRange),
    });
    return response.data.data;
};

/**
 * Get daily sales trend for the last N days
 * @param days Number of days (default 7)
 */
export const getDailySalesTrend = async (days: number = 7): Promise<DailySalesItem[]> => {
    const response = await api.get<{ success: boolean; data: DailySalesItem[] }>('/dashboard/daily-sales', {
        params: withCacheBust({ days }),
    });
    return response.data.data;
};

/**
 * Get category performance
 * @param dateRange Optional start/end dates
 */
export const getCategoryPerformance = async (dateRange?: DateRange): Promise<CategoryPerformanceItem[]> => {
    const response = await api.get<{ success: boolean; data: CategoryPerformanceItem[] }>('/dashboard/category-performance', {
        params: withCacheBust(dateRange),
    });
    return response.data.data;
};

/**
 * Get top performing products
 * @param limit Number of products to return (default 5)
 * @param dateRange Optional start/end dates
 */
export const getTopProducts = async (limit: number = 5, dateRange?: DateRange): Promise<TopProduct[]> => {
    const response = await api.get<{ success: boolean; data: TopProduct[] }>('/dashboard/top-products', {
        params: withCacheBust({ limit, ...dateRange }),
    });
    return response.data.data;
};

/**
 * Get recent transactions
 * @param limit Number of transactions (default 5)
 */
export const getRecentTransactions = async (limit: number = 5): Promise<RecentTransaction[]> => {
    const response = await api.get<{ success: boolean; data: RecentTransaction[] }>('/dashboard/recent-transactions', {
        params: withCacheBust({ limit }),
    });
    return response.data.data;
};

/**
 * Get inventory alerts (low stock and out of stock)
 */
export const getInventoryAlerts = async (): Promise<InventoryAlert[]> => {
    const response = await api.get<{ success: boolean; data: InventoryAlert[] }>('/dashboard/inventory-alerts', {
        params: withCacheBust(),
    });
    return response.data.data;
};

/**
 * Get Key Result Indicators (KRIs) – Top 10% strategic metrics
 * @param dateRange Optional start/end dates
 */
export const getKRIs = async (dateRange?: DateRange): Promise<KRI[]> => {
    const response = await api.get<{ success: boolean; data: KRI[] }>('/dashboard/kris', {
        params: withCacheBust(dateRange),
    });
    return response.data.data;
};

/**
 * Get Result Indicators (RI) and Performance Indicators (PI) – Middle 80%
 * @param dateRange Optional start/end dates
 */
export const getRIsAndPIs = async (dateRange?: DateRange): Promise<RIsAndPIs> => {
    const response = await api.get<{ success: boolean; data: RIsAndPIs }>('/dashboard/ri-pi', {
        params: withCacheBust(dateRange),
    });
    return response.data.data;
};

/**
 * Get Winning KPIs – Top 10% competitive advantage metrics
 * @param dateRange Optional start/end dates
 */
export const getWinningKPIs = async (dateRange?: DateRange): Promise<WinningKPI[]> => {
    const response = await api.get<{ success: boolean; data: WinningKPI[] }>('/dashboard/winning-kpis', {
        params: withCacheBust(dateRange),
    });
    return response.data.data;
};

/**
 * Get complete dashboard data in one request
 * @param dateRange Optional start/end dates
 */
export const getCompleteDashboard = async (dateRange?: DateRange): Promise<CompleteDashboardData> => {
    const response = await api.get<{ success: boolean; data: CompleteDashboardData }>('/dashboard/complete', {
        params: withCacheBust(dateRange),
    });
    return response.data.data;
};