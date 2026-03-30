import Search from "@/components/common/Search";
import CategorySlider from "@/components/product/CategorySlider";
import ProductCard from "@/components/product/ProductCard";
import ProductModal from "@/components/modal/ProductModal";
import Header from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { useCategories } from "@/context/CategoryContext";
import { router } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ProductScreen() {
  const { addItem, itemCount, hasItems, cartItems } = useCart();
  const { products, loading, fetchProducts, refreshProducts} = useProducts();
  const { categories } = useCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState({
    id: 1,
    name: "All items",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Load products once on mount
  useEffect(() => {
    fetchProducts({ page: 1, perPage: 50 });
  }, []);

  // Compute products with availability, sort, and filter
  const computedProducts = useMemo(() => {
    return products
      .map((product) => {
        const inCart = cartItems.find((i) => i.id === product.id)?.quantity ?? 0;
        const available = Math.max(0, product.stock_quantity - inCart);
        const firstCategoryId = product.category_ids?.[0] ?? product.category_id ?? 0;
        const categoryName = firstCategoryId
          ? categories.find((c) => c.id === firstCategoryId)?.category_name ?? ""
          : "";

        return {
          ...product,
          available,
          categoryName,
          categoryIds: product.category_ids ?? [],
          image: product.image ?? null,
        };
      })
      .sort((a, b) => {
        // In‑stock first
        if (a.available > 0 && b.available <= 0) return -1;
        if (a.available <= 0 && b.available > 0) return 1;
        return 0;
      })
      .filter((product) => {
        const matchesSearch =
          !searchQuery ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory.id === 1 ||
          product.categoryIds.includes(selectedCategory.id);
        return matchesSearch && matchesCategory;
      });
  }, [products, cartItems, categories, searchQuery, selectedCategory]); // version ensures recompute after refresh

  const goToCart = () => router.push("/(cashier)/cart");
  const goBack = () => router.back();

  const selectProduct = (product: any) => {
    if (product.available === 0) return;
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const addToCart = (quantity: number) => {
    if (!selectedProduct) return;
    addItem(
      {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image,
      },
      quantity
    );
    setModalVisible(false);
    goToCart();
  };


  const showBadge = hasItems;
  const badgeValue = itemCount > 99 ? "99+" : itemCount;

  const CartButton = useMemo(
    () => (
      <TouchableOpacity onPress={goToCart} style={styles.cartButton}>
        <Ionicons name="cart-outline" size={24} color="#333" />
        {showBadge && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{badgeValue}</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [showBadge, badgeValue]
  );

  const isInitialLoading = loading && products.length === 0;
  const isEmpty = computedProducts.length === 0;

  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <Header
          title="PRODUCTS"
          showBackButton
          onBackPress={goBack}
          backgroundColor="#ffffff"
          titleColor="#333"
          rightComponent={CartButton}
        />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ED277C" />
        </View>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <Header
          title="PRODUCTS"
          showBackButton
          onBackPress={goBack}
          backgroundColor="#ffffff"
          titleColor="#333"
          rightComponent={CartButton}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyMessage}>
            {searchQuery
              ? `No products matching "${searchQuery}"`
              : `No products in ${selectedCategory.name}`}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="PRODUCTS"
        showBackButton
        onBackPress={goBack}
        backgroundColor="#ffffff"
        titleColor="#333"
        rightComponent={CartButton}
      />

      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Search
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder="Search products..."
            debounceMs={400}
            showClearButton
            showSearchIcon
            backgroundColor="#f8f8f8"
            focusBorderColor="#ED277C"
            iconColor="#ED277C"
            containerStyle={styles.search}
          />
        </View>
      </View>
      
      <CategorySlider
        onCategoryChange={(id, name) => setSelectedCategory({ id, name })}
        selectedCategoryId={selectedCategory.id}
      />

      <FlatList
        data={computedProducts}
        renderItem={({ item }) => (
          <ProductCard
            id={item.id}
            name={item.name}
            price={item.price}
            stock={item.available}
            totalStock={item.stock_quantity}
            category={item.categoryName}
            image={item.image || undefined}
            onPress={() => selectProduct(item)}
            isOutOfStock={item.available === 0}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />


      {selectedProduct && (
        <ProductModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAddToCart={addToCart}
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            stock: selectedProduct.available,
            category: selectedProduct.categoryName,
            image: selectedProduct.image,
          }}
        />
      )}
    </View>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  cartButton: { position: "relative", padding: 4 },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#ED277C",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchWrapper: { flex: 1 },
  search: { borderRadius: 25, height: 45 },
  listContent: { paddingTop: 16, paddingHorizontal: 12, paddingBottom: 20 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});