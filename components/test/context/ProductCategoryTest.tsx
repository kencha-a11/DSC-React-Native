import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useCategories } from "@/context/CategoryContext";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";
import { Product } from "@/services/productService";

type LogEntry = {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
};

export default function ProductCategoryTest() {
  const {
    categories,
    loading: catLoading,
    error: catError,
    fetchCategories,
    refreshCategories,
    fetchCategoryById,
    fetchCategoryProducts,
    getCategoryById,
    getCategoryNameById,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteMultipleCategories,
    updateCategoryCount,
    onCategoriesChanged,
  } = useCategories();

  const {
    products,
    loading: prodLoading,
    loadingMore,
    mutating,
    error: prodError,
    hasMore,
    fetchProducts,
    loadMore,
    refreshProducts,
    productMap,
    refreshProduct,
    updateProductStock,
    blockAutoRefresh,
    addProduct,
    editProduct,
    removeProduct,
    removeMultipleProducts,
    restockProduct,
    deductProduct,
    getProductByBarcode,
  } = useProducts();

  const {
    cartItems,
    addItem,
    removeItem,
    incrementQuantity,
    decrementQuantity,
    updateQuantity,
    clearCart,
    confirmPurchase,
    total,
    formattedTotal,
    loading: cartLoading,
    hasItems,
    itemCount,
  } = useCart();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [testCategoryId, setTestCategoryId] = useState<number | null>(null);
  const [testProductId, setTestProductId] = useState<number | null>(null);
  const [categoryProductCount, setCategoryProductCount] = useState<number | null>(null);

  // Helper to add log messages
  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    setLogs((prev) => [{ timestamp, message, type }, ...prev.slice(0, 99)]);
  };

  // Clear logs
  const clearLogs = () => setLogs([]);

  // Wrap async functions with error handling and logging
  const wrap = async <T,>(fn: () => Promise<T>, name: string): Promise<T | void> => {
    addLog(`${name} started...`, "info");
    try {
      const result = await fn();
      if (result !== undefined) {
        addLog(`${name} succeeded: ${JSON.stringify(result).slice(0, 200)}`, "success");
      } else {
        addLog(`${name} succeeded`, "success");
      }
      return result;
    } catch (err: any) {
      addLog(`${name} failed: ${err.message || err}`, "error");
      throw err;
    }
  };

  // ─── Category count helpers ─────────────────────────────────────────────────
  const fetchAndLogCategoryCount = async (categoryId: number) => {
    const cat = await fetchCategoryById(categoryId);
    if (cat) {
      addLog(`Category ${cat.category_name} (ID: ${cat.id}) has ${cat.product_count} products`, "info");
      setCategoryProductCount(cat.product_count);
    } else {
      addLog(`Category ${categoryId} not found`, "warning");
    }
  };

  // ─── Sync functions (no wrap) ─────────────────────────────────────────────
  const testGetCategoryById = () => {
    if (!testCategoryId) return addLog("No test category ID", "warning");
    const cat = getCategoryById(testCategoryId);
    addLog(`getCategoryById(${testCategoryId}): ${cat ? cat.category_name : "not found"}`, "info");
  };
  const testGetCategoryNameById = () => {
    if (!testCategoryId) return addLog("No test category ID", "warning");
    const name = getCategoryNameById(testCategoryId);
    addLog(`getCategoryNameById(${testCategoryId}): ${name}`, "info");
  };
  const testUpdateCategoryCount = () => {
    if (!testCategoryId) return addLog("No test category ID", "warning");
    updateCategoryCount(testCategoryId, 5);
    addLog(`updateCategoryCount(${testCategoryId}, +5) – local count updated`, "info");
  };
  const testUpdateProductStock = () => {
    if (!testProductId) return addLog("No test product ID", "warning");
    updateProductStock(testProductId, 999);
    addLog(`updateProductStock(${testProductId}, 999) – optimistic`, "info");
  };
  const testBlockAutoRefresh = () => {
    blockAutoRefresh(3000);
    addLog(`blockAutoRefresh(3000) – auto refreshes blocked for 3 seconds`, "info");
  };
  const testIncrementCart = () => {
    if (!testProductId) return addLog("No test product ID", "warning");
    incrementQuantity(testProductId);
    addLog(`Incremented quantity for product ${testProductId}`, "info");
  };
  const testDecrementCart = () => {
    if (!testProductId) return addLog("No test product ID", "warning");
    decrementQuantity(testProductId);
    addLog(`Decremented quantity for product ${testProductId}`, "info");
  };
  const testUpdateCartQuantity = () => {
    if (!testProductId) return addLog("No test product ID", "warning");
    updateQuantity(testProductId, 5);
    addLog(`Set quantity for product ${testProductId} to 5`, "info");
  };
  const testRemoveFromCart = () => {
    if (!testProductId) return addLog("No test product ID", "warning");
    removeItem(testProductId);
    addLog(`Removed product ${testProductId} from cart`, "info");
  };
  const testShowState = () => {
    addLog(`Categories count: ${categories.length}`, "info");
    addLog(`Products count: ${products.length}`, "info");
    addLog(`Cart items: ${cartItems.length}, total: ${formattedTotal}`, "info");
    addLog(`testCategoryId: ${testCategoryId}, testProductId: ${testProductId}`, "info");
  };
  const testFetchCategoryCount = () => {
    if (!testCategoryId) return addLog("No test category ID", "warning");
    fetchAndLogCategoryCount(testCategoryId);
  };

  // ─── Category async tests ─────────────────────────────────────────────────
  const testFetchCategories = () => wrap(() => fetchCategories(), "fetchCategories");
  const testRefreshCategories = () => wrap(() => refreshCategories(), "refreshCategories");
  const testAddCategory = () => wrap(async () => {
    const name = `Test Cat ${Date.now()}`;
    const created = await addCategory(name);
    setTestCategoryId(created.id);
    addLog(`Created category "${name}" with id ${created.id}`, "success");
    return created;
  }, "addCategory");
  const testUpdateCategory = () => wrap(async () => {
    if (!testCategoryId) throw new Error("No test category ID. Run addCategory first.");
    const newName = `Updated ${Date.now()}`;
    const updated = await updateCategory(testCategoryId, newName);
    addLog(`Updated category ${testCategoryId} to "${newName}"`, "success");
    return updated;
  }, "updateCategory");
  const testDeleteCategory = () => wrap(async () => {
    if (!testCategoryId) throw new Error("No test category ID");
    await deleteCategory(testCategoryId);
    addLog(`Deleted category ${testCategoryId}`, "success");
    setTestCategoryId(null);
  }, "deleteCategory");
  const testDeleteMultipleCategories = () => wrap(async () => {
    const cat1 = await addCategory(`Temp1 ${Date.now()}`);
    const cat2 = await addCategory(`Temp2 ${Date.now()}`);
    await deleteMultipleCategories([cat1.id, cat2.id]);
    addLog(`Deleted multiple categories: ${cat1.id}, ${cat2.id}`, "success");
  }, "deleteMultipleCategories");
  const testFetchCategoryById = () => wrap(async () => {
    if (!testCategoryId) throw new Error("No test category ID");
    const cat = await fetchCategoryById(testCategoryId);
    addLog(`Fetched category by ID ${testCategoryId}: ${JSON.stringify(cat).slice(0, 200)}`, "info");
  }, "fetchCategoryById");
  const testFetchCategoryProducts = () => wrap(async () => {
    if (!testCategoryId) throw new Error("No test category ID");
    const resp = await fetchCategoryProducts(testCategoryId);
    addLog(`Fetched products for category ${testCategoryId}: count=${resp.products.data.length}`, "info");
  }, "fetchCategoryProducts");

  // ─── Product async tests ─────────────────────────────────────────────────
  const testFetchProducts = () => wrap(() => fetchProducts({ sort: "stock" }), "fetchProducts");
  const testRefreshProducts = () => wrap(() => refreshProducts(true), "refreshProducts");
  const testLoadMore = () => wrap(() => loadMore(), "loadMore");
  const testAddProduct = () => wrap(async () => {
    const name = `Test Product ${Date.now()}`;
    const created = await addProduct({ name, price: 99.99, stock_quantity: 10 });
    setTestProductId(created.id);
    addLog(`Created product "${name}" with id ${created.id}`, "success");
    return created;
  }, "addProduct");
  const testEditProduct = () => wrap(async () => {
    if (!testProductId) throw new Error("No test product ID");
    const updated = await editProduct(testProductId, { name: `Updated ${Date.now()}` });
    addLog(`Edited product ${testProductId}`, "success");
    return updated;
  }, "editProduct");
  const testRestockProduct = () => wrap(async () => {
    if (!testProductId) throw new Error("No test product ID");
    await restockProduct(testProductId, 5);
    addLog(`Restocked product ${testProductId} +5`, "success");
  }, "restockProduct");
  const testDeductProduct = () => wrap(async () => {
    if (!testProductId) throw new Error("No test product ID");
    await deductProduct(testProductId, 2, "test deduct");
    addLog(`Deducted product ${testProductId} -2`, "success");
  }, "deductProduct");
  const testRemoveProduct = () => wrap(async () => {
    if (!testProductId) throw new Error("No test product ID");
    await removeProduct(testProductId);
    addLog(`Removed product ${testProductId}`, "success");
    setTestProductId(null);
  }, "removeProduct");
  const testRemoveMultipleProducts = () => wrap(async () => {
    const p1 = await addProduct({ name: `Temp1 ${Date.now()}`, price: 10, stock_quantity: 5 });
    const p2 = await addProduct({ name: `Temp2 ${Date.now()}`, price: 20, stock_quantity: 5 });
    await removeMultipleProducts([p1.id, p2.id]);
    addLog(`Removed multiple products: ${p1.id}, ${p2.id}`, "success");
  }, "removeMultipleProducts");
  const testRefreshProduct = () => wrap(async () => {
    if (!testProductId) throw new Error("No test product ID");
    await refreshProduct(testProductId);
    addLog(`Refreshed product ${testProductId}`, "success");
  }, "refreshProduct");
  const testGetProductByBarcode = () => wrap(async () => {
    if (!testProductId) throw new Error("No test product ID");
    const prod = await getProductByBarcode("some-barcode");
    addLog(`getProductByBarcode: ${prod ? prod.name : "null"}`, "info");
  }, "getProductByBarcode");

  // ─── Category count tests ─────────────────────────────────────────────────
  const testCreateProductWithCategory = () => wrap(async () => {
    if (!testCategoryId) throw new Error("No test category ID");
    const name = `Prod With Cat ${Date.now()}`;
    const created = await addProduct({ 
      name, 
      price: 10, 
      stock_quantity: 5,
      category_ids: [testCategoryId]
    });
    addLog(`Created product "${name}" with category ${testCategoryId}`, "success");
    setTimeout(() => fetchAndLogCategoryCount(testCategoryId), 500);
    setTestProductId(created.id);
    return created;
  }, "createProductWithCategory");
  
  const testAssignProductToCategory = () => wrap(async () => {
    if (!testProductId || !testCategoryId) throw new Error("Missing test product or category");
    const updated = await editProduct(testProductId, { category_ids: [testCategoryId] });
    addLog(`Assigned product ${testProductId} to category ${testCategoryId}`, "success");
    setTimeout(() => fetchAndLogCategoryCount(testCategoryId), 500);
    return updated;
  }, "assignProductToCategory");
  
  const testRemoveProductFromCategory = () => wrap(async () => {
    if (!testProductId) throw new Error("No test product ID");
    const updated = await editProduct(testProductId, { category_ids: [] });
    addLog(`Removed product ${testProductId} from all categories`, "success");
    if (testCategoryId) setTimeout(() => fetchAndLogCategoryCount(testCategoryId), 500);
    return updated;
  }, "removeProductFromCategory");
  
  const testDeleteProductFromCategory = () => wrap(async () => {
    if (!testProductId) throw new Error("No test product ID");
    await removeProduct(testProductId);
    addLog(`Deleted product ${testProductId}`, "success");
    if (testCategoryId) setTimeout(() => fetchAndLogCategoryCount(testCategoryId), 500);
    setTestProductId(null);
  }, "deleteProductFromCategory");

  // ─── Cart async tests ─────────────────────────────────────────────────────
  const testAddToCart = () => wrap(async () => {
    if (!testProductId) throw new Error("No test product ID");
    const product = products.find(p => p.id === testProductId);
    if (!product) throw new Error("Product not found in state");
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image }, 1);
    addLog(`Added 1 x ${product.name} to cart`, "success");
  }, "addToCart");
  const testClearCart = () => wrap(() => clearCart(), "clearCart");
  const testConfirmPurchase = () => wrap(() => confirmPurchase(), "confirmPurchase");

  // Initial load
  useEffect(() => {
    testFetchCategories();
    testFetchProducts();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Context Test Suite</Text>
        <TouchableOpacity onPress={clearLogs} style={styles.clearBtn}>
          <Text>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Status Indicators */}
      <View style={styles.statusRow}>
        <Text>Cat loading: {catLoading ? "🔵" : "⚪"}</Text>
        <Text>Prod loading: {prodLoading ? "🔵" : "⚪"}</Text>
        <Text>Cart loading: {cartLoading ? "🔵" : "⚪"}</Text>
        <Text>Mutating: {mutating ? "🟡" : "⚪"}</Text>
        <Text>Has more: {hasMore ? "✅" : "❌"}</Text>
        <Text>Has items: {hasItems ? "🛒" : "⬜"}</Text>
      </View>

      {/* Category Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📁 Category Operations</Text>
        <View style={styles.buttonRow}>
          <Button title="Fetch Cats" onPress={testFetchCategories} />
          <Button title="Refresh Cats" onPress={testRefreshCategories} />
          <Button title="Add Category" onPress={testAddCategory} />
          <Button title="Update Category" onPress={testUpdateCategory} />
          <Button title="Delete Category" onPress={testDeleteCategory} />
          <Button title="Delete Multiple" onPress={testDeleteMultipleCategories} />
          <Button title="Fetch By ID" onPress={testFetchCategoryById} />
          <Button title="Fetch Cat Products" onPress={testFetchCategoryProducts} />
          <Button title="Get Category (sync)" onPress={testGetCategoryById} />
          <Button title="Get Name (sync)" onPress={testGetCategoryNameById} />
          <Button title="Update Count +5" onPress={testUpdateCategoryCount} />
          <Button title="Fetch Category Count" onPress={testFetchCategoryCount} />
        </View>
      </View>

      {/* Product Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Product Operations</Text>
        <View style={styles.buttonRow}>
          <Button title="Fetch Products" onPress={testFetchProducts} />
          <Button title="Refresh Products" onPress={testRefreshProducts} />
          <Button title="Load More" onPress={testLoadMore} />
          <Button title="Add Product" onPress={testAddProduct} />
          <Button title="Edit Product" onPress={testEditProduct} />
          <Button title="Restock +5" onPress={testRestockProduct} />
          <Button title="Deduct -2" onPress={testDeductProduct} />
          <Button title="Remove Product" onPress={testRemoveProduct} />
          <Button title="Remove Multiple" onPress={testRemoveMultipleProducts} />
          <Button title="Refresh Product" onPress={testRefreshProduct} />
          <Button title="Update Stock (optimistic)" onPress={testUpdateProductStock} />
          <Button title="Block Auto Refresh" onPress={testBlockAutoRefresh} />
        </View>
      </View>

      {/* Category Count Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔢 Category Count Tests</Text>
        <Text style={styles.sectionSubtitle}>Test that product_count updates correctly</Text>
        <View style={styles.buttonRow}>
          <Button title="Create Product with Category" onPress={testCreateProductWithCategory} />
          <Button title="Assign Product to Category" onPress={testAssignProductToCategory} />
          <Button title="Remove Product from Category" onPress={testRemoveProductFromCategory} />
          <Button title="Delete Product from Category" onPress={testDeleteProductFromCategory} />
        </View>
      </View>

      {/* Cart Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛒 Cart Operations</Text>
        <View style={styles.buttonRow}>
          <Button title="Add to Cart" onPress={testAddToCart} />
          <Button title="Increment" onPress={testIncrementCart} />
          <Button title="Decrement" onPress={testDecrementCart} />
          <Button title="Set Quantity 5" onPress={testUpdateCartQuantity} />
          <Button title="Remove from Cart" onPress={testRemoveFromCart} />
          <Button title="Clear Cart" onPress={testClearCart} />
          <Button title="Confirm Purchase" onPress={testConfirmPurchase} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Debug</Text>
        <View style={styles.buttonRow}>
          <Button title="Show Current State" onPress={testShowState} />
        </View>
      </View>

      {/* Logs */}
      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>📝 Logs</Text>
        <ScrollView style={styles.logsScroll} nestedScrollEnabled>
          {logs.map((log, i) => (
            <Text key={i} style={[styles.logText, styles[log.type]]}>
              [{log.timestamp}] {log.message}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const Button = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "bold" },
  clearBtn: { padding: 8, backgroundColor: "#ddd", borderRadius: 8 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12, backgroundColor: "#fff", padding: 8, borderRadius: 8 },
  section: { marginBottom: 20, backgroundColor: "#fff", padding: 12, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  sectionSubtitle: { fontSize: 12, color: "#666", marginBottom: 12 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: { backgroundColor: "#ED277C", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginVertical: 4 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  logsContainer: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 40 },
  logsScroll: { maxHeight: 300 },
  logText: { fontSize: 10, fontFamily: "monospace", marginVertical: 2 },
  info: { color: "#333" },
  success: { color: "green" },
  error: { color: "red" },
  warning: { color: "orange" },
});