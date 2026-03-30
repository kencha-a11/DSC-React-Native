import DscToast from "@/components/common/DscToast";
import Header from "@/components/layout/Header";
import ProductModal from "@/components/modal/ProductModal";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const scanZone = {
  x: screenWidth * 0.1,
  y: screenHeight * 0.3,
  width: screenWidth * 0.8,
  height: screenHeight * 0.2,
};

const SCAN_INTERVAL = 2000;

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

export default function SaleBarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [enabled, setEnabled] = useState(true);
  const { getProductByBarcode, loading } = useProducts();
  const { cartItems, addItem } = useCart();
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "warning" | "info"
  >("success");

  const [modalVisible, setModalVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "success",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleBackPress = () => {
    router.back();
  };

  const canScan = (barcode: string): boolean => {
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTimeRef.current;
    if (
      barcode === lastScannedCodeRef.current &&
      timeSinceLastScan < SCAN_INTERVAL
    ) {
      return false;
    }
    return true;
  };

  const handleBarcodeLookup = async (barcode: string) => {
    if (!barcode || loading) return;

    setEnabled(false);
    setLastScanned(barcode);
    lastScannedCodeRef.current = barcode;
    lastScanTimeRef.current = Date.now();

    try {
      const product = await getProductByBarcode(barcode);

      if (product) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const currentCartItem = cartItems.find(
          (item) => item.id === product.id,
        );
        const currentQuantity = currentCartItem?.quantity || 0;

        setScannedProduct({
          ...product,
          currentCartQuantity: currentQuantity,
          availableStock: product.stock_quantity - currentQuantity,
        });
        setModalVisible(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(`No product found with barcode: ${barcode}`, "error");
        setEnabled(true);
      }
    } catch (error) {
      console.error("❌ Error looking up product:", error);
      showToast("Failed to look up product", "error");
      setEnabled(true);
    }
  };

  const handleBarCodeScanned = async ({ data, bounds }: any) => {
    if (!enabled || loading || modalVisible) return;
    if (!canScan(data)) return;

    if (isInsideRect(bounds, scanZone)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await handleBarcodeLookup(data);
    }
  };

  const handleAddToCart = (quantity: number) => {
    if (scannedProduct) {
      addItem(
        {
          id: scannedProduct.id,
          name: scannedProduct.name,
          price:
            typeof scannedProduct.price === "string"
              ? parseFloat(scannedProduct.price)
              : scannedProduct.price,
        },
        quantity,
      );

      showToast(
        `Added ${quantity} x ${scannedProduct.name} to cart`,
        "success",
      );

      setModalVisible(false);
      setScannedProduct(null);
      setEnabled(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setScannedProduct(null);
    setEnabled(true);
  };

  const handleGoToCart = () => {
    router.push("/(cashier)/cart");
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const CartIcon = (
    <TouchableOpacity onPress={handleGoToCart} style={styles.cartButton}>
      <Ionicons name="cart-outline" size={24} color="#fff" />
      {cartItemCount > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!permission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header
          title="Scan Barcode"
          onBackPress={handleBackPress}
          backgroundColor="#000"
          titleColor="#fff"
          rightComponent={CartIcon}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.textLight}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header
          title="Scan Barcode"
          onBackPress={handleBackPress}
          backgroundColor="#000"
          titleColor="#fff"
          rightComponent={CartIcon}
        />
        <View style={styles.centerContainer}>
          <View style={styles.permissionCard}>
            <Ionicons name="alert-circle-outline" size={48} color="#ED277C" />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionDescription}>
              We need camera access to scan barcodes.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Enable Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Header
        title="Scan Barcode"
        onBackPress={handleBackPress}
        backgroundColor="#000"
        titleColor="#fff"
        rightComponent={CartIcon}
      />

      <DscToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
        showCloseButton={true}
      />

      {isFocused && (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "code128", "ean13", "ean8", "upc_a", "upc_e"],
          }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}

      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.darkOverlay, { height: scanZone.y }]}>
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Ionicons
                name={loading ? "sync" : "scan-outline"}
                size={16}
                color="#fff"
              />
              <Text style={styles.statusText}>
                {loading ? "Looking up..." : "Ready to scan"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.middleRow}>
          <View style={[styles.darkOverlay, { width: scanZone.x }]} />
          <View
            style={[
              styles.scanZone,
              { width: scanZone.width, height: scanZone.height },
            ]}
          >
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View
            style={[
              styles.darkOverlay,
              { width: screenWidth - scanZone.x - scanZone.width },
            ]}
          />
        </View>

        <View style={[styles.darkOverlay, { flex: 1 }]}>
          <View style={styles.bottomContent}>
            {lastScanned && (
              <View style={styles.lastScanned}>
                <Text style={styles.lastScannedText}>Last: {lastScanned}</Text>
              </View>
            )}
            <Text style={styles.instruction}>
              Position barcode in the frame
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer} pointerEvents="box-none">
        <View style={styles.buttonRow}>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleGoToCart}
          >
            <Ionicons name="cart-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Cart ({cartItemCount})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {scannedProduct && (
        <ProductModal
          visible={modalVisible}
          onClose={handleModalClose}
          onAddToCart={handleAddToCart}
          product={{
            id: scannedProduct.id,
            name: scannedProduct.name,
            price:
              typeof scannedProduct.price === "string"
                ? parseFloat(scannedProduct.price)
                : scannedProduct.price,
            stock: scannedProduct.availableStock,
            category:
              scannedProduct.category_name ||
              scannedProduct.categories?.[0]?.name,
            image: scannedProduct.image,
            description: scannedProduct.description,
            currentCartQuantity: scannedProduct.currentCartQuantity,
          }}
          initialQuantity={1}
          isEditMode={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  darkOverlay: {
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  middleRow: {
    flexDirection: "row",
    height: scanZone.height,
  },
  scanZone: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#ED277C",
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  bottomContent: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 110,
  },
  lastScanned: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  lastScannedText: {
    color: "#ED277C",
    fontSize: 12,
    fontWeight: "500",
  },
  instruction: {
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "60%",
    maxWidth: 400,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#ED277C",
  },
  primaryButton: {
    backgroundColor: "#ED277C",
    borderWidth: 0,
  },
  actionButtonText: {
    color: "#ED277C",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cartButton: {
    position: "relative",
    padding: 4,
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#ED277C",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 20,
  },
  textLight: {
    color: "#fff",
    fontSize: 16,
  },
  permissionCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    gap: 16,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  permissionDescription: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: "#ED277C",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
