import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCategories } from "@/context/CategoryContext";
import { usePermissions } from "@/context/PermissionContext";
import { getProductsApi } from "@/services/productService";
import fallbackImage from "@/assets/images/no-image.jpg";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formatPrice = (price: any) => {
  const n = parseFloat(price);
  return isNaN(n) ? "0.00" : n.toFixed(2);
};

export default function AddCategoryModal({
  visible,
  onClose,
  onSuccess,
}: Props) {
  const { addCategory, loading: categoriesLoading } = useCategories();
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("create_categories");

  // Form state
  const [categoryName, setCategoryName] = useState("");
  const [categoryNameError, setCategoryNameError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All products from API
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const pendingLoadRef = useRef<boolean>(false);

  // Load all products once when modal opens
  const loadProducts = useCallback(async () => {
    pendingLoadRef.current = true;
    setProductsLoading(true);
    try {
      const page = await getProductsApi({ perPage: 500 });
      if (!pendingLoadRef.current) return;
      setAllProducts(page.data);
    } catch (err) {
      // non‑fatal; user can still create category without products
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Reset everything when modal opens
  useEffect(() => {
    if (!visible) return;
    // Reset all local state
    setCategoryName("");
    setCategoryNameError("");
    setSearchQuery("");
    setSelectedIds([]);
    setError(null);
    setSubmitting(false);
    pendingLoadRef.current = true;
    loadProducts();
    return () => {
      pendingLoadRef.current = false;
    };
  }, [visible, loadProducts]);

  // Auto‑close if permission denied
  useEffect(() => {
    if (visible && !canCreate) {
      setError("You don't have permission to create categories");
      setTimeout(() => onClose(), 2000);
    }
  }, [visible, canCreate, onClose]);

  // Derived lists (filtered by search)
  const { available, selected } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const matches = (p: any) => {
      if (!q) return true;
      return (
        (p.name?.toLowerCase().includes(q) ?? false) ||
        (p.barcode?.toLowerCase().includes(q) ?? false)
      );
    };
    return {
      available: allProducts.filter(
        (p) => !selectedIds.includes(p.id) && matches(p)
      ),
      selected: allProducts.filter(
        (p) => selectedIds.includes(p.id) && matches(p)
      ),
    };
  }, [allProducts, selectedIds, searchQuery]);

  // Selection helpers
  const addId = useCallback((id: number) => {
    setSelectedIds((prev) => [...prev, id]);
  }, []);
  const removeId = useCallback((id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  // Validation
  const validate = (): boolean => {
    if (!categoryName.trim()) {
      setCategoryNameError("Category name is required");
      return false;
    }
    if (categoryName.length > 255) {
      setCategoryNameError("Category name must be less than 255 characters");
      return false;
    }
    setCategoryNameError("");
    return true;
  };

  // Submit
  const handleSubmit = async () => {
    if (submitting) return;
    if (!canCreate) {
      setError("You don't have permission to create categories");
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    setError(null);
    try {
      await addCategory(categoryName.trim(), selectedIds.length > 0 ? selectedIds : undefined);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const nameError = err?.response?.data?.errors?.category_name?.[0];
      if (nameError) setCategoryNameError(nameError);
      setError(
        nameError ??
        err.response?.data?.message ??
        err.message ??
        "Failed to create category"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Product row rendering
  const renderItem = (product: any, isSelected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={product.id}
      style={styles.listItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={
            typeof product.image === "string" && product.image_exists
              ? { uri: product.image }
              : fallbackImage
          }
          style={styles.productImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.itemDetails}>
          ₱{formatPrice(product.price)} • #{product.barcode || "No barcode"}
        </Text>
      </View>
      <Ionicons
        name={isSelected ? "remove-circle" : "add-circle"}
        size={24}
        color={isSelected ? "#F44336" : "#4CAF50"}
      />
    </TouchableOpacity>
  );

  // Access denied view
  if (!canCreate && visible) {
    return (
      <Modal visible={visible} transparent onRequestClose={onClose} animationType="none">
        <View style={styles.overlay}>
          <View style={[styles.content, styles.errorContent]}>
            <Ionicons name="lock-closed" size={48} color="#F44336" />
            <Text style={styles.errorTitle}>Access Denied</Text>
            <Text style={styles.errorMessage}>
              You don't have permission to create categories.
            </Text>
            <TouchableOpacity style={styles.errorButton} onPress={onClose}>
              <Text style={styles.errorButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {submitting && (
            <View style={styles.submittingOverlay}>
              <ActivityIndicator size="large" color="#ED277C" />
            </View>
          )}

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create New Category</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={submitting}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Category Name */}
            <View style={styles.nameSection}>
              <Text style={styles.label}>
                Category Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  categoryNameError ? styles.inputError : null,
                ]}
                placeholder="Enter category name"
                value={categoryName}
                onChangeText={(t) => {
                  setCategoryName(t);
                  setCategoryNameError("");
                }}
                maxLength={255}
                editable={!submitting}
              />
              {!!categoryNameError && (
                <Text style={styles.errorText}>{categoryNameError}</Text>
              )}
            </View>

            {/* Product Assignment */}
            <View style={styles.assignSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assign Products</Text>
                <Text style={styles.sectionSubtitle}>
                  {selectedIds.length} product
                  {selectedIds.length !== 1 ? "s" : ""} assigned
                </Text>
              </View>

              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  editable={!submitting}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {!!searchQuery && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.dualListContainer}>
                {/* Available */}
                <View style={styles.listContainer}>
                  <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>Available</Text>
                    {available.length > 0 && !submitting && (
                      <TouchableOpacity
                        onPress={() => available.forEach((p) => addId(p.id))}
                      >
                        <Text style={styles.selectAllText}>Add All</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {productsLoading ? (
                    <ActivityIndicator
                      size="small"
                      color="#ED277C"
                      style={{ padding: 20 }}
                    />
                  ) : (
                    <ScrollView
                      style={styles.list}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {available.length === 0 ? (
                        <Text style={styles.emptyListText}>
                          {searchQuery
                            ? "No matching products"
                            : "No products available"}
                        </Text>
                      ) : (
                        available.map((p) =>
                          renderItem(p, false, () => addId(p.id))
                        )
                      )}
                    </ScrollView>
                  )}
                </View>

                {/* Assigned */}
                <View style={styles.listContainer}>
                  <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>Assigned</Text>
                    {selectedIds.length > 0 && !submitting && (
                      <TouchableOpacity onPress={() => setSelectedIds([])}>
                        <Text style={styles.removeAllText}>Remove All</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {productsLoading ? (
                    <ActivityIndicator
                      size="small"
                      color="#ED277C"
                      style={{ padding: 20 }}
                    />
                  ) : (
                    <ScrollView
                      style={styles.list}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {selected.length === 0 ? (
                        <Text style={styles.emptyListText}>
                          {searchQuery
                            ? "No matching assigned products"
                            : "No products assigned yet"}
                        </Text>
                      ) : (
                        selected.map((p) =>
                          renderItem(p, true, () => removeId(p.id))
                        )
                      )}
                    </ScrollView>
                  )}
                </View>
              </View>
            </View>

            {/* Error banner */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="close-circle" size={16} color="#C62828" />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Category</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ======================== Styles (copied from EditCategoryModal) ========================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "90%",
    maxHeight: "92%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "column",
  },
  submittingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  // Access denied
  errorContent: { padding: 24, alignItems: "center" },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: "#ED277C",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexShrink: 0,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  closeButton: { padding: 4 },

  // Category name section
  nameSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexShrink: 0,
  },
  label: { fontSize: 14, color: "#666", marginBottom: 4, fontWeight: "500" },
  required: { color: "#F44336" },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#F44336" },
  errorText: { color: "#F44336", fontSize: 12, marginTop: 2 },

  // Assignment section
  assignSection: {
    padding: 16,
    flexShrink: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    flexShrink: 0,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#333" },
  sectionSubtitle: { fontSize: 12, color: "#ED277C", fontWeight: "500" },

  // Search bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    gap: 8,
    flexShrink: 0,
  },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: "#333" },

  // Dual list
  dualListContainer: {
    flexDirection: "row",
    gap: 10,
    minHeight: 220,
    maxHeight: 400,
  },
  listContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    overflow: "hidden",
    flexDirection: "column",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
    flexShrink: 0,
  },
  listTitle: { fontSize: 12, fontWeight: "600", color: "#666" },
  selectAllText: { fontSize: 11, color: "#4CAF50", fontWeight: "600" },
  removeAllText: { fontSize: 11, color: "#F44336", fontWeight: "600" },
  list: { flex: 1 },
  emptyListText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  productImageContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  productImage: { width: "100%", height: "100%" },
  itemInfo: { flex: 1, marginRight: 6 },
  itemName: { fontSize: 13, fontWeight: "500", color: "#333", marginBottom: 2 },
  itemDetails: { fontSize: 11, color: "#999" },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    gap: 8,
    flexShrink: 0,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: "#C62828" },

  // Footer
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
    flexShrink: 0,
    backgroundColor: "#fff",
  },
  button: {
    flex: 1,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButton: { backgroundColor: "#f5f5f5", borderColor: "#e0e0e0" },
  cancelButtonText: { color: "#666", fontSize: 14, fontWeight: "600" },
  submitButton: { backgroundColor: "#ED277C", borderColor: "#ED277C" },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});