// components/dashboard/StatsGrid.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import StatCard from './StatCard';

const { width: screenWidth } = Dimensions.get('window');

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

interface StatsGridProps {
  stats: DashboardStats;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <View style={styles.statsGrid}>
      <View style={styles.statCardWrapper}>
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon="cash-outline"
          color="#10B981"
          trend={12.5}
        />
      </View>
      <View style={styles.statCardWrapper}>
        <StatCard
          title="Total Sales"
          value={stats.totalSales.toString()}
          icon="cart-outline"
          color="#3B82F6"
          trend={8.3}
        />
      </View>
      <View style={styles.statCardWrapper}>
        <StatCard
          title="Products"
          value={stats.totalProducts.toString()}
          icon="cube-outline"
          color="#8B5CF6"
        />
      </View>
      <View style={styles.statCardWrapper}>
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toString()}
          icon="people-outline"
          color="#F59E0B"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCardWrapper: {
    width: (screenWidth - 48) / 2,
  },
});

export default StatsGrid;