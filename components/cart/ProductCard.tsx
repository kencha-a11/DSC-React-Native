import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { imageSize } from "@/utils/responsive";

// 1. Define the Product structure based on your Context
interface Product {
  id: number;
  name: string;
  price: number;
  stock?: number; // Added optional fields for the UI
  quantity?: number;
  image?: string;
}

// 2. Define the Props interface
interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <TouchableOpacity style={styles.card}>
      {/* Left section: image + product info */}
      <View style={styles.leftSection}>
        <Image
          // Use product image if available, else fallback to picsum
          source={{
            uri:
              product.image || `https://picsum.photos/seed/${product.id}/200`,
          }}
          style={styles.image}
          resizeMode="contain"
        />
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>
            ₱{" "}
            {product.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {/* Right section: stock + quantity */}
      <View style={styles.rightSection}>
        <Text style={styles.stock}>Stock: {product.stock ?? 0}</Text>
        <Text style={styles.quantity}>Qty: {product.quantity ?? 1}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee", // Lightened for a cleaner look
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    backgroundColor: "#fff",
    // Adding shadow for better UI
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  image: {
    width: imageSize.product,
    aspectRatio: 1,
    marginRight: 12,
    borderRadius: 4,
  },
  info: {
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  price: {
    fontSize: 14,
    color: "green",
    marginTop: 4,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  stock: {
    fontSize: 12,
    color: "#888",
  },
  quantity: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
  },
});
