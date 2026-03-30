import React, { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useProducts } from "@/context/ProductContext"; // Import the hook

interface ProductTestDataBarcodeProps {
  height?: number;
  onScanned?: (barcode: string) => void;
  onProductFound?: (product: any) => void; // Add callback for when product is found
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Define scan zone rectangle (centered box)
const scanZone = {
  x: screenWidth * 0.15,
  y: screenHeight * 0.25,
  width: screenWidth * 0.7,
  height: screenHeight * 0.5,
};

// Utility: check if barcode bounds overlap with scanZone
const isInsideRect = (bounds: any, zone: typeof scanZone) => {
  if (!bounds?.origin || !bounds?.size) return false;
  const barcodeBox = {
    x: bounds.origin.x,
    y: bounds.origin.y,
    width: bounds.size.width,
    height: bounds.size.height,
  };

  return (
    barcodeBox.x < zone.x + zone.width &&
    barcodeBox.x + barcodeBox.width > zone.x &&
    barcodeBox.y < zone.y + zone.height &&
    barcodeBox.y + barcodeBox.height > zone.y
  );
};

export default function ProductTestDataBarcode({
  height,
  onScanned,
  onProductFound, // Add new prop
}: ProductTestDataBarcodeProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [enabled, setEnabled] = useState(true);
  const { getProductByBarcode, loading } = useProducts(); // Use the hook

  if (!permission)
    return <View style={{ flex: 1, backgroundColor: "black" }} />;

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: "#111",
        }}
      >
        <Text style={{ fontSize: 32, marginBottom: 16 }}>📷</Text>
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 18,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Camera Access
        </Text>
        <Text style={{ color: "#aaa", textAlign: "center", marginBottom: 24 }}>
          We need permission to scan barcodes and process your items.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "white",
            paddingHorizontal: 40,
            paddingVertical: 16,
            borderRadius: 16,
          }}
          onPress={requestPermission}
        >
          <Text
            style={{ color: "black", fontWeight: "bold", textAlign: "center" }}
          >
            Enable Camera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data, bounds }: any) => {
    if (!enabled || loading) return; // Disable while loading

    if (isInsideRect(bounds, scanZone)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log("✅ Scanned inside rectangle:", data);
      setEnabled(false);

      // Call the original onScanned callback if provided
      if (onScanned) {
        onScanned(data);
      }

      try {
        // Look up product by barcode using the context function
        const product = await getProductByBarcode(data);

        if (product) {
          console.log("✅ Product found:", product.name);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Call onProductFound callback if provided
          if (onProductFound) {
            onProductFound(product);
          } else {
            // Default behavior: show alert with product info
            Alert.alert(
              "Product Found",
              `Name: ${product.name}\nPrice: ₱${product.price}\nStock: ${product.stock_quantity}`,
              [{ text: "OK" }],
            );
          }
        } else {
          console.log("❌ No product found for barcode:", data);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          Alert.alert(
            "Product Not Found",
            `No product found with barcode: ${data}`,
            [{ text: "OK" }],
          );
        }
      } catch (error) {
        console.error("❌ Error looking up product:", error);
        Alert.alert("Error", "Failed to look up product. Please try again.");
      } finally {
        // Re-enable scanning after a delay
        setTimeout(() => setEnabled(true), 2000);
      }
    } else {
      console.log("Ignored scan outside rectangle");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isFocused && (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "code128", "ean13", "ean8", "upc_a", "upc_e"],
          }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}

      {/* Overlay */}
      <View
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
      >
        {/* Status Text */}
        <View
          style={{
            position: "absolute",
            top: 32,
            alignSelf: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 12,
              fontWeight: "bold",
              letterSpacing: 1,
            }}
          >
            {loading ? "Looking up..." : enabled ? "Scan" : "Processing..."}
          </Text>
        </View>

        {/* Center Rectangle */}
        <View
          style={{
            position: "absolute",
            top: scanZone.y,
            left: scanZone.x,
            width: scanZone.width,
            height: scanZone.height,
            borderWidth: 2,
            borderColor: loading
              ? "rgba(255,255,0,0.7)"
              : "rgba(255,255,255,0.7)", // Yellow when loading
            backgroundColor: "transparent",
          }}
        />

        {/* Loading indicator or additional info */}
        {loading && (
          <View
            style={{
              position: "absolute",
              bottom: 50,
              alignSelf: "center",
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 25,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Looking up product...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
