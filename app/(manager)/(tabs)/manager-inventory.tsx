// app/(manager)/(tabs)/inventory.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DscToast from "@/components/common/DscToast";
import Search from "@/components/common/Search";
import AddCategoryModal from "@/components/inventory/modal/AddCategoryModal";
import AddProductModal from "@/components/inventory/modal/AddProductModal";
import CategoryManagementModal from "@/components/inventory/modal/CategoryManagementModal";
import FilterChip from "@/components/inventory/components/FilterChip";
import DeductProductModal from "@/components/inventory/modal/DeductProductModal";
import EditProductModal from "@/components/inventory/modal/EditProductModal";
import RemoveProductModal from "@/components/inventory/modal/RemoveProductModal";
import RestockProductModal from "@/components/inventory/modal/RestockProductModal";
import Header from "@/components/layout/Header";

import {
  SEARCH_DEBOUNCE_MS,
  STOCK_STATUS_COLORS,
  STOCK_STATUS_OPTIONS,
  TOAST_DURATION,
} from "@/constants/inventory.constants";
import { useCategories } from "@/context/CategoryContext";
import { ProductWithDisplay, useProducts } from "@/context/ProductContext";
import { styles } from "@/styles/inventory.styles";

type ModalType =
  | "addProduct"
  | "editProduct"
  | "restock"
  | "deduct"
  | "removeProduct"
  | "addCategory"
  | "manageCategories";

interface ProductCardProps {
  product: ProductWithDisplay;
  onAction: (type: ModalType, productId: number) => void;
  categoryNameMap: Map<number, string>;
}

const ProductCard = React.memo<ProductCardProps>(({
  product,
  onAction,
  categoryNameMap
}) => {
  const categoryDisplay =
    product.category_ids
      .map((id: number) => categoryNameMap.get(id) ?? "")
      .filter(Boolean)
      .join(", ") || "Uncategorized";

  const stockQuantity = product.stock_quantity;
  const threshold = product.low_stock_threshold ?? 0;
  let statusKey: "in_stock" | "low_stock" | "out_of_stock";
  if (stockQuantity <= 0) statusKey = "out_of_stock";
  else if (stockQuantity <= threshold) statusKey = "low_stock";
  else statusKey = "in_stock";

  const stockStatusMap = {
    out_of_stock: { ...STOCK_STATUS_COLORS.out_of_stock, label: "Out of Stock" },
    low_stock: { ...STOCK_STATUS_COLORS.low_stock, label: "Low Stock" },
    in_stock: { ...STOCK_STATUS_COLORS.in_stock, label: "In Stock" },
  };
  const stockStatus = stockStatusMap[statusKey];
  const displayImage = typeof product.displayImage === "string" ? product.displayImage : null;

  return (
    <View style={styles.productCard}>
      <View style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}>
        <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
          {stockStatus.label}
        </Text>
      </View>

      <View style={styles.productRow}>
        <View style={styles.productImageContainer}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color="#ccc" />
            </View>
          )}
        </View>
        <View style={styles.productContent}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <Text style={styles.productCategory}>{categoryDisplay}</Text>
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productPrice}>₱{product.price}</Text>
            <View style={styles.productMeta}>
              <Text style={styles.productStock}>{product.stock_quantity} pcs</Text>
              <Text style={styles.productSku}>{product.barcode || "No barcode"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* All actions are always available for managers */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onAction("restock", product.id)}>
          <Ionicons name="add-circle" size={20} color="#ED277C" />
          <Text style={styles.actionButtonText}>Restock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onAction("editProduct", product.id)}>
          <Ionicons name="create" size={20} color="#ED277C" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onAction("deduct", product.id)}>
          <Ionicons name="remove-circle" size={20} color="#ED277C" />
          <Text style={styles.actionButtonText}>Deduct</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onAction("removeProduct", product.id)}>
          <Ionicons name="trash" size={20} color="#F44336" />
          <Text style={[styles.actionButtonText, { color: "#F44336" }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function ManagerInventoryScreen() {
  const {
    products,
    loading: productsLoading,
    fetchProducts,
  } = useProducts();
  const {
    categories,
    loading: categoriesLoading,
    fetchCategories,
  } = useCategories();

  const [filters, setFilters] = useState({
    search: "",
    categoryId: null as string | null,
    status: null as string | null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    console.log("🔔 [ManagerInventory] showToast called:", message, type);
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, TOAST_DURATION);
  }, []);

  const fetchData = useCallback(async () => {
    console.log("🔄 [ManagerInventory] fetchData called");
    await Promise.all([
      fetchProducts({
        search: filters.search.trim() || undefined,
        category: filters.categoryId ?? undefined,
        _t: Date.now(),
      }),
      fetchCategories(),
    ]);
  }, [fetchProducts, fetchCategories, filters.categoryId, filters.search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.search, fetchData]);

  // Immediate category change
  useEffect(() => {
    fetchData();
  }, [filters.categoryId, fetchData]);

  // Initial load
  useEffect(() => {
    console.log("🚀 [ManagerInventory] Initial load");
    fetchData().catch(() => showToast("Failed to load initial data", "error"));
  }, []);

  const handleRefresh = useCallback(async () => {
    console.log("🔄 [ManagerInventory] Manual refresh");
    setRefreshing(true);
    try {
      await fetchData();
      showToast("Data refreshed successfully", "success");
    } catch {
      showToast("Failed to refresh data", "error");
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, showToast]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const stockQuantity = product.stock_quantity;
      const threshold = product.low_stock_threshold ?? 0;
      let productStatus: "in_stock" | "low_stock" | "out_of_stock";
      if (stockQuantity <= 0) productStatus = "out_of_stock";
      else if (stockQuantity <= threshold) productStatus = "low_stock";
      else productStatus = "in_stock";

      if (filters.status && filters.status !== productStatus) return false;
      if (filters.categoryId && !product.category_ids?.includes(Number(filters.categoryId))) return false;
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [products, filters]);

  const activeFilterCount = (filters.categoryId ? 1 : 0) + (filters.status ? 1 : 0);
  const isLoading = (productsLoading || categoriesLoading) && !refreshing;

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const openModal = (type: ModalType, productId?: number) => {
    if (productId) setSelectedProductId(productId);
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelectedProductId(null);
  };

  const onMutationSuccess = useCallback(async (message: string) => {
    console.log("✅ [ManagerInventory] Mutation success:", message);
    showToast(message, "success");
    closeModal();
    await fetchData();
  }, [showToast, fetchData]);

  const categoryNameMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach(cat => cat.id && map.set(cat.id, cat.category_name));
    return map;
  }, [categories]);

  const setSearch = (text: string) => setFilters(prev => ({ ...prev, search: text }));
  const clearSearch = () => setFilters(prev => ({ ...prev, search: "" }));
  const setCategory = (id: string | null) => setFilters(prev => ({ ...prev, categoryId: prev.categoryId === id ? null : id }));
  const setStatus = (status: string | null) => setFilters(prev => ({ ...prev, status: prev.status === status ? null : status }));
  const clearAllFilters = () => {
    setFilters({ search: "", categoryId: null, status: null });
    setShowFilters(false);
  };

  return (
    <View style={styles.container}>
      <Header title="Inventory" showBackButton={false} />

      <DscToast
        visible={!!toast}
        message={toast?.message ?? ""}
        type={toast?.type ?? "success"}
        onClose={() => setToast(null)}
        showCloseButton
      />

      {/* Modals */}
      <AddProductModal
        visible={activeModal === "addProduct"}
        onClose={closeModal}
        onSuccess={() => onMutationSuccess("Product added successfully!")}
      />
      <EditProductModal
        visible={activeModal === "editProduct"}
        onClose={closeModal}
        onSuccess={() => onMutationSuccess("Product updated successfully!")}
        product={selectedProduct}
      />
      <RestockProductModal
        visible={activeModal === "restock"}
        onClose={closeModal}
        onSuccess={() => onMutationSuccess("Product restocked successfully!")}
        product={selectedProduct}
      />
      <DeductProductModal
        visible={activeModal === "deduct"}
        onClose={closeModal}
        onSuccess={() => onMutationSuccess("Stock deducted successfully!")}
        product={selectedProduct}
      />
      <RemoveProductModal
        visible={activeModal === "removeProduct"}
        onClose={closeModal}
        onSuccess={() => onMutationSuccess("Product deleted successfully!")}
        product={selectedProduct}
        multiple={false}
      />
      <AddCategoryModal
        visible={activeModal === "addCategory"}
        onClose={closeModal}
        onSuccess={() => onMutationSuccess("Category created successfully!")}
      />
      <CategoryManagementModal
        visible={activeModal === "manageCategories"}
        onClose={closeModal}
        onSuccess={fetchData}
      />

      {/* Search and filter header */}
      <View style={styles.searchContainer}>
        <Search
          value={filters.search}
          onChangeText={setSearch}
          onClear={clearSearch}
          placeholder="Search products by name or barcode..."
          debounceMs={SEARCH_DEBOUNCE_MS}
          showClearButton
          showSearchIcon
          backgroundColor="#ffffffff"
          focusBorderColor="#ED277C"
          iconColor="#ED277C"
          containerStyle={styles.search}
        />
        <TouchableOpacity
          style={[styles.filterToggle, activeFilterCount > 0 && styles.filterToggleActive]}
          onPress={() => setShowFilters(prev => !prev)}
          activeOpacity={1}
        >
          <Ionicons
            name={showFilters ? "filter" : "filter-outline"}
            size={20}
            color={activeFilterCount > 0 ? "#ffffffff" : "#ED277C"}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.scannerButton} onPress={() => router.push("/(cashier)/InventoryBarcode")}>
          <Ionicons name="qr-code-outline" size={20} color="#ED277C" />
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer}>
              <FilterChip
                label="All"
                selected={!filters.categoryId}
                onPress={() => setFilters(prev => ({ ...prev, categoryId: null }))}
              />
              {categories.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={cat.category_name}
                  selected={filters.categoryId === cat.id?.toString()}
                  onPress={() => setCategory(cat.id?.toString() || null)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Stock Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer}>
              <FilterChip
                label="All"
                selected={!filters.status}
                onPress={() => setFilters(prev => ({ ...prev, status: null }))}
              />
              {STOCK_STATUS_OPTIONS.map((status) => (
                <FilterChip
                  key={status.id}
                  label={status.label}
                  selected={filters.status === status.id}
                  onPress={() => setStatus(status.id)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Quick actions – all are shown for managers */}
      <View style={styles.quickActionBar}>
        <TouchableOpacity style={styles.quickAction} onPress={() => openModal("addProduct")}>
          <Ionicons name="add-circle" size={20} color="#ED277C" />
          <Text style={styles.quickActionText}>Add Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => openModal("addCategory")}>
          <Ionicons name="folder-open" size={20} color="#ED277C" />
          <Text style={styles.quickActionText}>New Category</Text>
        </TouchableOpacity>
      </View>

      {/* Product list */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ED277C" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => `${item.id}-${item.stock_quantity}`}
          extraData={filteredProducts}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#ED277C"]} />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onAction={(type, productId) => openModal(type, productId)}
              categoryNameMap={categoryNameMap}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text style={styles.clearFiltersLink}>Clear filters</Text>
                </TouchableOpacity>
              )}
              {activeFilterCount === 0 && (
                <TouchableOpacity style={styles.emptyButton} onPress={() => openModal("addProduct")}>
                  <Text style={styles.emptyButtonText}>Add Your First Product</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Manage categories – always shown for managers */}
      <TouchableOpacity style={styles.manageCategoriesButton} onPress={() => openModal("manageCategories")}>
        <Ionicons name="settings-outline" size={20} color="#fff" />
        <Text style={styles.manageCategoriesText}>Manage Categories</Text>
      </TouchableOpacity>
    </View>
  );
}