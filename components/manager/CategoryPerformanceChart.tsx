// components/dashboard/CategoryPerformanceChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryPie, VictoryTooltip } from 'victory-native';

const { width: screenWidth } = Dimensions.get('window');

interface CategoryPerformance {
  category: string;
  revenue: number;
  items_sold: number;
}

interface CategoryPerformanceChartProps {
  categories: CategoryPerformance[];
}

const CategoryPerformanceChart: React.FC<CategoryPerformanceChartProps> = ({ categories }) => {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Sales by Category</Text>
      <View style={styles.chartContainer}>
        {categories.length > 0 && (
          <VictoryPie
            data={categories}
            x="category"
            y="revenue"
            width={screenWidth - 48}
            height={250}
            colorScale={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']}
            labelRadius={({ innerRadius }) => (Number(innerRadius) || 0) + 65}
            style={{
              labels: { fontSize: 12, fill: '#1F2937', fontWeight: 'bold' },
            }}
            labelComponent={
              <VictoryTooltip
                renderInPortal={false}
                style={{ fontSize: 12 }}
                flyoutStyle={{ fill: 'white', stroke: '#E5E7EB' }}
              />
            }
          />
        )}
      </View>
      <View style={styles.categoryStats}>
        {categories.map((cat, idx) => (
          <View key={idx} style={styles.categoryStatItem}>
            <Text style={styles.categoryName}>{cat.category}</Text>
            <Text style={styles.categoryRevenue}>${cat.revenue.toLocaleString()}</Text>
            <Text style={styles.categoryItems}>{cat.items_sold} items</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  categoryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  categoryRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  categoryItems: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default CategoryPerformanceChart;