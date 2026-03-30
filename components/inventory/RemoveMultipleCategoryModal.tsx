// components/inventory/RemoveMultipleCategoryModal.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCategories } from "@/context/CategoryContext";
import { usePermissions } from "@/context/PermissionContext";
import DscToast from "@/components/common/DscToast";

interface RemoveMultipleCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedCategories: any[];
}

export default function RemoveMultipleCategoryModal({
  visible,
  onClose,
  onSuccess,
  selectedCategories,
}: RemoveMultipleCategoryModalProps) {
  const { deleteMultipleCategories, loading } = useCategories();
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

    // Extract IDs from selectedCategories
    const categoryIds = selectedCategories
      .map((cat) => cat.id)
      .filter((id) => id);

    if (categoryIds.length === 0) {
      showToast("No valid categories selected", "error");
      return;
    }

    if (isClosing.current) return;

    setSubmitting(true);

    try {
      // Use context method for bulk delete with IDs
      await deleteMultipleCategories(categoryIds);

      if (isClosing.current) return;

      showToast(
        `${categoryIds.length} categor(y/ies) deleted successfully`,
        "success",
      );

      isClosing.current = true;
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      console.error("Failed to delete categories:", error);
      setSubmitting(false);
      if (isClosing.current) return;
      showToast(error.message || "Failed to delete categories", "error");
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
            <Text style={styles.headerTitle}>Delete Multiple Categories</Text>
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
                Delete {selectedCategories.length} Categories?
              </Text>
              <Text style={styles.warningText}>
                Are you sure you want to delete these categories?
              </Text>
              <Text style={styles.warningSubText}>
                Products in these categories will become uncategorized.
              </Text>
            </View>

            {/* Categories List */}
            <View style={styles.categoriesListContainer}>
              <Text style={styles.categoriesListTitle}>
                Categories to delete:
              </Text>
              {selectedCategories.map((category, index) => (
                <View key={category.id || index} style={styles.categoryItem}>
                  <Ionicons name="pricetag-outline" size={16} color="#666" />
                  <Text style={styles.categoryItemText}>
                    {category.category_name}
                  </Text>
                  <Text style={styles.productCount}>
                    {category.products?.length || 0} products
                  </Text>
                  <Text style={styles.categoryIdText}>ID: {category.id}</Text>
                </View>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Ionicons name="cube-outline" size={20} color="#666" />
                <Text style={styles.summaryText}>
                  Total: {selectedCategories.length} categories
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="warning-outline" size={20} color="#FF9800" />
                <Text style={styles.warningNote}>
                  This action cannot be undone
                </Text>
              </View>
            </View>
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
                <Text style={styles.deleteButtonText}>
                  Delete {selectedCategories.length} Categories
                </Text>
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
  categoriesListContainer: {
    backgroundColor: "#f8f8f8",
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
  },
  categoriesListTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  categoryItemText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  productCount: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginRight: 8,
  },
  categoryIdText: {
    fontSize: 10,
    color: "#666",
    fontStyle: "italic",
  },
  summaryCard: {
    backgroundColor: "#f0f0f0",
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  warningNote: {
    fontSize: 12,
    color: "#FF9800",
    fontStyle: "italic",
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
