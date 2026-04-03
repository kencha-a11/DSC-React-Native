import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProducts } from "@/context/ProductContext";
import { usePermissions } from "@/context/PermissionContext";
import DscToast from "@/components/common/DscToast";

interface RestockProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: any | null;
}

interface FormState {
  quantity: string;
}

export default function RestockProductModal({
  visible,
  onClose,
  onSuccess,
  product,
}: RestockProductModalProps) {
  const { restockProduct, loading } = useProducts();
  const { hasPermission } = usePermissions();

  // Permissions
  const canRestock = hasPermission("restock_items");

  // Form state
  const [form, setForm] = useState<FormState>({ quantity: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setForm({ quantity: "" });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [visible]);

  // Auto‑close if permission denied
  useEffect(() => {
    if (visible && !canRestock) {
      showToast("You don't have permission to restock products", "error");
      setTimeout(onClose, 2000);
    }
  }, [visible, canRestock]);

  // Toast helper
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.quantity.trim()) {
      newErrors.quantity = "Quantity is required";
    } else {
      const quantityNum = parseInt(form.quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        newErrors.quantity = "Quantity must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!canRestock) {
      showToast("You don't have permission to restock products", "error");
      return;
    }
    if (!validate()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }
    if (!product?.id) {
      showToast("Product not found", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const quantityNum = parseInt(form.quantity);
      await restockProduct(product.id, quantityNum);
      showToast(`Successfully added ${quantityNum} units to ${product.name}`, "success");
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      setIsSubmitting(false);
      showToast(error.message || "Failed to restock product", "error");
    }
  };

  // New stock preview
  const newStock = product && form.quantity && !isNaN(parseInt(form.quantity))
    ? product.stock_quantity + parseInt(form.quantity)
    : null;

  // Permission guard
  if (!canRestock && visible) {
    return null; // Will be auto‑closed by useEffect
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {isSubmitting && (
            <View style={styles.submittingOverlay}>
              <ActivityIndicator size="large" color="#ED277C" />
            </View>
          )}

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Restock Product</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={isSubmitting}
              activeOpacity={1}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Product Info */}
            {product && (
              <View style={styles.productInfoCard}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.stockInfo}>
                  <Text style={styles.currentStockLabel}>Current Stock:</Text>
                  <Text style={styles.currentStockValue}>
                    {product.stock_quantity} pcs
                  </Text>
                </View>
                {product.low_stock_threshold && (
                  <Text style={styles.thresholdText}>
                    Low stock threshold: {product.low_stock_threshold} pcs
                  </Text>
                )}
              </View>
            )}

            {/* Restock Form */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Add Stock</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Quantity to Add <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.quantity && styles.inputError]}
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChangeText={(text) => {
                    setForm({ quantity: text });
                    if (errors.quantity) {
                      const { quantity, ...rest } = errors;
                      setErrors(rest);
                    }
                  }}
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
                {errors.quantity && (
                  <Text style={styles.errorText}>{errors.quantity}</Text>
                )}
              </View>

              {/* Preview new stock */}
              {newStock !== null && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>New Stock Will Be:</Text>
                  <Text style={styles.previewValue}>{newStock} pcs</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={1}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (isSubmitting || loading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || loading}
              activeOpacity={1}
            >
              {isSubmitting || loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Restock</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <DscToast
        visible={!!toast}
        message={toast?.message || ""}
        type={toast?.type || "success"}
        onClose={() => setToast(null)}
        showCloseButton
      />
    </Modal>
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
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  submittingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  productInfoCard: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  stockInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  currentStockLabel: {
    fontSize: 14,
    color: "#666",
  },
  currentStockValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  thresholdText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  formSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  required: {
    color: "#F44336",
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#F44336",
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 2,
  },
  previewContainer: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  submitButton: {
    backgroundColor: "#ED277C",
    borderColor: "#ED277C",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});