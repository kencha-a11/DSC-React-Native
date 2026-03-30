// components/inventory/RemoveCategoryModal.tsx
import DscToast from "@/components/common/DscToast";
import { useCategories } from "@/context/CategoryContext";
import { usePermissions } from "@/context/PermissionContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface RemoveCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  category: any | null;
}

export default function RemoveCategoryModal({
  visible,
  onClose,
  onSuccess,
  category,
}: RemoveCategoryModalProps) {
  const { deleteCategory, loading } = useCategories();
  const { hasPermission } = usePermissions();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [submitting, setSubmitting] = useState(false);
  const isClosing = useRef(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      isClosing.current = false;
      setSubmitting(false);
    }
  }, [visible]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToastMessage(message);
      setToastType(type);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    },
    [],
  );

  const handleDelete = async () => {
    if (!hasPermission("remove_categories")) {
      showToast("You don't have permission to delete categories", "error");
      return;
    }

    if (!category?.id) {
      showToast("Category ID not found", "error");
      return;
    }

    if (isClosing.current) return;

    setSubmitting(true);

    try {
      await deleteCategory(category.id); // Now only takes ID

      showToast(
        `Category "${category.category_name}" deleted successfully`,
        "success",
      );

      isClosing.current = true;
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      setSubmitting(false);
      showToast(error.message || "Failed to delete category", "error");
    }
  };

  const handleClose = useCallback(() => {
    isClosing.current = true;
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Delete Category</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
            {/* Warning Icon */}
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning" size={64} color="#F44336" />
            </View>

            {/* Warning Message */}
            <View style={styles.warningMessageContainer}>
              <Text style={styles.warningTitle}>
                Delete "{category?.category_name}"?
              </Text>
              <Text style={styles.warningText}>
                Are you sure you want to delete this category?
              </Text>
              <Text style={styles.warningSubText}>
                Products in this category will become uncategorized.
              </Text>
            </View>

            {/* Category Info */}
            {category && (
              <View style={styles.categoryInfoCard}>
                <View style={styles.categoryInfoRow}>
                  <Text style={styles.categoryInfoLabel}>Category:</Text>
                  <Text style={styles.categoryInfoValue}>
                    {category.category_name}
                  </Text>
                </View>
                <View style={styles.categoryInfoRow}>
                  <Text style={styles.categoryInfoLabel}>Products:</Text>
                  <Text style={styles.categoryInfoValue}>
                    {category.products?.length || 0} products
                  </Text>
                </View>
                <View style={styles.categoryInfoRow}>
                  <Text style={styles.categoryInfoLabel}>ID:</Text>
                  <Text style={styles.categoryInfoValue}>{category.id}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                (submitting || loading) && styles.deleteButtonDisabled,
              ]}
              onPress={handleDelete}
              disabled={submitting || loading}
            >
              {submitting || loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Category</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Toast */}
      <DscToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
        showCloseButton={true}
      />
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
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
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
  scrollView: {
    maxHeight: "70%",
  },
  warningIconContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  warningMessageContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F44336",
    textAlign: "center",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
  },
  warningSubText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  categoryInfoCard: {
    backgroundColor: "#f8f8f8",
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
  },
  categoryInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  categoryInfoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  categoryInfoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
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
    borderWidth: 1,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  deleteButton: {
    backgroundColor: "#F44336",
    borderColor: "#F44336",
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
