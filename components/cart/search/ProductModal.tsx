import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { iconSize } from "@/utils/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ProductModalProps {
  visible: boolean;
  onClose: () => void;
  product: {
    name: string;
    price: number;
    stock: number;
    barcode: string;
    image?: any;
  };
  onAdd: (quantity: number) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  visible,
  onClose,
  product,
  onAdd,
}) => {
  const [quantity, setQuantity] = useState(1);

  const increaseQty = () => {
    if (quantity < product.stock) setQuantity(quantity + 1);
  };

  const decreaseQty = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.sheet}>
            {/* Handle Bar */}
            <View style={styles.handle} />

            {/* Product Image */}
            <View style={styles.imageContainer}>
              <Image
                source={product.image || { uri: "https://picsum.photos/200" }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* Product Info */}
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.price}>₱ {product.price.toFixed(2)}</Text>
            <Text style={styles.stock}>Stocks : {product.stock} left</Text>

            <View style={styles.barcodeRow}>
              <Ionicons name="barcode-outline" size={24} color="#666" />
              <Text style={styles.barcodeText}>{product.barcode}</Text>
            </View>

            {/* Quantity Selector */}
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity style={styles.qtyBtn} onPress={decreaseQty}>
                <Ionicons name="remove" size={24} color="black" />
              </TouchableOpacity>

              <View style={styles.qtyValueContainer}>
                <Text style={styles.qtyText}>{quantity}</Text>
              </View>

              <TouchableOpacity style={styles.qtyBtn} onPress={increaseQty}>
                <Ionicons name="add" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {/* Add Button */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => onAdd(quantity)}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

export default ProductModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end", // Aligns to bottom like your image
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 100,
    height: 8,
    backgroundColor: "#C060B0", // Pinkish handle color from image
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 24,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: "90%",
    height: "90%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },
  price: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#E91E63", // Pink price color
    marginVertical: 4,
  },
  stock: {
    fontSize: 18,
    color: "#777",
  },
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  barcodeText: {
    fontSize: 16,
    color: "#777",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    height: 60,
    overflow: "hidden",
    marginBottom: 20,
  },
  qtyBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyValueContainer: {
    flex: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 20,
    fontWeight: "500",
  },
  addBtn: {
    backgroundColor: "#A10D94", // Dark purple/magenta color
    borderRadius: 20,
    height: 65,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
