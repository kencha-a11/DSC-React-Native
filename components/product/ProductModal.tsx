import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import DscToast from "@/components/common/DscToast";

const { width, height } = Dimensions.get("window");

interface ProductModalProps {
  visible: boolean;
  onClose: () => void;
  onAddToCart?: (quantity: number) => void;
  product?: {
    id: number;
    name: string;
    price: number;
    stock: number;
    image?: string | null;
    category?: string;
    description?: string;
    currentCartQuantity?: number;
  };
  initialQuantity?: number;
  isEditMode?: boolean;
}

export default function ProductModal({
  visible,
  onClose,
  onAddToCart,
  product = {
    id: 1,
    name: "A5 Notebook",
    price: 24.0,
    stock: 34,
    category: "Stationery",
  },
  initialQuantity = 1,
  isEditMode = false,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [inputValue, setInputValue] = useState(initialQuantity.toString());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "warning" | "info"
  >("error");

  const maxSelectable = product.stock;

  useEffect(() => {
    if (visible) {
      setQuantity(initialQuantity);
      setInputValue(initialQuantity.toString());
    }
  }, [visible, product?.id, initialQuantity, isEditMode]);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "error",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const incrementQuantity = () => {
    if (quantity < maxSelectable) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      setInputValue(newQuantity.toString());
    } else {
      showToast(`Maximum ${maxSelectable} items available`, "warning");
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      setInputValue(newQuantity.toString());
    }
  };

  const handleQuantityInput = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setInputValue(numericText);

    if (numericText === "") {
      setQuantity(0);
      return;
    }

    const num = parseInt(numericText, 10);
    if (!isNaN(num)) {
      if (num > maxSelectable) {
        setQuantity(maxSelectable);
        setInputValue(maxSelectable.toString());
        showToast(`Maximum ${maxSelectable} items available`, "warning");
      } else if (num < 1) {
        setQuantity(1);
        setInputValue("1");
      } else {
        setQuantity(num);
      }
    }
  };

  const handleQuantityBlur = () => {
    if (quantity < 1) {
      setQuantity(1);
      setInputValue("1");
    } else if (quantity > maxSelectable) {
      setQuantity(maxSelectable);
      setInputValue(maxSelectable.toString());
    }
  };

  const handleAddToCart = () => {
    if (product.stock === 0) {
      showToast("This product is out of stock", "error");
      return;
    }

    if (quantity === 0) {
      showToast("Please select a quantity", "warning");
      return;
    }

    if (quantity > maxSelectable) {
      showToast(`Only ${maxSelectable} items available`, "error");
      return;
    }

    // If editing and quantity unchanged, just close
    if (isEditMode && quantity === initialQuantity) {
      handleClose();
      return;
    }

    onAddToCart?.(quantity);
    handleClose();
  };

  const handleClose = () => {
    setQuantity(initialQuantity);
    setInputValue(initialQuantity.toString());
    onClose();
  };

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 10;
  const hasChanges = isEditMode && quantity !== initialQuantity;
  const isAddButtonDisabled =
    isOutOfStock || quantity === 0 || (isEditMode && !hasChanges);

  // Out of stock view (centered, fade)
  if (isOutOfStock) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={styles.modalContentCentered}>
            <View style={styles.outOfStockContainer}>
              <View style={styles.outOfStockIcon}>
                <Ionicons name="alert-circle" size={48} color="#F44336" />
              </View>
              <Text style={styles.outOfStockTitle}>Out of Stock</Text>
              <Text style={styles.outOfStockSubText}>
                This product is currently unavailable.
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={handleClose}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  // In stock view (bottom sheet, slide up)
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View style={styles.modalContentBottom}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.contentRow}>
              <View style={styles.leftColumn}>
                <View style={styles.imageContainer}>
                  {product.image ? (
                    <Image
                      source={{ uri: product.image }}
                      style={styles.image}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>
                        {product.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.rightColumn}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.metaContainer}>
                  {product.category && (
                    <Text style={styles.category}>{product.category}</Text>
                  )}
                  <View
                    style={[
                      styles.stockBadge,
                      isLowStock ? styles.lowStockBadge : styles.inStockBadge,
                    ]}
                  >
                    <Text style={styles.stockText}>
                      {product.stock} {isLowStock ? "left" : "available"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.price}>₱{product.price.toFixed(2)}</Text>

                <View style={styles.quantityContainer}>
                  <Text style={styles.sectionTitle}>Quantity</Text>

                  {product.currentCartQuantity ? (
                    <View style={styles.cartContextCard}>
                      <Ionicons name="cart-outline" size={16} color="#ED277C" />
                      <Text style={styles.cartContextText}>
                        You have {product.currentCartQuantity} in cart
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.quantitySelector}>
                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        quantity <= 1 && styles.quantityButtonDisabled,
                      ]}
                      onPress={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={quantity <= 1 ? "#ccc" : "#333"}
                      />
                    </TouchableOpacity>

                    <TextInput
                      style={styles.quantityInput}
                      value={inputValue}
                      onChangeText={handleQuantityInput}
                      onBlur={handleQuantityBlur}
                      keyboardType="numeric"
                      maxLength={5}
                      selectTextOnFocus={true}
                    />

                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        quantity >= maxSelectable &&
                          styles.quantityButtonDisabled,
                      ]}
                      onPress={incrementQuantity}
                      disabled={quantity >= maxSelectable}
                    >
                      <Ionicons
                        name="add"
                        size={20}
                        color={quantity >= maxSelectable ? "#ccc" : "#333"}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.stockInfoContainer}>
                    <Text style={styles.stockInfo}>
                      Available: {maxSelectable} pcs
                    </Text>
                    {isEditMode && (
                      <Text style={styles.editModeHint}>
                        Adjust quantity to update cart
                      </Text>
                    )}
                  </View>

                  {isLowStock && (
                    <View style={styles.lowStockWarning}>
                      <Ionicons name="alert-circle" size={14} color="#FF9800" />
                      <Text style={styles.lowStockWarningText}>
                        Only {product.stock} left in stock
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.spacer} />
          </ScrollView>

          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={[
                styles.addButton,
                isAddButtonDisabled && styles.addButtonDisabled,
              ]}
              onPress={handleAddToCart}
              disabled={isAddButtonDisabled}
            >
              <Text style={styles.addButtonText}>
                {quantity === 0
                  ? "Select Quantity"
                  : isEditMode
                    ? hasChanges
                      ? `Update Cart (${quantity})`
                      : "No changes"
                    : `Add to Cart (${quantity})`}
              </Text>
            </TouchableOpacity>
          </View>

          <DscToast
            visible={toastVisible}
            message={toastMessage}
            type={toastType}
            onClose={() => setToastVisible(false)}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentCentered: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: width * 0.85,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContentBottom: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: width,
    height: height * 0.7,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  contentRow: {
    flexDirection: "row",
    paddingTop: 20,
  },
  leftColumn: {
    width: "40%",
    paddingRight: 16,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#ED277C20",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ED277C",
  },
  rightColumn: {
    width: "60%",
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  category: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inStockBadge: {
    backgroundColor: "#4CAF5020",
  },
  lowStockBadge: {
    backgroundColor: "#FF980020",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ED277C",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  quantityContainer: {
    marginBottom: 10,
  },
  cartContextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ED277C10",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  cartContextText: {
    fontSize: 13,
    color: "#ED277C",
    fontWeight: "500",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius:8,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    borderColor: "#eee",
    backgroundColor: "#f5f5f5",
  },
  quantityInput: {
    width: 60,
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    backgroundColor: "#fff",
  },
  stockInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockInfo: {
    fontSize: 11,
    color: "#999",
  },
  editModeHint: {
    fontSize: 11,
    color: "#ED277C",
    fontWeight: "500",
  },
  lowStockWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  lowStockWarningText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "500",
  },
  spacer: {
    height: 80,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  addButton: {
    backgroundColor: "#ED277C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  outOfStockContainer: {
    alignItems: "center",
  },
  outOfStockIcon: {
    marginBottom: 12,
  },
  outOfStockTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  outOfStockSubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButton: {
    backgroundColor: "#ED277C",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
