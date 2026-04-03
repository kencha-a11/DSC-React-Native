import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProducts } from "@/context/ProductContext";
import DscToast from "@/components/common/DscToast";
import RestockProductModal from "./RestockProductModal";
import DeductProductModal from "./DeductProductModal";
import RemoveProductModal from "./RemoveProductModal";
import EditProductModal from "./EditProductModal";

interface Props {
  visible: boolean;
  product: any;
  onClose: () => void; // closes the modal entirely (e.g., when user taps X)
  onSuccess: () => void; // notifies parent that an action was performed (parent refreshes global lists)
}

export default function EditProductBarcodeModal({
  visible,
  product: initialProduct,
  onClose,
  onSuccess,
}: Props) {
  const { getProductByBarcode } = useProducts();

  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [restockVisible, setRestockVisible] = useState(false);
  const [deductVisible, setDeductVisible] = useState(false);
  const [removeVisible, setRemoveVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (visible && initialProduct) {
      setCurrentProduct(initialProduct);
    }
  }, [visible, initialProduct]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshProduct = async () => {
    if (!currentProduct?.barcode) return;
    setRefreshing(true);
    try {
      const updated = await getProductByBarcode(currentProduct.barcode);
      if (updated) {
        setCurrentProduct(updated);
      } else {
        // Product might have been deleted
        onClose();
      }
    } catch (error) {
      console.error("Failed to refresh product:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleActionSuccess = async (
    action: "restock" | "edit" | "deduct" | "delete",
  ) => {
    // Notify parent (scanner) to refresh its global lists
    onSuccess();

    if (action === "delete") {
      // Product no longer exists, close modal
      onClose();
    } else {
      // Refresh product data to show new stock / status
      await refreshProduct();
    }
  };

  if (!currentProduct) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            {refreshing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ED277C" />
              </View>
            )}
            <View style={styles.header}>
              <Text style={styles.title}>Product Actions</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.productInfo}>
              <View style={styles.imageContainer}>
                {currentProduct.image ? (
                  <Image
                    source={{ uri: currentProduct.image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#ccc" />
                  </View>
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{currentProduct.name}</Text>
                <Text style={styles.barcode}>{currentProduct.barcode}</Text>
                <Text style={styles.price}>₱{currentProduct.price}</Text>
                <Text style={styles.stock}>
                  Stock: {currentProduct.stock_quantity} pcs
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.restockButton]}
                onPress={() => setRestockVisible(true)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.actionText}>Restock</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => setEditVisible(true)}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deductButton]}
                onPress={() => setDeductVisible(true)}
              >
                <Ionicons name="remove-circle" size={20} color="#fff" />
                <Text style={styles.actionText}>Deduct</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => setRemoveVisible(true)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.actionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <RestockProductModal
        visible={restockVisible}
        onClose={() => setRestockVisible(false)}
        onSuccess={() => handleActionSuccess("restock")}
        product={currentProduct}
      />
      <EditProductModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSuccess={() => handleActionSuccess("edit")}
        product={currentProduct}
      />
      <DeductProductModal
        visible={deductVisible}
        onClose={() => setDeductVisible(false)}
        onSuccess={() => handleActionSuccess("deduct")}
        product={currentProduct}
      />
      <RemoveProductModal
        visible={removeVisible}
        onClose={() => setRemoveVisible(false)}
        onSuccess={() => handleActionSuccess("delete")}
        product={currentProduct}
        multiple={false}
      />

      <DscToast
        visible={!!toast}
        message={toast?.message ?? ""}
        type={toast?.type ?? "success"}
        onClose={() => setToast(null)}
        showCloseButton
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    position: "relative",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  productInfo: {
    flexDirection: "row",
    marginBottom: 20,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  barcode: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ED277C",
    marginBottom: 4,
  },
  stock: {
    fontSize: 12,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: "45%",
  },
  restockButton: {
    backgroundColor: "#4CAF50",
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  deductButton: {
    backgroundColor: "#FF9800",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
