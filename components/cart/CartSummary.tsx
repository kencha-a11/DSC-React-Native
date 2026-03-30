// components/cart/CartSummary.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface CartSummaryProps {
  itemCount: number;
  formattedTotal: string;
  loading?: boolean;
  onConfirm: () => void;
  onClearCart: () => void;
}

export default function CartSummary({
  itemCount,
  formattedTotal,
  loading = false,
  onConfirm,
  onClearCart,
}: CartSummaryProps) {
  return (
    <View style={styles.container}>
      {/* Summary Bar with Clear Cart Button */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryBarText}>
          {itemCount} item{itemCount !== 1 ? "s" : ""} · {formattedTotal}
        </Text>
        <TouchableOpacity style={styles.clearCartButton} onPress={onClearCart}>
          <Ionicons name="trash-outline" size={20} color="#ED277C" />
          <Text style={styles.clearCartText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Summary and Checkout */}
      <View style={styles.cartSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>{formattedTotal}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items:</Text>
          <Text style={styles.summaryValue}>{itemCount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formattedTotal}</Text>
        </View>

        {/* Confirm Payment Button */}
        <TouchableOpacity
          style={styles.confirmButtonEnabled}
          onPress={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>
              Confirm payment · {formattedTotal}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  summaryBarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ED277C",
    flex: 1,
  },
  clearCartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ED277C20",
  },
  clearCartText: {
    fontSize: 12,
    color: "#ED277C",
    fontWeight: "600",
  },
  cartSummary: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ED277C",
  },
  confirmButtonEnabled: {
    backgroundColor: "#ED277C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
