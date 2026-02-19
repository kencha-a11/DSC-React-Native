import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";

// Update the interface to match what comes from the API
interface ProductItem {
  id: number;
  name: string;
  price: string | number; // Allow both string and number
  stock_quantity?: number;
  stock?: number;
}

// Cart item type from context (includes quantity)
interface CartItemType {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const SaleTestData: React.FC = () => {
  const { products } = useProducts();
  const {
    cartItems,
    addItem,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    confirmPurchase,
    total,
    loading,
    itemCount,
  } = useCart();

  const handleConfirmSale = async () => {
    if (loading) return;
    await confirmPurchase();
  };

  const getStock = (item: ProductItem) =>
    item.stock_quantity ?? item.stock ?? 0;

  // Helper function to safely convert price to number
  const getPriceAsNumber = (price: string | number): number => {
    if (typeof price === "string") {
      return parseFloat(price) || 0;
    }
    return price;
  };

  const renderProduct = ({ item }: { item: ProductItem }) => {
    const stock = getStock(item);
    const outOfStock = stock <= 0;
    const price = getPriceAsNumber(item.price);

    return (
      <View className="bg-white p-4 mb-2 rounded-xl border border-gray-200 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-black font-bold text-lg">{item.name}</Text>
            <Text className="text-pink-600 font-semibold">
              ₱{price.toFixed(2)}
            </Text>
            <Text className="text-gray-500 text-xs">Stock: {stock} left</Text>
          </View>

          <TouchableOpacity
            disabled={outOfStock}
            className={`px-4 py-2 rounded-lg ${
              outOfStock ? "bg-gray-400" : "bg-purple-600"
            }`}
            onPress={() =>
              addItem(
                {
                  id: item.id,
                  name: item.name,
                  price: price,
                },
                1,
              )
            }
          >
            <Text className="text-white font-bold">
              {outOfStock ? "Out" : "Add"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCartItem = ({ item }: { item: CartItemType }) => (
    <View className="flex-row justify-between items-center p-3 border-b border-gray-100 bg-white">
      <View className="flex-1">
        <Text className="text-black font-medium">{item.name}</Text>
        <Text className="text-gray-500 text-sm">
          ₱{(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>

      <View className="flex-row items-center gap-x-4">
        <TouchableOpacity
          onPress={() => decrementQuantity(item.id)}
          className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
        >
          <Text className="text-xl font-bold">-</Text>
        </TouchableOpacity>

        <Text className="font-bold text-lg">{item.quantity}</Text>

        <TouchableOpacity
          onPress={() => incrementQuantity(item.id)}
          className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
        >
          <Text className="text-xl font-bold">+</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => removeItem(item.id)} className="ml-2">
          <Text className="text-red-500 text-xs">Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="flex-row justify-between items-end mb-2">
        <Text className="text-2xl font-black text-gray-800">
          🛒 Cart ({itemCount})
        </Text>
        <Text className="text-xl font-bold text-pink-600">
          Total: ₱{total.toFixed(2)}
        </Text>
      </View>

      <View className="h-64 bg-white rounded-2xl overflow-hidden border border-gray-200 mb-6">
        <FlatList
          data={cartItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCartItem}
          ListEmptyComponent={
            <View className="p-10 items-center">
              <Text className="text-gray-400">Empty cart</Text>
            </View>
          }
        />
      </View>

      {cartItems.length > 0 && (
        <TouchableOpacity
          disabled={loading}
          onPress={handleConfirmSale}
          className={`h-14 rounded-2xl items-center justify-center mb-6 shadow-lg ${
            loading ? "bg-gray-400" : "bg-purple-700"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-black text-lg">
              CONFIRM PURCHASE
            </Text>
          )}
        </TouchableOpacity>
      )}

      <Text className="text-2xl font-black text-gray-800 mb-4">
        📦 Inventory
      </Text>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <ActivityIndicator size="large" color="#A10D94" className="mt-10" />
        }
      />
    </View>
  );
};

export default SaleTestData;
