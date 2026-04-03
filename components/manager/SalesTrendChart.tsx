// components/dashboard/SalesTrendChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryBar,
  VictoryLine,
  VictoryTooltip,
} from 'victory-native';

const { width: screenWidth } = Dimensions.get('window');

interface DailySales {
  date: string;
  amount: number;
  transactions: number;
}

interface SalesTrendChartProps {
  dailySales: DailySales[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ dailySales }) => {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Sales Trend (Last 7 Days)</Text>
      <View style={styles.chartContainer}>
        <VictoryChart
          theme={VictoryTheme.material}
          domainPadding={{ x: 20 }}
          width={screenWidth - 48}
          height={250}
        >
          <VictoryAxis
            tickValues={dailySales.map((_, i) => i)}
            tickFormat={dailySales.map(d => d.date)}
            style={{
              tickLabels: { fontSize: 10, angle: -45, padding: 5 },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(x) => `$${x}`}
            style={{
              tickLabels: { fontSize: 10 },
            }}
          />
          <VictoryBar
            data={dailySales}
            x="date"
            y="amount"
            barWidth={32}
            style={{
              data: { fill: '#3B82F6', borderRadius: 4 },
            }}
            labels={({ datum }) => `$${datum.amount}`}
            labelComponent={
              <VictoryTooltip
                renderInPortal={false}
                style={{ fontSize: 10, fill: '#1F2937' }}
                flyoutStyle={{ fill: 'white', stroke: '#E5E7EB' }}
              />
            }
          />
          <VictoryLine
            data={dailySales}
            x="date"
            y="amount"
            style={{
              data: { stroke: '#10B981', strokeWidth: 2 },
            }}
          />
        </VictoryChart>
      </View>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Daily Revenue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Trend Line</Text>
        </View>
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default SalesTrendChart;