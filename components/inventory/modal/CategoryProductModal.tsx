import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCategories } from "@/context/CategoryContext";
import { styles } from "@/styles/inventory.styles";

interface CategoryProductsModalProps {
  visible: boolean;
  categoryId: number | null;
  categoryName: string;
  onClose: () => void;
}

export const CategoryProductsModal: React.FC<CategoryProductsModalProps> = ({
  visible,
  categoryId,
  categoryName,
  onClose,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const { fetchCategoryProducts } = useCategories();

  const loadProducts = useCallback(
    async (pageNum: number, refresh = false) => {
      if (!categoryId) return;

      if (refresh) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await fetchCategoryProducts(categoryId, pageNum, 20);
        const newProducts = response.products.data;

        if (refresh) {
          setProducts(newProducts);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }

        setHasMore(response.products.hasMore);
        setTotal(response.products.total);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to load category products:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categoryId, fetchCategoryProducts],
  );

  useEffect(() => {
    if (visible && categoryId) {
      // Reset state when modal opens
      setProducts([]);
      setPage(1);
      setHasMore(true);
      loadProducts(1, true);
    }
  }, [visible, categoryId, loadProducts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadProducts(page + 1);
    }
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <View style={styles.productRow}>
        <View style={styles.productImageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color="#ccc" />
            </View>
          )}
        </View>
        <View style={styles.productContent}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productSku}>{item.barcode || "No barcode"}</Text>
          <View style={styles.productDetails}>
            <Text style={styles.productPrice}>₱{item.price}</Text>
            <Text style={styles.productStock}>{item.stock_quantity} pcs</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.modalHeader}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>
        {categoryName} ({total} products)
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        {renderHeader()}

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ED277C" />
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProduct}
            contentContainerStyle={styles.modalListContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  size="small"
                  color="#ED277C"
                  style={{ padding: 16 }}
                />
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>
                    No products in this category
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
};
