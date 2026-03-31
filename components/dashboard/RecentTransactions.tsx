// components/dashboard/RecentTransactions.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Sale {
  id: number;
  user_id: number;
  total_amount: number;
  created_at: string;
}

interface RecentTransactionsProps {
  sales: Sale[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ sales }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recent Transactions</Text>
      {sales.map((sale) => (
        <View key={sale.id} style={styles.transactionItem}>
          <View style={styles.transactionLeft}>
            <Ionicons name="receipt-outline" size={20} color="#6B7280" />
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionId}>Sale #{sale.id}</Text>
              <Text style={styles.transactionDate}>{sale.created_at}</Text>
            </View>
          </View>
          <Text style={styles.transactionAmount}>${sale.total_amount.toLocaleString()}</Text>
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
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionInfo: {
    marginLeft: 12,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default RecentTransactions;