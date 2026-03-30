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
  selectedCategoryId = 1,
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
      id: 1,
      name: "All items",
      count: products.length,
    });

    if (productsLoading || products.length === 0) {
      return list;
    }

    // Count products per category (unique products)
    const categoryCounts = new Map<number, number>();

    products.forEach((product) => {
      if (product.categories && Array.isArray(product.categories)) {
        const uniqueCategories = new Set<number>();

        product.categories.forEach((cat) => {
          if (cat && cat.id) {
            uniqueCategories.add(cat.id);
          }
        });

        uniqueCategories.forEach((catId: number) => {
          categoryCounts.set(catId, (categoryCounts.get(catId) || 0) + 1);
        });
      }
    });

    // Add categories with their product counts - SKIP ID 1
    categories.forEach((cat) => {
      if (cat.id === 1) {
        return;
      }

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
        animated: false, // Disabled animation
      });
    }
  };

  if (categoriesLoading || productsLoading) {
    return <CategorySliderSkeleton />;
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
              activeOpacity={1} // Removed opacity animation
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

// Skeleton loader for categories
export const CategorySliderSkeleton = () => (
  <View style={styles.container}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {[1, 2, 3, 4].map((item) => (
        <View
          key={`skeleton-${item}`}
          style={[styles.categoryItem, styles.skeletonItem]}
        >
          <View style={styles.skeletonText} />
        </View>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingVertical: 8,
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
  skeletonItem: {
    backgroundColor: "#f0f0f0",
    minWidth: 80,
    height: 36,
  },
  skeletonText: {
    width: 60,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ddd",
  },
});
