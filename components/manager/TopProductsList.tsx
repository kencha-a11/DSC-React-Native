// components/dashboard/TopProductsList.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TopProduct {
  id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
  category: string;
}

interface TopProductsListProps {
  products: TopProduct[];
}

const TopProductsList: React.FC<TopProductsListProps> = ({ products }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Top Performing Products</Text>
      {products.map((product, index) => (
        <View key={product.id} style={styles.productItem}>
          <View style={styles.productRank}>
            <Text style={styles.productRankText}>{index + 1}</Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productStats}>
              {product.quantity_sold} sold • ${product.revenue.toLocaleString()} revenue
            </Text>
          </View>
          <View style={styles.productRevenue}>
            <Text style={styles.productRevenueText}>${product.revenue.toLocaleString()}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  productStats: {
    fontSize: 12,
    color: '#6B7280',
  },
  productRevenue: {
    alignItems: 'flex-end',
  },
  productRevenueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default TopProductsList;