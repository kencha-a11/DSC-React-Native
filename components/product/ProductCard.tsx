// components/product/ProductCard.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  stock: number; // available stock
  totalStock?: number; // total stock for reference
  image?: string;
  category?: string;
  onPress?: () => void;
  isOutOfStock?: boolean;
}

export default function ProductCard({
  id,
  name,
  price,
  stock,
  totalStock,
  image,
  category,
  onPress,
  isOutOfStock = false,
}: ProductCardProps) {
  const isLowStock = stock > 0 && stock < 10;

  // Generate initials for placeholder image
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TouchableOpacity
      style={[styles.gridContainer, isOutOfStock && styles.outOfStockContainer]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isOutOfStock}
    >
      {/* Image */}
      <View
        style={[
          styles.gridImageContainer,
          isOutOfStock && styles.outOfStockImage,
        ]}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Text style={styles.gridImagePlaceholderText}>
              {getInitials(name)}
            </Text>
          </View>
        )}

        {/* Stock badge */}
        <View
          style={[
            styles.gridStockBadge,
            isOutOfStock
              ? styles.outOfStockBadge
              : isLowStock
                ? styles.gridLowStockBadge
                : styles.gridInStockBadge,
          ]}
        >
          <Text style={styles.gridStockBadgeText}>
            {isOutOfStock ? "Out of stock" : `${stock} left`}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.gridDetails}>
        <Text style={styles.gridName} numberOfLines={2}>
          {name}
        </Text>
        {category && (
          <Text style={styles.gridCategory} numberOfLines={1}>
            {category}
          </Text>
        )}

        <View style={styles.gridFooter}>
          <Text style={styles.gridPrice}>₱{price.toFixed(2)}</Text>
        </View>
      </View>

      {/* Out of stock overlay */}
      {isOutOfStock && (
        <View style={styles.outOfStockOverlay}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    position: "relative",
  },
  outOfStockContainer: {
    opacity: 0.7,
  },
  outOfStockImage: {
    opacity: 0.5,
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    backgroundColor: "#F44336",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
    overflow: "hidden",
    transform: [{ rotate: "-15deg" }],
  },
  gridImageContainer: {
    width: "100%",
    height: CARD_WIDTH,
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ED277C20",
    justifyContent: "center",
    alignItems: "center",
  },
  gridImagePlaceholderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ED277C",
  },
  gridStockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gridInStockBadge: {
    backgroundColor: "#4CAF50",
  },
  gridLowStockBadge: {
    backgroundColor: "#FF9800",
  },
  outOfStockBadge: {
    backgroundColor: "#F44336",
  },
  gridStockBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  gridDetails: {
    padding: 12,
  },
  gridName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  gridCategory: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  gridFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ED277C",
  },
});
