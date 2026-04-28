// app/(superadmin)/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
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
  DashboardStats,
  DailySalesItem,
  TopProduct,
  CategoryPerformanceItem,
  RecentTransaction,
} from "@/services/dashboard/managerService";
import {
  getUserRoleDistribution,
  getMonthlyLogins,
  getPeakHours,
  getSystemHealth,
  UserRoleDistribution,
  MonthlyLogin,
  PeakHour,
  SystemHealth,
} from "@/services/dashboard/superadminService";

const { width: screenWidth } = Dimensions.get("window");

export default function SuperadminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for API data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailySales, setDailySales] = useState<DailySalesItem[]>([]);
  const [categories, setCategories] = useState<CategoryPerformanceItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleDistribution | null>(null);
  const [monthlyLogins, setMonthlyLogins] = useState<MonthlyLogin[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [
        statsData,
        dailyData,
        categoryData,
        productsData,
        transactionsData,
        rolesData,
        loginsData,
        peaksData,
        healthData,
      ] = await Promise.all([
        getDashboardStats(),
        getDailySalesTrend(7),
        getCategoryPerformance(),
        getTopProducts(5),
        getRecentTransactions(5),
        getUserRoleDistribution(),
        getMonthlyLogins(),
        getPeakHours(),
        getSystemHealth(),
      ]);

      setStats(statsData);
      setDailySales(dailyData);
      setCategories(categoryData);
      setTopProducts(productsData);
      setRecentTransactions(transactionsData);
      setUserRoles(rolesData);
      setMonthlyLogins(loginsData);
      setPeakHours(peaksData);
      setSystemHealth(healthData);
      setError(null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Prepare chart data
  const barChartData = dailySales.map((item) => ({
    day: item.date,
    revenue: item.amount,
  }));

  const pieChartData = categories.slice(0, 5).map((cat) => ({
    x: cat.category.length > 15 ? cat.category.substring(0, 15) + "..." : cat.category,
    y: cat.revenue,
    label: formatCurrency(cat.revenue),
  }));

  // Sort categories by revenue descending for the list
  const sortedCategories = [...categories].sort((a, b) => b.revenue - a.revenue);

  const rolePieData = userRoles ? [
    { x: "Cashiers", y: userRoles.total_cashiers },
    { x: "Managers", y: userRoles.total_managers },
    { x: "Superadmins", y: userRoles.total_superadmins },
  ] : [];

  // Calculate total users for percentages
  const totalUsers = userRoles
    ? userRoles.total_cashiers + userRoles.total_managers + userRoles.total_superadmins
    : 0;

  const monthlyLoginData = monthlyLogins.map((item) => ({
    month: item.month,
    total_logins: item.total_logins,
  }));

  const totalYearlyLogins = monthlyLogins.reduce((sum, item) => sum + item.total_logins, 0);
  const avgMonthlyLogins = monthlyLogins.length ? (totalYearlyLogins / 12).toFixed(0) : 0;
  const peakMonth = monthlyLogins.reduce((max, item) =>
    item.total_logins > max.total_logins ? item : max, monthlyLogins[0] || { month: 'N/A', total_logins: 0 }
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ED277C" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Superadmin Dashboard" showBackButton={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ED277C"]} tintColor="#ED277C" />
        }
      >
        <View style={styles.content}>
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

          {/* System Usage Summary */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>System Usage Summary (Yearly)</Text>
            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={styles.statsItemValue}>{totalYearlyLogins.toLocaleString()}</Text>
                <Text style={styles.statsItemLabel}>Total Logins</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsItem}>
                <Text style={styles.statsItemValue}>{avgMonthlyLogins}</Text>
                <Text style={styles.statsItemLabel}>Avg Logins/Month</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsItem}>
                <Text style={styles.statsItemValue}>{peakMonth.month}</Text>
                <Text style={styles.statsItemLabel}>Peak Month</Text>
              </View>
            </View>
          </View>

          {/* Revenue Trend Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Revenue Trend (Last 7 Days)</Text>
            {barChartData.length > 0 ? (
              <VictoryChart
                theme={VictoryTheme.material}
                width={screenWidth - 32}
                height={250}
                domainPadding={{ x: 20 }}
                containerComponent={<VictoryVoronoiContainer />}
              >
                <VictoryAxis
                  tickValues={barChartData.map((_, i) => i)}
                  tickFormat={barChartData.map(d => d.day)}
                  style={{ tickLabels: { fontSize: 11, fill: '#6B7280' } }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(x) => `₱${x / 1000}K`}
                  style={{ tickLabels: { fontSize: 11, fill: '#6B7280' } }}
                />
                <VictoryBar
                  data={barChartData}
                  x="day"
                  y="revenue"
                  style={{ data: { fill: "#ED277C", width: 32, borderRadius: 6 } }}
                  labels={({ datum }) => formatCurrency(datum.revenue)}
                  labelComponent={<VictoryTooltip />}
                />
                <VictoryLine
                  data={barChartData}
                  x="day"
                  y="revenue"
                  style={{ data: { stroke: "#FF6B9D", strokeWidth: 2 } }}
                />
              </VictoryChart>
            ) : (
              <Text style={styles.noDataText}>No data available</Text>
            )}
          </View>

          {/* System User Logins by Month */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>System User Logins by Month</Text>
            <Text style={styles.chartSubtitle}>Total logins per month</Text>
            {monthlyLoginData.length > 0 ? (
              <VictoryChart
                theme={VictoryTheme.material}
                width={screenWidth - 32}
                height={250}
                domainPadding={{ x: 20 }}
              >
                <VictoryAxis
                  tickValues={monthlyLoginData.map((_, i) => i)}
                  tickFormat={monthlyLoginData.map(d => d.month)}
                  style={{ tickLabels: { fontSize: 10, angle: -45, fill: '#6B7280' } }}
                />
                <VictoryAxis dependentAxis tickFormat={(x) => x} style={{ tickLabels: { fontSize: 11, fill: '#6B7280' } }} />
                <VictoryLine
                  data={monthlyLoginData}
                  x="month"
                  y="total_logins"
                  style={{ data: { stroke: "#ED277C", strokeWidth: 3 } }}
                  labels={({ datum }) => datum.total_logins}
                  labelComponent={<VictoryTooltip />}
                />
              </VictoryChart>
            ) : (
              <Text style={styles.noDataText}>No login data available</Text>
            )}
          </View>

          {/* Peak Hours Analysis */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Peak Hours Analysis</Text>
            <View style={styles.peakHoursGrid}>
              {peakHours.map((peak) => (
                <View key={peak.hour} style={styles.peakHourCard}>
                  <Text style={styles.peakHourTime}>{peak.hour}</Text>
                  <Text style={[
                    styles.peakHourLevel,
                    peak.level === "Peak" ? styles.peakLevel :
                      peak.level === "Moderate" ? styles.moderateLevel : styles.lowLevel
                  ]}>
                    {peak.level}
                  </Text>
                  <Text style={styles.peakHourLogs}>{peak.avg_logins} logins</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Category Performance – Pie + Detailed List */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top Categories by Revenue</Text>
            <Text style={styles.chartSubtitle}>Revenue distribution & detailed ranking</Text>
            {pieChartData.length > 0 ? (
              <VictoryPie
                data={pieChartData}
                width={screenWidth - 32}
                height={220}
                colorScale={["#ED277C", "#FF6B9D", "#FFB3C6", "#FFD6E5", "#FFEAF1"]}
                labelRadius={70}
                style={{ labels: { fontSize: 10, fill: "#333", fontWeight: "bold" } }}
                labelComponent={<VictoryTooltip />}
              />
            ) : (
              <Text style={styles.noDataText}>No category data available</Text>
            )}
            <View style={styles.divider} />
            <Text style={styles.listTitle}>Top Categories by Revenue (Ranked)</Text>
            {sortedCategories.slice(0, 5).map((category, index) => (
              <View key={category.category} style={styles.categoryRow}>
                <View style={styles.categoryRank}>
                  <Text style={styles.categoryRankText}>{index + 1}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryStats}>{category.items_sold} items sold</Text>
                </View>
                <Text style={styles.categoryRevenue}>{formatCurrency(category.revenue)}</Text>
              </View>
            ))}
          </View>

          {/* User Role Distribution – Pie + Detailed List */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>User Role Distribution</Text>
            <Text style={styles.chartSubtitle}>Role breakdown & percentages</Text>
            {rolePieData.length > 0 ? (
              <VictoryPie
                data={rolePieData}
                width={screenWidth - 32}
                height={220}
                colorScale={["#4CAF50", "#2196F3", "#ED277C"]}
                labelRadius={70}
                style={{ labels: { fontSize: 12, fill: "#333", fontWeight: "bold" } }}
                labelComponent={<VictoryTooltip />}
              />
            ) : (
              <Text style={styles.noDataText}>No user data available</Text>
            )}
            <View style={styles.divider} />
            <Text style={styles.listTitle}>User Roles (Count & Percentage)</Text>
            {userRoles && totalUsers > 0 && (
              <>
                <View style={styles.roleRow}>
                  <View style={styles.roleInfo}>
                    <View style={[styles.roleColor, { backgroundColor: "#4CAF50" }]} />
                    <Text style={styles.roleName}>Cashiers</Text>
                  </View>
                  <View style={styles.roleStats}>
                    <Text style={styles.roleCount}>{userRoles.total_cashiers}</Text>
                    <Text style={styles.rolePercent}>
                      ({((userRoles.total_cashiers / totalUsers) * 100).toFixed(1)}%)
                    </Text>
                  </View>
                </View>
                <View style={styles.roleRow}>
                  <View style={styles.roleInfo}>
                    <View style={[styles.roleColor, { backgroundColor: "#2196F3" }]} />
                    <Text style={styles.roleName}>Managers</Text>
                  </View>
                  <View style={styles.roleStats}>
                    <Text style={styles.roleCount}>{userRoles.total_managers}</Text>
                    <Text style={styles.rolePercent}>
                      ({((userRoles.total_managers / totalUsers) * 100).toFixed(1)}%)
                    </Text>
                  </View>
                </View>
                <View style={styles.roleRow}>
                  <View style={styles.roleInfo}>
                    <View style={[styles.roleColor, { backgroundColor: "#ED277C" }]} />
                    <Text style={styles.roleName}>Superadmins</Text>
                  </View>
                  <View style={styles.roleStats}>
                    <Text style={styles.roleCount}>{userRoles.total_superadmins}</Text>
                    <Text style={styles.rolePercent}>
                      ({((userRoles.total_superadmins / totalUsers) * 100).toFixed(1)}%)
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Top Products */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Top Performing Products</Text>
            {topProducts.map((product, index) => (
              <View key={product.id} style={styles.productRow}>
                <View style={styles.productRank}>
                  <Text style={styles.productRankText}>{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                </View>
                <Text style={styles.productRevenue}>{formatCurrency(product.revenue)}</Text>
              </View>
            ))}
          </View>

          {/* Recent Transactions */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Recent Transactions</Text>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionRow}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionAvatar}>
                    <Ionicons name="person-outline" size={18} color="#ED277C" />
                  </View>
                  <View>
                    <Text style={styles.transactionUser}>{transaction.user_name}</Text>
                    <Text style={styles.transactionTime}>{transaction.created_at}</Text>
                  </View>
                </View>
                <Text style={styles.transactionAmount}>{formatCurrency(transaction.total_amount)}</Text>
              </View>
            ))}
          </View>

          {/* Inventory Status */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Inventory Status</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Low Stock Items:</Text>
              <Text style={[styles.infoValue, { color: "#FF9800" }]}>{stats?.low_stock_items || 0}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Out of Stock Items:</Text>
              <Text style={[styles.infoValue, { color: "#F44336" }]}>{stats?.out_of_stock_items || 0}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Average Transaction:</Text>
              <Text style={styles.infoValue}>{formatCurrency(stats?.avg_transaction_value || 0)}</Text>
            </View>
          </View>

          {/* System Health */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>System Health</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Active Users:</Text>
              <Text style={[styles.infoValue, { color: "#4CAF50" }]}>{stats?.active_users || 0} / {stats?.total_users || 0}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Database Size:</Text>
              <Text style={styles.infoValue}>{systemHealth?.database_size || 'Unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Backup:</Text>
              <Text style={styles.infoValue}>{systemHealth?.last_backup || 'Unknown'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 14, color: '#F44336', textAlign: 'center', marginTop: 12, marginBottom: 20 },
  retryButton: { backgroundColor: '#ED277C', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 32 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: (screenWidth - 44) / 2, borderTopWidth: 3, borderTopColor: '#ED277C', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  chartSubtitle: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  noDataText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 40 },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 },

  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#1F2937' },

  // Category list styles
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  categoryRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ED277C10', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryRankText: { fontSize: 12, fontWeight: 'bold', color: '#ED277C' },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  categoryStats: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  categoryRevenue: { fontSize: 14, fontWeight: '600', color: '#10B981' },

  // Role list styles
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  roleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleColor: { width: 12, height: 12, borderRadius: 6 },
  roleName: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  roleStats: { flexDirection: 'row', gap: 8, alignItems: 'baseline' },
  roleCount: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  rolePercent: { fontSize: 12, color: '#6B7280' },

  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  productRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ED277C10', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  productRankText: { fontSize: 12, fontWeight: 'bold', color: '#ED277C' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  productCategory: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  productRevenue: { fontSize: 14, fontWeight: '600', color: '#10B981' },

  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ED277C10', justifyContent: 'center', alignItems: 'center' },
  transactionUser: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  transactionTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  transactionAmount: { fontSize: 15, fontWeight: '600', color: '#ED277C' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  statsItem: { alignItems: 'center', flex: 1 },
  statsItemValue: { fontSize: 24, fontWeight: 'bold', color: '#ED277C' },
  statsItemLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  statsDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },

  peakHoursGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  peakHourCard: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12, alignItems: 'center' },
  peakHourTime: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  peakHourLevel: { fontSize: 12, fontWeight: '600', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, overflow: 'hidden' },
  peakLevel: { backgroundColor: '#FFE0F0', color: '#ED277C' },
  moderateLevel: { backgroundColor: '#FFF3E0', color: '#FF9800' },
  lowLevel: { backgroundColor: '#E8F5E9', color: '#4CAF50' },
  peakHourLogs: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' },
});