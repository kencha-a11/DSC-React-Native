// components/modal/CartSummaryModal.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

interface CartSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cartItems: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: string;
  itemCount: number;
  loading?: boolean;
}

export default function CartSummaryModal({
  visible,
  onClose,
  onConfirm,
  cartItems,
  total,
  itemCount,
  loading = false,
}: CartSummaryModalProps) {
  const [showAllItems, setShowAllItems] = useState(false);

  // If no items, don't show the modal or show empty state
  if (cartItems.length === 0 && visible) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContent}>
            <View style={styles.headerContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="cart-outline" size={40} color="#ED277C" />
              </View>
              <Text style={styles.title}>Cart is Empty</Text>
              <Text style={styles.subtitle}>
                Add items to your cart before confirming payment
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { marginTop: 20 }]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.itemRow, index === 0 && styles.firstItem]}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.itemMetaContainer}>
          <Text style={styles.itemQuantity}>x{item.quantity}</Text>
          <Text style={styles.itemUnitPrice}>@ ₱{item.price.toFixed(2)}</Text>
        </View>
      </View>
      <View style={styles.itemPriceContainer}>
        <Text style={styles.itemPrice}>
          ₱{(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const ListHeaderComponent = () => (
    <View style={styles.summaryHeader}>
      <Text style={styles.summaryTitle}>Items</Text>
      <Text style={styles.itemCountBadge}>{itemCount} total</Text>
    </View>
  );

  const ListFooterComponent = () => (
    <>
      {!showAllItems && cartItems.length > 5 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAllItems(true)}
        >
          <Text style={styles.showMoreText}>
            Show {cartItems.length - 5} more items
          </Text>
          <Ionicons name="chevron-down" size={16} color="#ED277C" />
        </TouchableOpacity>
      )}
      {showAllItems && cartItems.length > 5 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAllItems(false)}
        >
          <Text style={styles.showMoreText}>Show less</Text>
          <Ionicons name="chevron-up" size={16} color="#ED277C" />
        </TouchableOpacity>
      )}

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{total}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Items:</Text>
          <Text style={styles.totalValue}>{itemCount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.grandTotalLabel}>Total Amount:</Text>
          <Text style={styles.grandTotalValue}>{total}</Text>
        </View>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header with success icon */}
          <View style={styles.headerContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="receipt-outline" size={40} color="#ED277C" />
            </View>
            <Text style={styles.title}>Complete Purchase?</Text>
            <Text style={styles.subtitle}>
              Please review your order before confirming
            </Text>
          </View>

          {/* Items List */}
          <View style={styles.listContainer}>
            <FlatList
              data={showAllItems ? cartItems : cartItems.slice(0, 5)}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              ListHeaderComponent={ListHeaderComponent}
              ListFooterComponent={ListFooterComponent}
              contentContainerStyle={styles.listContent}
              initialNumToRender={5}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          </View>

          {/* Action Buttons - Fixed at bottom */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Ionicons name="close-outline" size={20} color="#666" />
              <Text style={styles.cancelButtonText}>Review Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: width * 0.9,
    height: height * 0.8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    display: "flex",
    flexDirection: "column",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ED277C10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  listContent: {
    padding: 12,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemCountBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ED277C",
    backgroundColor: "#ED277C20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  firstItem: {
    paddingTop: 0,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  itemMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ED277C",
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  itemUnitPrice: {
    fontSize: 11,
    color: "#999",
  },
  itemPriceContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    minWidth: 70,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 4,
    gap: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  showMoreText: {
    fontSize: 12,
    color: "#ED277C",
    fontWeight: "600",
  },
  totalsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 16,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ED277C",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: "auto",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  confirmButton: {
    backgroundColor: "#ED277C",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
