import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useCategories } from "@/context/CategoryContext";
import { useProducts } from "@/context/ProductContext";

export default function ContextVisualizer() {
  const {
    categories,
    loading: catLoading,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
  } = useCategories();

  const {
    products,
    loading: prodLoading,
    fetchProducts,
    addProduct,
    editProduct,
    removeProduct,
    restockProduct,
    deductProduct,
    refreshProducts,
  } = useProducts();

  // Local UI state
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"category" | "product">("category");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    categoryIds: "",
  });

  // Load initial data
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Refresh data
  const refreshAll = async () => {
    await Promise.all([refreshCategories(), refreshProducts()]);
  };

  // ─── Category actions ─────────────────────────────────────────────────────
  const handleAddCategory = async (name: string) => {
    try {
      await addCategory(name);
      Alert.alert("Success", `Category "${name}" added`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleEditCategory = async (id: number, name: string) => {
    try {
      await updateCategory(id, name);
      Alert.alert("Success", `Category updated`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    Alert.alert("Confirm", "Delete this category?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCategory(id);
            Alert.alert("Success", "Category deleted");
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  // ─── Product actions ──────────────────────────────────────────────────────
  const handleAddProduct = async (data: any) => {
    try {
      await addProduct({
        name: data.name,
        price: parseFloat(data.price),
        stock_quantity: parseInt(data.stock),
        category_ids: data.categoryIds
          .split(",")
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id)),
      });
      Alert.alert("Success", `Product "${data.name}" added`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleEditProduct = async (id: number, data: any) => {
    try {
      await editProduct(id, {
        name: data.name,
        price: parseFloat(data.price),
        stock_quantity: parseInt(data.stock),
        category_ids: data.categoryIds
          .split(",")
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id)),
      });
      Alert.alert("Success", `Product updated`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    Alert.alert("Confirm", "Delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeProduct(id);
            Alert.alert("Success", "Product deleted");
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const handleRestock = async (id: number, qty: number) => {
    try {
      await restockProduct(id, qty);
      Alert.alert("Success", `Restocked ${qty}`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDeduct = async (id: number, qty: number) => {
    try {
      await deductProduct(id, qty);
      Alert.alert("Success", `Deducted ${qty}`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // ─── Modal handling ───────────────────────────────────────────────────────
  const openModal = (type: "category" | "product", item?: any) => {
    setModalType(type);
    if (type === "category" && item) {
      setSelectedCategory(item);
      setFormData({ name: item.category_name, price: "", stock: "", categoryIds: "" });
    } else if (type === "product" && item) {
      setSelectedProduct(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        stock: item.stock_quantity.toString(),
        categoryIds: item.category_ids?.join(", ") || "",
      });
    } else {
      setSelectedCategory(null);
      setSelectedProduct(null);
      setFormData({ name: "", price: "", stock: "", categoryIds: "" });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (modalType === "category") {
      if (selectedCategory) {
        await handleEditCategory(selectedCategory.id, formData.name);
      } else {
        await handleAddCategory(formData.name);
      }
    } else {
      if (selectedProduct) {
        await handleEditProduct(selectedProduct.id, formData);
      } else {
        await handleAddProduct(formData);
      }
    }
    setModalVisible(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Context Visualizer</Text>
        <TouchableOpacity onPress={refreshAll} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📁 Categories ({categories.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openModal("category")}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {catLoading && <Text>Loading...</Text>}
          {categories.map(cat => (
            <View key={cat.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{cat.category_name}</Text>
                <Text style={styles.cardSubtitle}>ID: {cat.id}</Text>
              </View>
              <Text style={styles.cardDetail}>Products: {cat.product_count ?? 0}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openModal("category", cat)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📦 Products ({products.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openModal("product")}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {prodLoading && <Text>Loading...</Text>}
          {products.map(prod => (
            <View key={prod.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{prod.name}</Text>
                <Text style={styles.cardSubtitle}>ID: {prod.id}</Text>
              </View>
              <Text style={styles.cardDetail}>Price: ₱{prod.price}</Text>
              <Text style={styles.cardDetail}>Stock: {prod.stock_quantity} pcs</Text>
              <Text style={styles.cardDetail}>Categories: {prod.category_ids?.join(", ") || "None"}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openModal("product", prod)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteProduct(prod.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRestock(prod.id, 1)}>
                  <Text style={styles.stockText}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeduct(prod.id, 1)}>
                  <Text style={styles.stockText}>-1</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal for Add/Edit */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedCategory ? "Edit Category" : selectedProduct ? "Edit Product" : modalType === "category" ? "Add Category" : "Add Product"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={modalType === "category" ? "Category Name" : "Product Name"}
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
            />
            {modalType === "product" && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Price"
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={text => setFormData({ ...formData, price: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Stock Quantity"
                  keyboardType="numeric"
                  value={formData.stock}
                  onChangeText={text => setFormData({ ...formData, stock: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Category IDs (comma separated)"
                  value={formData.categoryIds}
                  onChangeText={text => setFormData({ ...formData, categoryIds: text })}
                />
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalSubmit]} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#ddd" },
  title: { fontSize: 18, fontWeight: "bold" },
  refreshButton: { backgroundColor: "#ED277C", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  refreshButtonText: { color: "#fff", fontWeight: "bold" },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "bold" },
  addButton: { backgroundColor: "#4CAF50", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardSubtitle: { fontSize: 12, color: "#666" },
  cardDetail: { fontSize: 14, color: "#333", marginBottom: 2 },
  cardActions: { flexDirection: "row", marginTop: 8, gap: 12 },
  editText: { color: "#2196F3", fontWeight: "500" },
  deleteText: { color: "#F44336", fontWeight: "500" },
  stockText: { color: "#4CAF50", fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20, width: "90%", maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  modalSubmit: { backgroundColor: "#ED277C" },
  submitText: { color: "#fff", fontWeight: "bold" },
});