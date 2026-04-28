// components/common/CategorySlider.tsx
import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useCategories } from "@/context/CategoryContext";
import { useProducts } from "@/context/ProductContext";

const { width } = Dimensions.get("window");

interface CategoryItem {
  id: number;
  name: string;
  count?: number;
}

interface CategorySliderProps {
  onCategoryChange?: (categoryId: number, categoryName: string) => void;
  selectedCategoryId?: number;
}

export default function CategorySlider({
  onCategoryChange,
  selectedCategoryId = -1,
}: CategorySliderProps) {
  const { categories, loading: categoriesLoading } = useCategories();
  const { products, loading: productsLoading } = useProducts();
  const [activeCategory, setActiveCategory] = useState(selectedCategoryId);
  const scrollViewRef = useRef<ScrollView>(null);

  // Sync with prop when it changes
  useEffect(() => {
    if (selectedCategoryId !== activeCategory) {
      setActiveCategory(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // Build category list with product counts
  const categoryList = useMemo(() => {
    const list: CategoryItem[] = [];

    // Add "All items" first with total product count
    list.push({
      id: -1,
      name: "All items",
      count: products.length,
    });

    if (productsLoading || products.length === 0) {
      return list;
    }

    // Count products per category using category_ids
    const categoryCounts = new Map<number, number>();

    products.forEach((product) => {
      // Use category_ids from your Product type
      if (product.category_ids && Array.isArray(product.category_ids)) {
        // Use a Set to ensure each product is counted once per category
        const uniqueCategories = new Set<number>();

        product.category_ids.forEach((catId: number) => {
          uniqueCategories.add(catId);
        });

        uniqueCategories.forEach((catId: number) => {
          categoryCounts.set(catId, (categoryCounts.get(catId) || 0) + 1);
        });
      } else if (product.category_id) {
        // Fallback to single category_id
        categoryCounts.set(product.category_id, (categoryCounts.get(product.category_id) || 0) + 1);
      }
    });

    // Add categories with their product counts
    categories.forEach((cat) => {
      const count = categoryCounts.get(cat.id) || 0;
      if (count > 0) {
        list.push({
          id: cat.id,
          name: cat.category_name,
          count,
        });
      }
    });

    return list;
  }, [categories, products, productsLoading]);

  const handleCategoryPress = (categoryId: number, categoryName: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId, categoryName);

    const index = categoryList.findIndex((c) => c.id === categoryId);
    if (index !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * 100,
        animated: false,
      });
    }
  };

  // Show ActivityIndicator while loading instead of skeleton
  if (categoriesLoading || productsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#ED277C" />
      </View>
    );
  }

  if (categoryList.length <= 1) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categoryList.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <TouchableOpacity
              key={`category-${category.id}`}
              style={[
                styles.categoryItem,
                isActive && styles.activeCategoryItem,
              ]}
              onPress={() => handleCategoryPress(category.id, category.name)}
              activeOpacity={1}
            >
              <Text
                style={[
                  styles.categoryText,
                  isActive && styles.activeCategoryText,
                ]}
                numberOfLines={1}
              >
                {category.name}
              </Text>
              {category.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isActive && styles.activeCountBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isActive && styles.activeCountText,
                    ]}
                  >
                    {category.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeCategoryItem: {
    backgroundColor: "#ED277C",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeCategoryText: {
    color: "#fff",
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: "#ED277C20",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  activeCountBadge: {
    backgroundColor: "#fff",
  },
  countText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ED277C",
  },
  activeCountText: {
    color: "#ED277C",
  },
});