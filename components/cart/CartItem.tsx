// components/cart/CartItem.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface CartItemProps {
  item: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string | null;
    category?: string;
    description?: string;
  };
  liveStock?: number; // Live stock from ProductContext
  isLowStock?: boolean;
  maxStockReached?: boolean;
  onRemove: (id: number) => void;
  onPress: () => void;
}

export default function CartItem({
  item,
  liveStock,
  isLowStock,
  maxStockReached,
  onRemove,
  onPress,
}: CartItemProps) {
  const itemTotal = item.price * item.quantity;

  return (
    <TouchableOpacity
      style={styles.cartItem}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`item-${item.id}-press`}
    >
      {/* Product Image */}
      <View style={styles.cartItemImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cartItemImage} />
        ) : (
          <View style={styles.cartItemImagePlaceholder}>
            <Text style={styles.cartItemImagePlaceholderText}>
              {item.name.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Product Details Container */}
      <View style={styles.cartItemContent}>
        {/* Product Name and Category */}
        <View style={styles.cartItemHeader}>
          <Text style={styles.cartItemName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.category && (
            <Text style={styles.cartItemCategory}>{item.category}</Text>
          )}
        </View>

        {/* Quantity and Total Row */}
        <View style={styles.cartItemDetails}>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Qty:</Text>
            <Text style={styles.quantityValue}>{item.quantity}</Text>
          </View>
          <Text style={styles.itemTotal}>₱{itemTotal.toFixed(2)}</Text>
        </View>

        {/* Unit Price */}
        <Text style={styles.unitPrice}>₱{item.price.toFixed(2)} each</Text>

        {/* Stock Warnings - using live stock data */}
        {maxStockReached && (
          <View style={styles.warningContainer}>
            <Ionicons name="alert-circle" size={14} color="#FF9800" />
            <Text style={styles.maxStockWarning}>Maximum stock reached</Text>
          </View>
        )}

        {isLowStock && !maxStockReached && (
          <View style={[styles.warningContainer, styles.lowStockWarning]}>
            <Ionicons name="information-circle" size={14} color="#ED277C" />
            <Text style={styles.lowStockText}>
              Only {liveStock} left in stock
            </Text>
          </View>
        )}
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID={`item-${item.id}-remove`}
      >
        <Ionicons name="trash-outline" size={18} color="#F44336" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  cartItemImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    overflow: "hidden",
    marginRight: 16,
  },
  cartItemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cartItemImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ED277C10",
    justifyContent: "center",
    alignItems: "center",
  },
  cartItemImagePlaceholderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ED277C",
  },
  cartItemContent: {
    flex: 1,
    marginRight: 12,
  },
  cartItemHeader: {
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  cartItemCategory: {
    fontSize: 12,
    color: "#999",
    textTransform: "capitalize",
  },
  cartItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quantityLabel: {
    fontSize: 14,
    color: "#666",
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 16,
    overflow: "hidden",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  unitPrice: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  lowStockWarning: {
    marginTop: 2,
  },
  maxStockWarning: {
    fontSize: 11,
    color: "#FF9800",
    fontWeight: "500",
  },
  lowStockText: {
    fontSize: 11,
    color: "#ED277C",
    fontWeight: "500",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#FFE5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});
