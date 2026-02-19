import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ProductCard from "@/components/cart/ProductCard";

// 1. Defining the item shape for better TypeScript support
interface CartItem {
  id: number;
  name: string;
  price: number;
  stock?: number;
  quantity?: number;
  image?: string;
}

interface CartSectionProps {
  items: CartItem[]; // Changed from any[] to CartItem[]
}

const CartSection = ({ items }: CartSectionProps) => {
  return (
    <View
      style={styles.cartcontainer}
      className="border-b-2 border-gray-300 mx-4 gap-4"
    >
      <View style={styles.cartTitleSection}>
        <Text className="text-6xl font-bold">CART</Text>
      </View>

      {items.length > 0 ? (
        <ScrollView
          style={styles.productScroll}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Pass the individual 'item' into the ProductCard */}
          {items.map((item, index) => (
            <ProductCard
              key={item.id ? item.id.toString() : index.toString()}
              product={item}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyCartContainer}>
          <Ionicons name="cart-outline" size={100} color="#ccc" />
          <Text className="text-2xl text-gray-400 font-bold">
            Your cart is empty
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cartcontainer: { flex: 5, backgroundColor: "#fff", paddingBottom: 20 },
  cartTitleSection: {
    flex: 0.2,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 20,
  },
  productScroll: { flex: 1, width: "100%" },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CartSection;
