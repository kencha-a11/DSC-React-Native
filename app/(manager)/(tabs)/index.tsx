import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import {
  StatsGrid,
  SalesTrendChart,
  CategoryPerformanceChart,
  TopProductsList,
  RecentTransactions,
  InventoryAlerts,
  LoadingScreen,
  ErrorScreen,
} from '@/components/manager';
import Header from '@/components/layout/Header';
// FIX #3: Correct import path — file lives at services/api/dashboard.ts
import {
  getCompleteDashboard,
  DashboardStats,
  DailySalesItem,
  TopProduct,
  CategoryPerformanceItem,
  RecentTransaction,
} from '@/services/dashboard';
import { useProducts } from '@/context/ProductContext';

// ─── Local state types (camelCase for component use) ─────────────────────────

interface Stats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  lowStockItems: number;
  outOfStockItems: number;
  activeUsers: number;
  avgTransactionValue: number;
}

const DEFAULT_STATS: Stats = {
  totalSales: 0,
  totalRevenue: 0,
  totalProducts: 0,
  totalUsers: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
  activeUsers: 0,
  avgTransactionValue: 0,
};

// ─── Mapper: API snake_case → component camelCase ────────────────────────────

function mapStats(raw: DashboardStats): Stats {
  return {
    totalSales: raw.total_sales,
    totalRevenue: raw.total_revenue,
    totalProducts: raw.total_products,
    totalUsers: raw.total_users,
    lowStockItems: raw.low_stock_items,
    outOfStockItems: raw.out_of_stock_items,
    activeUsers: raw.active_users,
    avgTransactionValue: raw.avg_transaction_value,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

const DashboardScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [dailySales, setDailySales] = useState<DailySalesItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformanceItem[]>([]);
  const [recentSales, setRecentSales] = useState<RecentTransaction[]>([]);

  // Inventory alerts come from the product context (stays up-to-date with local ops)
  const { products } = useProducts();
  const inventoryAlerts = React.useMemo(
    () => products.filter((p: any) => p.status === 'low stock' || p.status === 'out of stock'),
    [products],
  );

  // Guards against concurrent fetches and stale fingerprint refreshes
  const isFetchingRef = useRef(false);
  const prevFingerprintRef = useRef('');
  const autoRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── fingerprint helper ───────────────────────────────────────────────────
  const getFingerprint = (list: any[]) =>
    list
      .slice()
      .sort((a, b) => a.id - b.id)
      .map(p => `${p.id}:${p.stock_quantity}`)
      .join('|');

  // ── main fetch ───────────────────────────────────────────────────────────
  // FIX #6: Single /dashboard/complete call instead of 5 parallel calls.
  // The controller wraps each sub-call in try/catch, so a single section
  // failing will return null for that key rather than a 500 for everything.
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (isFetchingRef.current) {
      setRefreshing(false);
      return;
    }
    isFetchingRef.current = true;
    if (showLoading) setLoading(true);

    try {
      const data = await getCompleteDashboard();

      // Each field may be null if the controller sub-call failed
      if (data.stats) setStats(mapStats(data.stats));
      if (data.daily_sales) setDailySales(data.daily_sales);
      if (data.category_performance) setCategoryPerformance(data.category_performance);
      if (data.top_products) setTopProducts(data.top_products);
      if (data.recent_transactions) setRecentSales(data.recent_transactions);

      setError(null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // ── pull-to-refresh ──────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData(true);
  }, [fetchDashboardData]);

  // ── auto-refresh when product stock changes ──────────────────────────────
  useEffect(() => {
    if (products.length === 0) {
      prevFingerprintRef.current = getFingerprint(products);
      return;
    }

    const current = getFingerprint(products);

    if (prevFingerprintRef.current && prevFingerprintRef.current !== current) {
      if (autoRefreshTimeoutRef.current) clearTimeout(autoRefreshTimeoutRef.current);
      autoRefreshTimeoutRef.current = setTimeout(() => {
        if (!loading && !refreshing) fetchDashboardData(false);
      }, 500);
    }

    prevFingerprintRef.current = current;

    // FIX #7: Cleanup timeout on unmount to prevent state updates after unmount
    return () => {
      if (autoRefreshTimeoutRef.current) clearTimeout(autoRefreshTimeoutRef.current);
    };
  }, [products, fetchDashboardData, loading, refreshing]);

  // ── initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // ── render ───────────────────────────────────────────────────────────────
  if (loading && !refreshing) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} onRetry={onRefresh} />;

  return (
    <>
      <Header title="Dashboard" showBackButton={false} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
          />
        }
      >
        <View style={styles.content}>
          <StatsGrid stats={stats} />
          <SalesTrendChart dailySales={dailySales} />
          <CategoryPerformanceChart categories={categoryPerformance} />
          <TopProductsList products={topProducts} />
          <RecentTransactions sales={recentSales} />
          <InventoryAlerts products={inventoryAlerts as any} onRefresh={onRefresh} />
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});

export default DashboardScreen;