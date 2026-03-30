import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useCategories } from "@/context/CategoryContext";
import { useProducts } from "@/context/ProductContext";

export default function CrudSimulator() {
  // Category state
  const [catName, setCatName] = useState("");
  const [catId, setCatId] = useState("");
  const [catProductIds, setCatProductIds] = useState(""); // comma separated

  // Product state
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodId, setProdId] = useState("");
  const [prodCategoryIds, setProdCategoryIds] = useState(""); // comma separated

  // Contexts
  const {
    categories,
    loading: catLoading,
    error: catError,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteMultipleCategories,
  } = useCategories();

  const {
    products,
    loading: prodLoading,
    error: prodError,
    fetchProducts,
    addProduct,
    editProduct,
    removeProduct,
    removeMultipleProducts,
    restockProduct,
    deductProduct,
  } = useProducts();

  // ─── Category CRUD ─────────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!catName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }
    try {
      const created = await addCategory(catName);
      Alert.alert("Success", `Category "${created.category_name}" created with ID ${created.id}`);
      setCatName("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create category");
    }
  };

  const handleUpdateCategory = async () => {
    const id = parseInt(catId);
    if (isNaN(id)) {
      Alert.alert("Error", "Valid category ID is required");
      return;
    }
    if (!catName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }
    const productIds = catProductIds
      .split(",")
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
    try {
      const updated = await updateCategory(id, catName, productIds);
      Alert.alert("Success", `Category "${updated.category_name}" updated`);
      setCatId("");
      setCatName("");
      setCatProductIds("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async () => {
    const id = parseInt(catId);
    if (isNaN(id)) {
      Alert.alert("Error", "Valid category ID is required");
      return;
    }
    try {
      await deleteCategory(id);
      Alert.alert("Success", `Category ${id} deleted`);
      setCatId("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete category");
    }
  };

  const handleDeleteMultipleCategories = async () => {
    const ids = catId
      .split(",")
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
    if (ids.length === 0) {
      Alert.alert("Error", "Enter at least one category ID (comma separated)");
      return;
    }
    try {
      await deleteMultipleCategories(ids);
      Alert.alert("Success", `Deleted categories: ${ids.join(", ")}`);
      setCatId("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete categories");
    }
  };

  // ─── Product CRUD ──────────────────────────────────────────────────────────
  const handleAddProduct = async () => {
    if (!prodName.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }
    const price = parseFloat(prodPrice);
    if (isNaN(price)) {
      Alert.alert("Error", "Valid price is required");
      return;
    }
    const stock = parseInt(prodStock);
    if (isNaN(stock)) {
      Alert.alert("Error", "Valid stock quantity is required");
      return;
    }
    const categoryIds = prodCategoryIds
      .split(",")
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
    try {
      const created = await addProduct({
        name: prodName,
        price,
        stock_quantity: stock,
        category_ids: categoryIds,
      });
      Alert.alert("Success", `Product "${created.name}" created with ID ${created.id}`);
      setProdName("");
      setProdPrice("");
      setProdStock("");
      setProdCategoryIds("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create product");
    }
  };

  const handleUpdateProduct = async () => {
    const id = parseInt(prodId);
    if (isNaN(id)) {
      Alert.alert("Error", "Valid product ID is required");
      return;
    }
    const updates: any = {};
    if (prodName.trim()) updates.name = prodName;
    if (prodPrice.trim()) updates.price = parseFloat(prodPrice);
    if (prodStock.trim()) updates.stock_quantity = parseInt(prodStock);
    if (prodCategoryIds.trim()) {
      updates.category_ids = prodCategoryIds
        .split(",")
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
    }
    try {
      const updated = await editProduct(id, updates);
      Alert.alert("Success", `Product "${updated.name}" updated`);
      setProdId("");
      setProdName("");
      setProdPrice("");
      setProdStock("");
      setProdCategoryIds("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update product");
    }
  };

  const handleDeleteProduct = async () => {
    const id = parseInt(prodId);
    if (isNaN(id)) {
      Alert.alert("Error", "Valid product ID is required");
      return;
    }
    try {
      await removeProduct(id);
      Alert.alert("Success", `Product ${id} deleted`);
      setProdId("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete product");
    }
  };

  const handleDeleteMultipleProducts = async () => {
    const ids = prodId
      .split(",")
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
    if (ids.length === 0) {
      Alert.alert("Error", "Enter at least one product ID (comma separated)");
      return;
    }
    try {
      await removeMultipleProducts(ids);
      Alert.alert("Success", `Deleted products: ${ids.join(", ")}`);
      setProdId("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete products");
    }
  };

  const handleRestockProduct = async () => {
    const id = parseInt(prodId);
    const qty = parseInt(prodStock);
    if (isNaN(id) || isNaN(qty)) {
      Alert.alert("Error", "Valid product ID and quantity are required");
      return;
    }
    try {
      await restockProduct(id, qty);
      Alert.alert("Success", `Restocked product ${id} by ${qty}`);
      setProdId("");
      setProdStock("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to restock product");
    }
  };

  const handleDeductProduct = async () => {
    const id = parseInt(prodId);
    const qty = parseInt(prodStock);
    if (isNaN(id) || isNaN(qty)) {
      Alert.alert("Error", "Valid product ID and quantity are required");
      return;
    }
    try {
      await deductProduct(id, qty, "manual deduction");
      Alert.alert("Success", `Deducted ${qty} from product ${id}`);
      setProdId("");
      setProdStock("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to deduct product");
    }
  };

  // ─── Refresh data ──────────────────────────────────────────────────────────
  const handleRefreshAll = async () => {
    await Promise.all([fetchCategories(), fetchProducts()]);
    Alert.alert("Refreshed", "Categories and products reloaded");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🧪 CRUD Simulator</Text>

      {/* Category Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📁 Categories</Text>
        <View style={styles.info}>
          <Text>Count: {categories.length}</Text>
          <Text>Loading: {catLoading ? "🔵" : "⚪"}</Text>
          {catError && <Text style={styles.error}>Error: {catError}</Text>}
        </View>
        <View style={styles.list}>
          {categories.slice(0, 5).map(cat => (
            <Text key={cat.id} style={styles.listItem}>
              {cat.id}: {cat.category_name} ({cat.product_count ?? 0} products)
            </Text>
          ))}
          {categories.length > 5 && <Text>... and {categories.length - 5} more</Text>}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Category Name"
          value={catName}
          onChangeText={setCatName}
        />
        <TextInput
          style={styles.input}
          placeholder="Category ID (for update/delete)"
          value={catId}
          onChangeText={setCatId}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Product IDs (comma separated)"
          value={catProductIds}
          onChangeText={setCatProductIds}
        />
        <View style={styles.buttonRow}>
          <Button title="➕ Add Category" onPress={handleAddCategory} />
          <Button title="✏️ Update Category" onPress={handleUpdateCategory} />
          <Button title="🗑️ Delete Category" onPress={handleDeleteCategory} />
          <Button title="🗑️ Delete Multiple" onPress={handleDeleteMultipleCategories} />
        </View>
      </View>

      {/* Product Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Products</Text>
        <View style={styles.info}>
          <Text>Count: {products.length}</Text>
          <Text>Loading: {prodLoading ? "🔵" : "⚪"}</Text>
          {prodError && <Text style={styles.error}>Error: {prodError}</Text>}
        </View>
        <View style={styles.list}>
          {products.slice(0, 5).map(prod => (
            <Text key={prod.id} style={styles.listItem}>
              {prod.id}: {prod.name} - ₱{prod.price} ({prod.stock_quantity} pcs)
            </Text>
          ))}
          {products.length > 5 && <Text>... and {products.length - 5} more</Text>}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Product Name"
          value={prodName}
          onChangeText={setProdName}
        />
        <TextInput
          style={styles.input}
          placeholder="Price"
          value={prodPrice}
          onChangeText={setProdPrice}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Stock Quantity"
          value={prodStock}
          onChangeText={setProdStock}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Product ID (for update/delete)"
          value={prodId}
          onChangeText={setProdId}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Category IDs (comma separated)"
          value={prodCategoryIds}
          onChangeText={setProdCategoryIds}
        />
        <View style={styles.buttonRow}>
          <Button title="➕ Add Product" onPress={handleAddProduct} />
          <Button title="✏️ Update Product" onPress={handleUpdateProduct} />
          <Button title="🗑️ Delete Product" onPress={handleDeleteProduct} />
          <Button title="🗑️ Delete Multiple" onPress={handleDeleteMultipleProducts} />
          <Button title="📦 Restock" onPress={handleRestockProduct} />
          <Button title="➖ Deduct" onPress={handleDeductProduct} />
        </View>
      </View>

      <View style={styles.section}>
        <Button title="🔄 Refresh All Data" onPress={handleRefreshAll} />
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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  info: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 },
  list: { maxHeight: 150, marginBottom: 12, padding: 8, backgroundColor: "#f9f9f9", borderRadius: 8 },
  listItem: { fontSize: 12, fontFamily: "monospace", marginVertical: 2 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 14 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  button: { backgroundColor: "#ED277C", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginVertical: 4 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  error: { color: "red", fontSize: 12, marginTop: 4 },
});