import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  StatsGrid,
  SalesTrendChart,
  CategoryPerformanceChart,
  TopProductsList,
  RecentTransactions,
  InventoryAlerts,
  LoadingScreen,
  ErrorScreen,
} from '@/components/dashboard';
import Header from "@/components/layout/Header";
import {
  getDashboardStats,
  getDailySalesTrend,
  getCategoryPerformance,
  getTopProducts,
  getRecentTransactions,
} from '@/services/dashboard';
import { useProducts } from '@/context/ProductContext';

// Types (same as before)
interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  lowStockItems: number;
  outOfStockItems: number;
  activeUsers: number;
  avgTransactionValue: number;
}

interface DailySales {
  date: string;
  amount: number;
  transactions: number;
}

interface TopProduct {
  id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
  category: string;
}

interface CategoryPerformance {
  category: string;
  revenue: number;
  items_sold: number;
}

interface RecentTransaction {
  id: number;
  user_id: number;
  total_amount: number;
  created_at: string;
  user_name: string;
}

const DashboardScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    activeUsers: 0,
    avgTransactionValue: 0,
  });
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [recentSales, setRecentSales] = useState<RecentTransaction[]>([]);

  // Access product context to listen for changes
  const { products, refreshProducts } = useProducts();

  // Compute inventory alerts locally from the fresh products list
  const inventoryAlerts = React.useMemo(() => {
    const alerts = products.filter(p => p.status === 'low stock' || p.status === 'out of stock');
    console.log('Dashboard: inventoryAlerts recomputed', alerts.length);
    return alerts;
  }, [products]);

  // Ref to store the previous quantity fingerprint
  const prevQuantityFingerprint = useRef<string>('');
  // Ref to prevent multiple concurrent data fetches
  const isFetchingRef = useRef(false);
  // Ref for debouncing auto-refresh after product quantity changes
  const autoRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: compute a unique fingerprint of product IDs and stock quantities
  const getQuantityFingerprint = (products: any[]) => {
    const fingerprint = products
      .slice()
      .sort((a, b) => a.id - b.id)
      .map(p => `${p.id}:${p.stock_quantity}`)
      .join('|');
    console.log('Dashboard: fingerprint generated', fingerprint.slice(0, 100));
    return fingerprint;
  };

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (isFetchingRef.current) {
      console.log('Dashboard: fetch already in progress, skipping');
      setRefreshing(false);
      return;
    }
    isFetchingRef.current = true;
    if (showLoading) setLoading(true);
    console.log('Dashboard: fetching data...');

    try {
      const [
        statsData,
        dailySalesData,
        categoryData,
        topProductsData,
        recentTransactionsData,
      ] = await Promise.all([
        getDashboardStats(),
        getDailySalesTrend(7),
        getCategoryPerformance(),
        getTopProducts(5),
        getRecentTransactions(5),
      ]);

      setStats({
        totalSales: statsData.total_sales,
        totalRevenue: statsData.total_revenue,
        totalProducts: statsData.total_products,
        totalUsers: statsData.total_users,
        lowStockItems: statsData.low_stock_items,
        outOfStockItems: statsData.out_of_stock_items,
        activeUsers: statsData.active_users,
        avgTransactionValue: statsData.avg_transaction_value,
      });
      setDailySales(dailySalesData);
      setCategoryPerformance(categoryData);
      setTopProducts(topProductsData);
      setRecentSales(recentTransactionsData);

      setError(null);
      console.log('Dashboard: data fetched successfully');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Manual refresh (pull-to-refresh)
  const onRefresh = async () => {
    console.log('Dashboard: manual refresh triggered');
    setRefreshing(true);
    await fetchDashboardData(true);
  };

  // Auto-refresh ONLY when product quantities change
  useEffect(() => {
    console.log('Dashboard: products changed, length:', products.length);
    if (products.length === 0) {
      prevQuantityFingerprint.current = getQuantityFingerprint(products);
      console.log('Dashboard: initial fingerprint set (empty)');
      return;
    }

    const currentFingerprint = getQuantityFingerprint(products);
    console.log('Dashboard: prev fingerprint:', prevQuantityFingerprint.current.slice(0, 100));
    console.log('Dashboard: current fingerprint:', currentFingerprint.slice(0, 100));
    if (prevQuantityFingerprint.current && prevQuantityFingerprint.current !== currentFingerprint) {
      console.log('Dashboard: fingerprint changed, scheduling refresh');
      if (autoRefreshTimeoutRef.current) clearTimeout(autoRefreshTimeoutRef.current);
      autoRefreshTimeoutRef.current = setTimeout(() => {
        if (!loading && !refreshing) {
          console.log('Dashboard: executing background refresh after fingerprint change');
          fetchDashboardData(false);
        } else {
          console.log('Dashboard: refresh skipped, loading or refreshing is true');
        }
      }, 500);
    } else {
      console.log('Dashboard: fingerprint unchanged, no refresh');
    }
    prevQuantityFingerprint.current = currentFingerprint;
  }, [products, fetchDashboardData, loading, refreshing]);

  // Initial load
  useEffect(() => {
    console.log('Dashboard: initial load');
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  if (loading && !refreshing) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} onRetry={onRefresh} />;

  return (
    <>
      <Header title="Dashboard" showBackButton={false} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
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