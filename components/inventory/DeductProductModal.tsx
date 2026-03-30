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

interface DeductProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: any | null;
}

interface FormState {
  quantity: string;
  reason: string;
}

export default function DeductProductModal({
  visible,
  onClose,
  onSuccess,
  product,
}: DeductProductModalProps) {
  const { deductProduct, loading } = useProducts();
  const { hasPermission } = usePermissions();

  const canDeduct = hasPermission("deduct_items");

  // Form state
  const [form, setForm] = useState<FormState>({
    quantity: "",
    reason: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset modal state when it opens
  useEffect(() => {
    if (visible) {
      setIsSubmitting(false);
      setErrors({});
      setToast(null);
      setForm({ quantity: "", reason: "" });
    }
  }, [visible]);

  // Auto‑close if permission denied
  useEffect(() => {
    if (visible && !canDeduct) {
      showToast("You don't have permission to deduct products", "error");
      setTimeout(onClose, 2000);
    }
  }, [visible, canDeduct]);

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
      } else if (product && quantityNum > product.stock_quantity) {
        newErrors.quantity = `Insufficient stock. Available: ${product.stock_quantity}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!canDeduct) {
      showToast("You don't have permission to deduct products", "error");
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
      const reason = form.reason.trim() || undefined;
      await deductProduct(product.id, quantityNum, reason);
      showToast(`Successfully deducted ${quantityNum} units from ${product.name}`, "success");
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      setIsSubmitting(false);
      showToast(error.message || "Failed to deduct product", "error");
    }
  };

  // Calculate remaining stock preview
  const remainingStock = form.quantity && !isNaN(parseInt(form.quantity)) && product
    ? Math.max(0, product.stock_quantity - parseInt(form.quantity))
    : null;

  const isOverDeduct = remainingStock !== null && remainingStock === 0 && parseInt(form.quantity) > product?.stock_quantity;

  // Permission guard
  if (!canDeduct && visible) {
    return null; // auto‑closed by useEffect
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
            <Text style={styles.headerTitle}>Deduct Stock</Text>
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
                  <Text
                    style={[
                      styles.currentStockValue,
                      product.stock_quantity <= product.low_stock_threshold &&
                      product.stock_quantity > 0 &&
                      styles.lowStock,
                      product.stock_quantity === 0 && styles.outOfStock,
                    ]}
                  >
                    {product.stock_quantity} pcs
                  </Text>
                </View>
                {product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0 && (
                  <Text style={styles.warningText}>⚠️ Low stock warning</Text>
                )}
                {product.stock_quantity === 0 && (
                  <Text style={styles.warningText}>⚠️ Out of stock</Text>
                )}
              </View>
            )}

            {/* Deduct Form */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Deduct Stock</Text>

              {/* Quantity Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Quantity to Deduct <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.quantity && styles.inputError]}
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChangeText={(text) => {
                    setForm({ ...form, quantity: text });
                    if (errors.quantity) delete errors.quantity;
                  }}
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
                {errors.quantity && (
                  <Text style={styles.errorText}>{errors.quantity}</Text>
                )}
              </View>

              {/* Reason Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Reason (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter reason for deduction"
                  value={form.reason}
                  onChangeText={(text) => setForm({ ...form, reason: text })}
                  multiline
                  numberOfLines={3}
                  editable={!isSubmitting}
                />
                <Text style={styles.hintText}>
                  e.g., Damaged, Expired, Lost, etc.
                </Text>
              </View>

              {/* New Stock Preview */}
              {remainingStock !== null && (
                <View
                  style={[
                    styles.previewContainer,
                    isOverDeduct && styles.errorPreview,
                  ]}
                >
                  <Text style={styles.previewLabel}>Remaining Stock:</Text>
                  <Text
                    style={[
                      styles.previewValue,
                      isOverDeduct && styles.errorText,
                    ]}
                  >
                    {remainingStock} pcs
                  </Text>
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
                <Text style={styles.submitButtonText}>Deduct Stock</Text>
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
    maxHeight: "85%",
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
  lowStock: {
    color: "#FF9800",
  },
  outOfStock: {
    color: "#F44336",
  },
  warningText: {
    fontSize: 12,
    color: "#FF9800",
    marginTop: 4,
    fontStyle: "italic",
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
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#F44336",
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 2,
  },
  hintText: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
  previewContainer: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginTop: 8,
  },
  errorPreview: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
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