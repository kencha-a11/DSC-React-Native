import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useCategories } from "@/context/CategoryContext";
import { useProducts } from "@/context/ProductContext";

export default function CategoryAssignmentMonitor() {
  const {
    categories,
    loading: catLoading,
    refreshCategories,
    updateCategoryCount,
  } = useCategories();

  const {
    products,
    loading: prodLoading,
    refreshProducts,
    editProduct,
  } = useProducts();

  const [refreshing, setRefreshing] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, boolean>>(new Map());

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshCategories(), refreshProducts()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCategories, refreshProducts]);

  useEffect(() => {
    refreshAll();
  }, []);

  // Toggle a single category
  const toggleCategory = useCallback(
    async (product: any, categoryId: number) => {
      const updateKey = `${product.id}-${categoryId}`;
      if (pendingUpdates.has(updateKey)) return;

      setPendingUpdates((prev) => new Map(prev).set(updateKey, true));

      const currentIds = product.category_ids || [];
      const isAssigned = currentIds.includes(categoryId);
      const newIds = isAssigned
        ? currentIds.filter((id: number) => id !== categoryId)
        : [...currentIds, categoryId];

      // Optimistic count update
      const delta = isAssigned ? -1 : 1;
      updateCategoryCount(categoryId, delta);

      try {
        await editProduct(product.id, {
          name: product.name,
          price: product.price,
          stock_quantity: product.stock_quantity,
          low_stock_threshold: product.low_stock_threshold,
          category_ids: newIds,
        });
        await Promise.all([refreshCategories(), refreshProducts()]);
      } catch (err) {
        // Revert optimistic update
        updateCategoryCount(categoryId, -delta);
        Alert.alert("Error", "Failed to update product category");
        await refreshAll();
      } finally {
        setPendingUpdates((prev) => {
          const next = new Map(prev);
          next.delete(updateKey);
          return next;
        });
      }
    },
    [editProduct, refreshCategories, refreshProducts, refreshAll, updateCategoryCount]
  );

  // Remove all categories from a product
  const clearAllCategories = useCallback(
    async (product: any) => {
      const currentIds = product.category_ids || [];
      if (currentIds.length === 0) return;

      // Confirm action
      Alert.alert(
        "Remove All Categories",
        `This will remove "${product.name}" from all ${currentIds.length} categories.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove All",
            style: "destructive",
            onPress: async () => {
              // Disable buttons for all categories of this product
              const updateKeys = currentIds.map((id: number) => `${product.id}-${id}`);
              setPendingUpdates((prev) => {
                const next = new Map(prev);
                updateKeys.forEach((key) => next.set(key, true));
                return next;
              });

              // Optimistically decrease counts for all affected categories
              currentIds.forEach((catId: number) => updateCategoryCount(catId, -1));

              try {
                await editProduct(product.id, {
                  name: product.name,
                  price: product.price,
                  stock_quantity: product.stock_quantity,
                  low_stock_threshold: product.low_stock_threshold,
                  category_ids: [],
                });
                await Promise.all([refreshCategories(), refreshProducts()]);
              } catch (err) {
                // Revert optimistic counts
                currentIds.forEach((catId: number) => updateCategoryCount(catId, 1));
                Alert.alert("Error", "Failed to remove categories");
                await refreshAll();
              } finally {
                setPendingUpdates((prev) => {
                  const next = new Map(prev);
                  updateKeys.forEach((key) => next.delete(key));
                  return next;
                });
              }
            },
          },
        ]
      );
    },
    [editProduct, refreshCategories, refreshProducts, refreshAll, updateCategoryCount]
  );

  if (catLoading || prodLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ED277C" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshAll} colors={["#ED277C"]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Category Assignment Monitor</Text>
        <Text style={styles.subtitle}>Tap a category chip to assign/unassign</Text>
      </View>

      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>No categories found</Text>
        ) : (
          categories.map((cat) => (
            <View key={cat.id} style={styles.categoryCard}>
              <Text style={styles.categoryName}>{cat.category_name}</Text>
              <Text style={styles.categoryCount}>{cat.product_count ?? 0} products</Text>
            </View>
          ))
        )}
      </View>

      {/* Products Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products</Text>
        {products.length === 0 ? (
          <Text style={styles.emptyText}>No products found</Text>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDetail}>Stock: {product.stock_quantity}</Text>
              <View style={styles.chipContainer}>
                {categories.map((category) => {
                  const isAssigned = product.category_ids?.includes(category.id);
                  const isLoading = pendingUpdates.has(`${product.id}-${category.id}`);
                  return (
                    <TouchableOpacity
                      key={`${product.id}-${category.id}`}
                      style={[
                        styles.chip,
                        isAssigned ? styles.chipActive : styles.chipInactive,
                      ]}
                      onPress={() => toggleCategory(product, category.id)}
                      disabled={isLoading}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isAssigned ? styles.chipTextActive : styles.chipTextInactive,
                        ]}
                      >
                        {category.category_name}
                      </Text>
                      {isLoading && <ActivityIndicator size="small" color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {product.category_ids?.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => clearAllCategories(product)}
                  disabled={pendingUpdates.has(`clear-${product.id}`)}
                >
                  <Text style={styles.clearButtonText}>Clear All Categories</Text>
                </TouchableOpacity>
              )}
              {product.category_ids?.length === 0 && (
                <Text style={styles.uncategorizedHint}>Uncategorized</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 12, color: "#666", textAlign: "center", marginTop: 4 },
  section: { padding: 16, borderTopWidth: 1, borderTopColor: "#e0e0e0" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryName: { fontSize: 16, fontWeight: "500" },
  categoryCount: { fontSize: 14, color: "#ED277C", fontWeight: "600" },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  productName: { fontSize: 15, fontWeight: "500", marginBottom: 4 },
  productDetail: { fontSize: 12, color: "#666", marginBottom: 8 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipActive: { backgroundColor: "#ED277C", borderColor: "#ED277C" },
  chipInactive: { backgroundColor: "#fff", borderColor: "#ccc" },
  chipText: { fontSize: 12, fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  chipTextInactive: { color: "#666" },
  clearButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  clearButtonText: { color: "#fff", fontSize: 11, fontWeight: "500" },
  uncategorizedHint: { fontSize: 11, color: "#999", fontStyle: "italic", marginTop: 4 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 20 },
});