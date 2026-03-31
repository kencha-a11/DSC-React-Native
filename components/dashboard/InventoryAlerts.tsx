// components/dashboard/InventoryAlerts.tsx
import react, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import RestockProductModal from '../inventory/RestockProductModal';
import { Ionicons } from '@expo/vector-icons';

interface Product {
  id: number;
  name: string;
  stock_quantity: number;
  price?: number;
  status: string;
  low_stock_threshold: number;
}

interface InventoryAlertsProps {
  products: Product[];
  onRefresh?: () => void;
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ products, onRefresh }) => {
  const [showRestockProductModal, setShowRestockProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (products.length === 0) return null;

  return (
    <View style={[styles.card, styles.alertCard]}>
      <RestockProductModal
        visible={showRestockProductModal}
        onClose={() => setShowRestockProductModal(false)}
        product={selectedProduct as any} // Using as any to bypass potential UI type mismatches with standard products
        onSuccess={onRefresh}
      />
      <Text style={styles.cardTitle}>⚠️ Inventory Alerts</Text>
      {products.map((product) => (
        <View key={product.id} style={styles.alertItem}>
          <Ionicons
            name={product.status === 'out of stock' ? 'alert-circle' : 'warning'}
            size={20}
            color={product.status === 'out of stock' ? '#EF4444' : '#F59E0B'}
          />
          <View style={styles.alertInfo}>
            <Text style={styles.alertProductName}>{product.name}</Text>
            <Text style={styles.alertDetails}>
              {product.status === 'out of stock'
                ? 'Out of stock'
                : `Low stock: ${product.stock_quantity} remaining`}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.alertButton} 
            onPress={() => {
              setSelectedProduct(product);
              setShowRestockProductModal(true);
            }}
          >
            <Text style={styles.alertButtonText}>Restock</Text>
          </TouchableOpacity>
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
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  alertInfo: {
    flex: 1,
    marginLeft: 12,
  },
  alertProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  alertDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  alertButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default InventoryAlerts;