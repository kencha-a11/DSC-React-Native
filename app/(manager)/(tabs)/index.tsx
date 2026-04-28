// app/(manager)/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryPie,
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryAxis,
} from "victory-native";

import Header from "@/components/layout/Header";
import {
  getDashboardStats,
  getDailySalesTrend,
  getCategoryPerformance,
  getTopProducts,
  getRecentTransactions,
  getInventoryAlerts,
  DashboardStats,
  DailySalesItem,
  TopProduct,
  CategoryPerformanceItem,
  RecentTransaction,
  InventoryAlert,
} from "@/services/dashboard/managerService";
import { useProducts } from "@/context/ProductContext";

const { width: screenWidth } = Dimensions.get("window");

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partialError, setPartialError] = useState<string | null>(null);

  // API data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailySales, setDailySales] = useState<DailySalesItem[]>([]);
  const [categories, setCategories] = useState<CategoryPerformanceItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  // Use ProductContext directly for real-time inventory alerts instead of relying solely on API
  const { products, restockProduct } = useProducts();

  const localInventoryAlerts = useMemo(() => {
    return products
      .filter((p) => {
        const qty = Number(p.stock_quantity) || 0;
        const threshold = Number(p.low_stock_threshold) || 10;
        return qty <= threshold;
      })
      .map((p) => {
        const qty = Number(p.stock_quantity) || 0;
        return {
          id: p.id,
          name: p.name,
          status: qty === 0 ? "out of stock" : "low stock",
          stock_quantity: qty,
        };
      })
      .sort((a, b) => {
        if (a.status === "out of stock" && b.status !== "out of stock") return -1;
        if (b.status === "out of stock" && a.status !== "out of stock") return 1;
        return a.stock_quantity - b.stock_quantity;
      });
  }, [products]);

  const localLowStockCount = localInventoryAlerts.filter(a => a.status === "low stock").length;
  const localOutOfStockCount = localInventoryAlerts.filter(a => a.status === "out of stock").length;
  const localTotalAlerts = localInventoryAlerts.length;

  const fetchAllData = useCallback(async () => {
    setPartialError(null);
    const results = await Promise.allSettled([
      getDashboardStats(),
      getDailySalesTrend(7),
      getCategoryPerformance(),
      getTopProducts(5),
      getRecentTransactions(5),
    ]);

    const [statsResult, dailyResult, categoryResult, topProductsResult, transactionsResult] = results;

    if (statsResult.status === "fulfilled") setStats(statsResult.value);
    if (dailyResult.status === "fulfilled") setDailySales(dailyResult.value);
    if (categoryResult.status === "fulfilled") setCategories(categoryResult.value);
    if (topProductsResult.status === "fulfilled") setTopProducts(topProductsResult.value);
    if (transactionsResult.status === "fulfilled") setRecentTransactions(transactionsResult.value);

    const failed = results.filter(r => r.status === "rejected").length;
    if (failed > 0) {
      setPartialError(`⚠️ ${failed} part(s) could not be loaded. Pull to refresh.`);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatCurrency = (amount: number) =>
    `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const barChartData = dailySales.map(item => ({ day: item.date, revenue: item.amount }));
  const pieChartData = categories.slice(0, 5).map(cat => ({
    x: cat.category.length > 15 ? cat.category.substring(0, 15) + "..." : cat.category,
    y: cat.revenue,
    label: formatCurrency(cat.revenue),
  }));
  const sortedCategories = [...categories].sort((a, b) => b.revenue - a.revenue);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ED277C" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const hasAnyData = stats || dailySales.length || categories.length || topProducts.length || recentTransactions.length;
  if (!hasAnyData && !loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>Failed to load dashboard data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Manager Dashboard" showBackButton={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ED277C"]} tintColor="#ED277C" />}
      >
        <View style={styles.content}>
          {partialError && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={18} color="#FF9800" />
              <Text style={styles.warningText}>{partialError}</Text>
            </View>
          )}

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="cart-outline" size={24} color="#ED277C" />
              <Text style={styles.statValue}>{stats?.total_sales?.toLocaleString() || 0}</Text>
              <Text style={styles.statLabel}>Total Sales</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={24} color="#ED277C" />
              <Text style={styles.statValue}>{formatCurrency(stats?.total_revenue || 0)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cube-outline" size={24} color="#ED277C" />
              <Text style={styles.statValue}>{stats?.total_products || 0}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={24} color="#ED277C" />
              <Text style={styles.statValue}>{stats?.total_users || 0}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>

          {/* Performance Summary */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Performance Summary</Text>
            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={styles.statsItemValue}>{formatCurrency(stats?.avg_transaction_value || 0)}</Text>
                <Text style={styles.statsItemLabel}>Avg Transaction</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsItem}>
                <Text style={styles.statsItemValue}>{localTotalAlerts}</Text>
                <Text style={styles.statsItemLabel}>Stock Alerts</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsItem}>
                <Text style={styles.statsItemValue}>{stats?.active_users || 0}</Text>
                <Text style={styles.statsItemLabel}>Active Staff</Text>
              </View>
            </View>
          </View>

          {/* Revenue Trend Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Revenue Trend (Last 7 Days)</Text>
            {barChartData.length > 0 ? (
              <VictoryChart theme={VictoryTheme.material} width={screenWidth - 32} height={250} domainPadding={{ x: 20 }} containerComponent={<VictoryVoronoiContainer />}>
                <VictoryAxis tickValues={barChartData.map((_, i) => i)} tickFormat={barChartData.map(d => d.day)} style={{ tickLabels: { fontSize: 11, fill: "#6B7280" } }} />
                <VictoryAxis dependentAxis tickFormat={x => `₱${x / 1000}K`} style={{ tickLabels: { fontSize: 11, fill: "#6B7280" } }} />
                <VictoryBar data={barChartData} x="day" y="revenue" style={{ data: { fill: "#ED277C", width: 32, borderRadius: 6 } }} labels={({ datum }) => formatCurrency(datum.revenue)} labelComponent={<VictoryTooltip />} />
                <VictoryLine data={barChartData} x="day" y="revenue" style={{ data: { stroke: "#FF6B9D", strokeWidth: 2 } }} />
              </VictoryChart>
            ) : (
              <Text style={styles.noDataText}>No data available</Text>
            )}
          </View>

          {/* Category Performance */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top Categories by Revenue</Text>
            <Text style={styles.chartSubtitle}>Revenue distribution & detailed ranking</Text>
            {pieChartData.length > 0 ? (
              <VictoryPie data={pieChartData} width={screenWidth - 32} height={220} colorScale={["#ED277C", "#FF6B9D", "#FFB3C6", "#FFD6E5", "#FFEAF1"]} labelRadius={70} style={{ labels: { fontSize: 10, fill: "#333", fontWeight: "bold" } }} labelComponent={<VictoryTooltip />} />
            ) : (
              <Text style={styles.noDataText}>No category data available</Text>
            )}
            <View style={styles.divider} />
            <Text style={styles.listTitle}>Top Categories by Revenue (Ranked)</Text>
            {sortedCategories.slice(0, 5).map((category, index) => (
              <View key={category.category} style={styles.categoryRow}>
                <View style={styles.categoryRank}><Text style={styles.categoryRankText}>{index + 1}</Text></View>
                <View style={styles.categoryInfo}><Text style={styles.categoryName}>{category.category}</Text><Text style={styles.categoryStats}>{category.items_sold} items sold</Text></View>
                <Text style={styles.categoryRevenue}>{formatCurrency(category.revenue)}</Text>
              </View>
            ))}
          </View>

          {/* Top Products */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Top Performing Products</Text>
            {topProducts.map((product, index) => (
              <View key={product.id} style={styles.productRow}>
                <View style={styles.productRank}><Text style={styles.productRankText}>{index + 1}</Text></View>
                <View style={styles.productInfo}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productCategory}>{product.category}</Text></View>
                <Text style={styles.productRevenue}>{formatCurrency(product.revenue)}</Text>
              </View>
            ))}
          </View>

          {/* Recent Transactions */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Recent Transactions</Text>
            {recentTransactions.map(transaction => (
              <View key={transaction.id} style={styles.transactionRow}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionAvatar}><Ionicons name="person-outline" size={18} color="#ED277C" /></View>
                  <View><Text style={styles.transactionUser}>{transaction.user_name}</Text><Text style={styles.transactionTime}>{transaction.created_at}</Text></View>
                </View>
                <Text style={styles.transactionAmount}>{formatCurrency(transaction.total_amount)}</Text>
              </View>
            ))}
          </View>

          {/* ✅ Inventory Alerts – using real-time local state */}
          {localInventoryAlerts.length > 0 && (
            <View style={[styles.infoCard, styles.alertCard]}>
              <Text style={styles.infoTitle}>⚠️ Inventory Alerts</Text>
              {localInventoryAlerts.slice(0, 5).map((product) => (
                <View key={product.id} style={styles.alertRow}>
                  <Ionicons
                    name={product.status === "out of stock" ? "alert-circle" : "warning"}
                    size={20}
                    color={product.status === "out of stock" ? "#F44336" : "#FF9800"}
                  />
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertProductName}>{product.name}</Text>
                    <Text style={styles.alertDetails}>
                      {product.status === "out of stock"
                        ? "Out of stock"
                        : `Low stock: ${product.stock_quantity} left`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Inventory Status Summary */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Inventory Status</Text>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Low Stock Items:</Text><Text style={[styles.infoValue, { color: "#FF9800" }]}>{localLowStockCount}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Out of Stock Items:</Text><Text style={[styles.infoValue, { color: "#F44336" }]}>{localOutOfStockCount}</Text></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA", padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
  errorText: { fontSize: 14, color: "#F44336", textAlign: "center", marginTop: 12, marginBottom: 20 },
  retryButton: { backgroundColor: "#ED277C", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  content: { padding: 16, paddingBottom: 32 },
  warningBanner: { flexDirection: "row", backgroundColor: "#FFF3E0", padding: 10, borderRadius: 8, marginBottom: 12, alignItems: "center", gap: 8 },
  warningText: { fontSize: 12, color: "#FF9800", flex: 1 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16, gap: 12 },
  statCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, width: (screenWidth - 44) / 2, borderTopWidth: 3, borderTopColor: "#ED277C", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "bold", color: "#1F2937", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  chartCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 4 },
  chartSubtitle: { fontSize: 12, color: "#9CA3AF", marginBottom: 12 },
  noDataText: { textAlign: "center", color: "#9CA3AF", paddingVertical: 40 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
  listTitle: { fontSize: 14, fontWeight: "600", color: "#1F2937", marginBottom: 8 },
  infoCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  infoLabel: { fontSize: 14, color: "#6B7280" },
  infoValue: { fontSize: 14, fontWeight: "500", color: "#1F2937" },
  categoryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  categoryRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#ED277C10", justifyContent: "center", alignItems: "center", marginRight: 12 },
  categoryRankText: { fontSize: 12, fontWeight: "bold", color: "#ED277C" },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: "500", color: "#1F2937" },
  categoryStats: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  categoryRevenue: { fontSize: 14, fontWeight: "600", color: "#10B981" },
  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  productRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#ED277C10", justifyContent: "center", alignItems: "center", marginRight: 12 },
  productRankText: { fontSize: 12, fontWeight: "bold", color: "#ED277C" },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "500", color: "#1F2937" },
  productCategory: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  productRevenue: { fontSize: 14, fontWeight: "600", color: "#10B981" },
  transactionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  transactionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  transactionAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ED277C10", justifyContent: "center", alignItems: "center" },
  transactionUser: { fontSize: 14, fontWeight: "500", color: "#1F2937" },
  transactionTime: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  transactionAmount: { fontSize: 15, fontWeight: "600", color: "#ED277C" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 12, marginTop: 4 },
  statsItem: { alignItems: "center", flex: 1 },
  statsItemValue: { fontSize: 24, fontWeight: "bold", color: "#ED277C" },
  statsItemLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  statsDivider: { width: 1, height: 40, backgroundColor: "#E5E7EB" },
  alertCard: { borderLeftWidth: 4, borderLeftColor: "#FF9800" },
  alertRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", gap: 12 },
  alertInfo: { flex: 1 },
  alertProductName: { fontSize: 14, fontWeight: "500", color: "#1F2937" },
  alertDetails: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  alertButton: { backgroundColor: "#ED277C", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  alertButtonText: { color: "#fff", fontSize: 12, fontWeight: "500" },
});