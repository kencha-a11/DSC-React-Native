import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useProducts } from "@/context/ProductContext";
import ProductTestDataBarcode from "./ProductTestDataBarcode";

const ProductTestData: React.FC = () => {
  const {
    products,
    loading,
    error,
    fetchProducts,
    loadMore,
    editProduct,
    removeProduct,
    restockProduct,
    deductProduct,
    getProductByBarcode,
  } = useProducts();

  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- Barcode scan handler ---
  const handleBarcodeScanned = async (barcode: string) => {
    setBarcodeLoading(true);
    const product = await getProductByBarcode(barcode);
    setScannedProduct(product); // <-- replace scanned product on new scan
    setBarcodeLoading(false);
  };

  // --- Operation helpers for scanned product ---
  const handleEditScanned = () => {
    if (!scannedProduct) return;
    editProduct(scannedProduct.id, {
      ...scannedProduct,
      name: `${scannedProduct.name} (Edited)`,
    });
    // Update local state
    setScannedProduct({
      ...scannedProduct,
      name: `${scannedProduct.name} (Edited)`,
    });
  };

  const handleDeleteScanned = () => {
    if (!scannedProduct) return;
    removeProduct(scannedProduct.id);
    setScannedProduct(null);
  };

  const handleRestockScanned = (qty: number) => {
    if (!scannedProduct) return;
    restockProduct(scannedProduct.id, qty);
    setScannedProduct({
      ...scannedProduct,
      stock_quantity: scannedProduct.stock_quantity + qty,
    });
  };

  const handleDeductScanned = (qty: number) => {
    if (!scannedProduct) return;
    deductProduct(scannedProduct.id, qty);
    setScannedProduct({
      ...scannedProduct,
      stock_quantity: scannedProduct.stock_quantity - qty,
    });
  };

  // --- Render product list items ---
  const renderItem = ({ item }: any) => (
    <View className="bg-white p-4 mb-2 rounded border border-gray-300">
      <Text className="text-lg font-bold text-black">{item.name}</Text>
      <Text className="text-sm text-gray-700">ID: {item.id}</Text>
      <Text className="text-sm text-gray-700">
        Barcode: {item.barcode ?? "N/A"}
      </Text>
      <Text className="text-sm text-gray-700">Price: ₱{item.price}</Text>
      <Text className="text-sm text-gray-700">
        Stock: {item.stock_quantity}
      </Text>
      <Text
        className={`text-sm font-semibold ${
          item.status === "low stock" ? "text-orange-500" : "text-green-600"
        }`}
      >
        Status: {item.status}
      </Text>

      <View className="mt-2">
        <Text className="font-semibold text-gray-600">Categories:</Text>
        {(item.categories ?? []).length === 0 ? (
          <Text className="text-gray-500">None</Text>
        ) : (
          item.categories.map((cat: any) => (
            <Text key={cat.id} className="text-gray-500 ml-2">
              • {cat.name}
            </Text>
          ))
        )}
      </View>

      <View className="flex-row justify-between mt-2">
        <TouchableOpacity
          className="bg-blue-500 px-3 py-1 rounded"
          onPress={() =>
            editProduct(item.id, { ...item, name: `${item.name} (Edited)` })
          }
        >
          <Text className="text-white text-xs font-bold">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-red-500 px-3 py-1 rounded"
          onPress={() => removeProduct(item.id)}
        >
          <Text className="text-white text-xs font-bold">Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-green-500 px-3 py-1 rounded"
          onPress={() => restockProduct(item.id, 5)}
        >
          <Text className="text-white text-xs font-bold">+5</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-yellow-500 px-3 py-1 rounded"
          onPress={() => deductProduct(item.id, 2)}
        >
          <Text className="text-white text-xs font-bold">-2</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="bg-gray-100">
      {/* --- Barcode Scanner --- */}
      <ProductTestDataBarcode height={250} onScanned={handleBarcodeScanned} />

      {/* --- Scanned Product --- */}
      {barcodeLoading && (
        <ActivityIndicator size="small" color="#10b981" className="mt-2" />
      )}

      {scannedProduct && (
        <View className="bg-white p-4 m-2 rounded border border-green-400">
          <Text className="text-green-600 font-bold">
            ✅ {scannedProduct.name} (ID: {scannedProduct.id})
          </Text>
          <Text className="text-gray-700 text-sm">
            Barcode: {scannedProduct.barcode ?? "N/A"}
          </Text>
          <Text className="text-gray-700 text-sm">
            Price: ₱{scannedProduct.price}
          </Text>
          <Text className="text-gray-700 text-sm">
            Stock: {scannedProduct.stock_quantity}
          </Text>

          <View className="flex-row justify-between mt-2">
            <TouchableOpacity
              className="bg-blue-500 px-3 py-1 rounded"
              onPress={handleEditScanned}
            >
              <Text className="text-white text-xs font-bold">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-500 px-3 py-1 rounded"
              onPress={handleDeleteScanned}
            >
              <Text className="text-white text-xs font-bold">Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-green-500 px-3 py-1 rounded"
              onPress={() => handleRestockScanned(5)}
            >
              <Text className="text-white text-xs font-bold">+5</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-yellow-500 px-3 py-1 rounded"
              onPress={() => handleDeductScanned(2)}
            >
              <Text className="text-white text-xs font-bold">-2</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- Product List --- */}
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Text className="text-center mt-4 text-gray-500">
            No products found
          </Text>
        }
      />
    </View>
  );
};

export default ProductTestData;
