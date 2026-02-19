import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  FlatList,
} from "react-native";
import { imageSize, iconSize } from "@/utils/responsive";
import { useRouter } from "expo-router";
import ProductModal from "@/components/cart/search/ProductModal";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useState } from "react";

// --- Interfaces ---

export interface Product {
  name: string;
  price: number;
  stock: number;
  barcode: string;
  image?: string;
}

interface ProductListProps {
  onSelectProduct: (product: Product) => void;
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

// --- Main Screen ---

const SearchProductScreen = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleAddToCart = (quantity: number) => {
    if (selectedProduct) {
      console.log(`Adding ${quantity} of ${selectedProduct.name} to cart`);
      // Logic for adding to global state/cart goes here
    }
    setSelectedProduct(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Header />
      <Filter />
      <ProductList onSelectProduct={(product) => setSelectedProduct(product)} />

      {/* Logic to show modal only when a product is selected */}
      {selectedProduct && (
        <ProductModal
          visible={!!selectedProduct}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddToCart}
        />
      )}
    </View>
  );
};

export default SearchProductScreen;

// --- Components ---

const Header = () => {
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.push("/(cashier)")}>
          <Image
            source={require("../../assets/icon/back.png")}
            style={{
              width: iconSize.medium,
              height: iconSize.medium,
              tintColor: "violet",
            }}
          />
        </TouchableOpacity>
        <Text className="text-3xl font-bold">ITEMS</Text>
        <TouchableOpacity onPress={() => router.push("/(cashier)/barcode-product-screen")}>
          <Ionicons
            name="barcode-sharp"
            size={iconSize.large}
            color="darkviolet"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const categories = ["ALL", "Souvenirs", "School Supplies", "Work Supplies"];

const Filter = () => (
  <View style={{ flex: 1, paddingHorizontal: 16, justifyContent: "center" }}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 52,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      }}
    >
      <Ionicons name="search-outline" size={iconSize.small} color="#9E9E9E" />
      <TextInput
        placeholder="Search"
        placeholderTextColor="#9E9E9E"
        style={{ marginLeft: 10, flex: 1, fontSize: 16, color: "#333" }}
      />
    </View>
    <View style={{ marginTop: 14 }}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: item === "ALL" ? "#A80091" : "#BDBDBD",
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 22,
              marginRight: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  </View>
);

const ProductList: React.FC<ProductListProps> = ({ onSelectProduct }) => {
  const dummyProduct: Product = {
    name: "Manila paper",
    price: 20.0,
    stock: 30,
    barcode: "321654",
  };

  return (
    <View style={{ flex: 5 }}>
      <ScrollView
        style={{ backgroundColor: "#fff" }}
        contentContainerStyle={{ padding: 8 }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {[...Array(6)].map((_, index) => (
            <ProductCard
              key={index}
              product={dummyProduct}
              onPress={() => onSelectProduct(dummyProduct)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  return (
    <View
      style={{
        width: "48%",
        marginBottom: 8,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "gray",
        flexDirection: "row",
        padding: 4,
      }}
    >
      <View style={{ flex: 1, flexDirection: "column", gap: 8 }}>
        <Image
          source={{ uri: "https://picsum.photos/200" }}
          style={{ width: imageSize.product, aspectRatio: 1, borderRadius: 6 }}
          resizeMode="contain"
        />
        <Text className="text-lg font-bold text-pink-500 text-left">
          ₱{product.price.toFixed(2)}
        </Text>
        <View style={{ flex: 1, flexDirection: "row", gap: 4 }}>
          <FontAwesome
            name="check-circle"
            size={iconSize.extraSmall}
            color="green"
          />
          <Text style={{ color: "green" }}>Stocks</Text>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Text className="text-lg font-bold text-gray-800 text-right">
          {product.name}
        </Text>
        <Text>{product.stock} left</Text>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="barcode-sharp"
            size={iconSize.extraSmall}
            color="darkviolet"
          />
          <Text>{product.barcode}</Text>
        </View>
        <TouchableOpacity
          onPress={onPress}
          style={{
            backgroundColor: "#800080",
            borderRadius: 12,
            alignItems: "center",
            paddingVertical: 8,
            width: "100%",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
            Add to cart
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
