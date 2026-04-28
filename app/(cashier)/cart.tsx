// app/(cashier)/cart.tsx
import React, { useState, useMemo, useCallback } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  BackHandler,
  ActivityIndicator, // ✅ added
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, router } from "expo-router";

import AddItemBox from "@/components/cart/AddItemBox";
import CartItem from "@/components/cart/CartItem";
import ClearCartModal from "@/components/cart/ClearCartModal";
import ExitCartModal from "@/components/cart/ExitCartModal";
import ProductModal from "@/components/product/ProductModal";
import CartSummaryModal from "@/components/cart/CartSummaryModal";
import Header from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import DscToast from "@/components/common/DscToast";

export default function CartScreen() {
  const {
    cartItems,
    formattedTotal,
    loading: cartLoading,
    hasItems,
    itemCount,
    updateQuantity,
    removeItem,
    confirmPurchase,
    clearCart,
  } = useCart();
  const { products } = useProducts();

  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    console.log(`[CartScreen] Showing toast: ${message} (${type})`);
    setToast({ message, type });
    setTimeout(() => {
      console.log("[CartScreen] Hiding toast");
      setToast(null);
    }, 3000);
  }, []);

  const cartItemsWithStock = useMemo(() => {
    return cartItems.map((item) => {
      const product = products.find((p) => p.id === item.id);
      const stock = product?.stock_quantity ?? 0;
      const maxReached = stock > 0 && item.quantity >= stock;
      return { ...item, stock, maxReached };
    });
  }, [cartItems, products]);

  const isLoading = cartLoading || isProcessing;

  const goToHome = () => {
    router.dismissAll();
    router.replace("/(cashier)/(tabs)");
  };

  const goToAddItem = () => router.push("/(cashier)/product");
  const goToScan = () => router.push("/(cashier)/SaleBarcode");

  const handleBack = () => {
    if (hasItems) {
      setExitModalVisible(true);
    } else {
      goToHome();
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [handleBack])
  );

  const handleClearCart = () => setClearModalVisible(true);
  const confirmClearCart = () => {
    clearCart();
    setClearModalVisible(false);
    showToast("Cart cleared successfully", "info");
  };

  const handleExit = (clear: boolean) => {
    if (clear) {
      clearCart();
      showToast("Cart cleared before exiting", "info");
    }
    setExitModalVisible(false);
    goToHome();
  };

  const selectProduct = (item: any) => {
    const product = products.find((p) => p.id === item.id);
    const cartItem = cartItems.find((ci) => ci.id === item.id);
    setSelectedProduct({
      id: item.id,
      name: item.name,
      price: item.price,
      stock: product?.stock_quantity ?? 0,
      image: item.image,
      currentCartQuantity: cartItem?.quantity ?? 1,
    });
    setProductModalVisible(true);
  };

  const updateSelectedProduct = (quantity: number) => {
    if (!selectedProduct) return;
    updateQuantity(selectedProduct.id, quantity);
    setProductModalVisible(false);
    setSelectedProduct(null);
  };

  const handleConfirmPress = () => setSummaryModalVisible(true);

  const confirmPurchaseFlow = async () => {
    console.log("[CartScreen] confirmPurchaseFlow started");
    setSummaryModalVisible(false);
    setIsProcessing(true);
    try {
      const success = await confirmPurchase();
      if (success) {
        showToast("Purchase Successful! Your items have been deducted.", "success");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      showToast("Purchase failed. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="CART"
        showBackButton
        onBackPress={handleBack}
        backgroundColor="#ffffffff"
        titleColor="#333"
      />

      <DscToast
        visible={!!toast}
        message={toast?.message || ""}
        type={toast?.type || "success"}
        onClose={() => setToast(null)}
        showCloseButton
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ED277C" />
          <Text style={styles.loadingText}>
            {isProcessing ? "Processing payment..." : "Loading..."}
          </Text>
        </View>
      ) : !hasItems ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require("@/assets/images/empty-cart.png")}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>The Cart is Empty</Text>
          <Text style={styles.emptyMessage}>
            Looks like you haven't added{"\n"}
            anything to your cart yet.
          </Text>
          <View style={styles.emptyAddItemBox}>
            <AddItemBox
              onAddItem={goToAddItem}
              onSearch={() => {}}
              onBarcodeScan={goToScan}
            />
          </View>
        </View>
      ) : (
        <View style={styles.cartWithItemsContainer}>
          <View style={styles.clearCartHeader}>
            <TouchableOpacity onPress={handleClearCart} style={styles.clearCartButton}>
              <Ionicons name="trash-outline" size={20} color="#ED277C" />
              <Text style={styles.clearCartText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={cartItemsWithStock}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                onRemove={removeItem}
                onPress={() => selectProduct(item)}
                liveStock={item.stock}
                maxStockReached={item.maxReached}
              />
            )}
            keyExtractor={(item) => `cart-${item.id}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cartListContent}
          />

          <View style={styles.addItemBoxWrapper}>
            <AddItemBox
              onAddItem={goToAddItem}
              onSearch={() => {}}
              onBarcodeScan={goToScan}
            />
          </View>

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

            <TouchableOpacity
              style={[
                styles.confirmButtonEnabled,
                isLoading && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmPress}
              disabled={isLoading}
            >
              <Text style={styles.confirmButtonText}>
                Confirm payment · {formattedTotal}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modals */}
      <CartSummaryModal
        visible={summaryModalVisible}
        onClose={() => setSummaryModalVisible(false)}
        onConfirm={confirmPurchaseFlow}
        cartItems={cartItems}
        total={formattedTotal}
        itemCount={itemCount}
        loading={isProcessing}
      />
      <ClearCartModal
        visible={clearModalVisible}
        onClose={() => setClearModalVisible(false)}
        onConfirm={confirmClearCart}
        itemCount={itemCount}
      />
      <ExitCartModal
        visible={exitModalVisible}
        onClose={() => setExitModalVisible(false)}
        onClearAndExit={() => handleExit(true)}
        onExit={() => handleExit(false)}
        itemCount={itemCount}
      />
      {selectedProduct && (
        <ProductModal
          visible={productModalVisible}
          onClose={() => {
            setProductModalVisible(false);
            setSelectedProduct(null);
          }}
          onAddToCart={updateSelectedProduct}
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            stock: selectedProduct.stock,
            image: selectedProduct.image,
          }}
          initialQuantity={selectedProduct.currentCartQuantity}
          isEditMode
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffffff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffffff",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyImage: { width: 200, height: 200, marginBottom: 20 },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  emptyAddItemBox: { width: "100%", marginTop: 10, marginBottom: 20 },

  cartWithItemsContainer: { flex: 1, marginBottom: 40 },
  clearCartHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "flex-end",
  },
  clearCartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ED277C20",
  },
  clearCartText: { fontSize: 14, color: "#ED277C", fontWeight: "600" },

  cartListContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 180,
  },
  addItemBoxWrapper: {
    paddingHorizontal: 16,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cartSummary: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: "#666" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
  totalAmount: { fontSize: 18, fontWeight: "bold", color: "#ED277C" },
  confirmButtonEnabled: {
    backgroundColor: "#ED277C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});