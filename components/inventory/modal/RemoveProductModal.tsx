// components/inventory/RemoveProductModal.tsx
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
import { useProducts } from "@/context/ProductContext";
import { usePermissions } from "@/context/PermissionContext";

interface RemoveProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: any | null;
  multiple?: boolean;
  selectedCount?: number;
  selectedIds?: number[];
  onConfirmMultiple?: () => Promise<void>;
}

export default function RemoveProductModal({
  visible,
  onClose,
  onSuccess,
  product,
  multiple = false,
  selectedCount = 0,
  selectedIds = [],
  onConfirmMultiple,
}: RemoveProductModalProps) {
  const { removeProduct, removeMultipleProducts } = useProducts();
  const { hasPermission } = usePermissions();

  // ─── FIX: Two-step confirmation ──────────────────────────────────────────────
  // The original modal rendered two stacked <Modal> components: one for the
  // permission-denied case and one for the normal case. React Native stacks
  // modals on top of each other in the order they are mounted — if both happen
  // to evaluate as visible simultaneously (e.g. during the brief window when
  // permissionChecked flips), two modal layers appear. The lower one then gets
  // a touch event via Android back-press propagation, which looked like an
  // "auto-click". Replaced with a single <Modal> that renders different content
  // based on state, eliminating any possibility of double-modal stacking.
  //
  // The deletion is now two steps:
  //   Step 1 (default)  — shows product info and a "Delete Product" button.
  //   Step 2 (confirming) — shows a red confirmation prompt.
  // This matches the user's expectation of "another final confirmation".
  const [step, setStep] = useState<"info" | "confirm">("info");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletingRef = useRef(false);

  const canRemove = hasPermission("remove_items");

  // Reset to step 1 every time the modal opens so a re-open never starts on
  // the confirmation screen.
  useEffect(() => {
    if (visible) {
      setStep("info");
      setSubmitting(false);
      setError(null);
      deletingRef.current = false;
    }
  }, [visible]);

  // ─── Delete handlers ─────────────────────────────────────────────────────────

  const handleSingleRemove = useCallback(async () => {
    if (deletingRef.current) return;
    if (!product?.id) {
      setError("Product ID not found");
      return;
    }

    deletingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      await removeProduct(product.id);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      deletingRef.current = false;
      setSubmitting(false);
      setError(err.message || "Failed to delete product");
      setStep("info"); // return to info step on error
    }
  }, [product, removeProduct, onClose, onSuccess]);

  const handleMultipleRemove = useCallback(async () => {
    if (deletingRef.current) return;

    deletingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      if (onConfirmMultiple) {
        await onConfirmMultiple();
      } else {
        const ids = selectedIds.length > 0 ? selectedIds : (product?.ids ?? []);
        if (ids.length === 0) {
          setError("No products selected");
          deletingRef.current = false;
          setSubmitting(false);
          return;
        }
        await removeMultipleProducts(ids);
      }
      onClose();
      onSuccess?.();
    } catch (err: any) {
      deletingRef.current = false;
      setSubmitting(false);
      setError(err.message || "Failed to delete products");
      setStep("info");
    }
  }, [
    selectedIds,
    product,
    onConfirmMultiple,
    removeMultipleProducts,
    onClose,
    onSuccess,
  ]);

  const handleConfirmPress = multiple
    ? handleMultipleRemove
    : handleSingleRemove;

  const deleteCount =
    selectedCount || selectedIds.length || product?.ids?.length || 0;

  // ─── FIX: Single <Modal>, content switches by state ─────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!submitting) {
          setStep("info");
          onClose();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* ── Permission denied ── */}
          {!canRemove ? (
            <View style={styles.accessDeniedContainer}>
              <Ionicons name="lock-closed" size={48} color="#F44336" />
              <Text style={styles.accessDeniedTitle}>Access Denied</Text>
              <Text style={styles.accessDeniedMessage}>
                You don't have permission to remove products.
              </Text>
              <TouchableOpacity style={styles.closeAccessBtn} onPress={onClose}>
                <Text style={styles.closeAccessBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : step === "info" ? (
            /* ── Step 1: Product info + first "Delete" button ── */
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  {multiple ? "Delete Multiple Products" : "Delete Product"}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  disabled={submitting}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="trash-outline" size={56} color="#F44336" />
                </View>

                <View style={styles.messageContainer}>
                  {multiple ? (
                    <>
                      <Text style={styles.title}>
                        Delete {deleteCount} Products?
                      </Text>
                      <Text style={styles.subtitle}>
                        This will permanently remove all selected products. This
                        action cannot be undone.
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.title}>
                        Delete "{product?.name}"?
                      </Text>
                      <Text style={styles.subtitle}>
                        This will permanently remove this product. This action
                        cannot be undone.
                      </Text>
                    </>
                  )}
                </View>

                {/* Single product details */}
                {!multiple && product && (
                  <View style={styles.infoCard}>
                    <InfoRow label="Product" value={product.name} />
                    <InfoRow
                      label="Category"
                      value={
                        product.categories
                          ?.map((c: any) => c.name || c.category_name)
                          .join(", ") || "Uncategorized"
                      }
                    />
                    <InfoRow
                      label="Stock"
                      value={`${product.stock_quantity} pcs`}
                    />
                    <InfoRow label="Price" value={`₱${product.price}`} last />
                  </View>
                )}

                {/* Multiple summary */}
                {multiple && (
                  <View style={styles.infoCard}>
                    <View style={styles.multiSummary}>
                      <Ionicons name="cube-outline" size={20} color="#666" />
                      <Text style={styles.multiSummaryText}>
                        {deleteCount} products selected for deletion
                      </Text>
                    </View>
                  </View>
                )}

                {/* Stock warning */}
                {!multiple && product && product.stock_quantity > 0 && (
                  <View style={styles.stockWarning}>
                    <Ionicons name="alert-circle" size={18} color="#FF9800" />
                    <Text style={styles.stockWarningText}>
                      This product still has {product.stock_quantity} units in
                      stock. Deleting will remove this inventory record.
                    </Text>
                  </View>
                )}

                {error && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="close-circle" size={16} color="#F44336" />
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={onClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.deleteBtn]}
                  onPress={() => setStep("confirm")}
                  disabled={submitting}
                >
                  <Text style={styles.deleteBtnText}>
                    {multiple ? "Delete All" : "Delete Product"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* ── Step 2: Final confirmation ── */
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Final Confirmation</Text>
                <TouchableOpacity
                  onPress={() => setStep("info")}
                  style={styles.closeButton}
                  disabled={submitting}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.confirmBody}>
                <View style={styles.confirmIconRing}>
                  <Ionicons name="warning" size={40} color="#F44336" />
                </View>

                <Text style={styles.confirmTitle}>
                  Are you absolutely sure?
                </Text>
                <Text style={styles.confirmText}>
                  {multiple
                    ? `You are about to permanently delete ${deleteCount} products. This cannot be reversed.`
                    : `You are about to permanently delete "${product?.name}". This cannot be reversed.`}
                </Text>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setStep("info")}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.confirmDeleteBtn,
                    submitting && styles.btnDisabled,
                  ]}
                  onPress={handleConfirmPress}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.deleteBtnText}>Yes, Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Small helper to avoid repeating row markup
function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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

  // ── Access denied ──
  accessDeniedContainer: {
    padding: 32,
    alignItems: "center",
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  closeAccessBtn: {
    backgroundColor: "#ED277C",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeAccessBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  closeButton: { padding: 4 },

  // ── Step 1 scroll content ──
  scrollView: { maxHeight: "70%" },
  iconContainer: { alignItems: "center", marginTop: 24, marginBottom: 12 },
  messageContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F44336",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },

  infoCard: {
    backgroundColor: "#f8f8f8",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 13, color: "#666", fontWeight: "500" },
  infoValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },

  multiSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
  },
  multiSummaryText: { fontSize: 14, color: "#333", fontWeight: "500" },

  stockWarning: {
    flexDirection: "row",
    backgroundColor: "#FFF4E0",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF9800",
    gap: 8,
    alignItems: "flex-start",
  },
  stockWarningText: { flex: 1, fontSize: 12, color: "#666", lineHeight: 18 },

  errorBanner: {
    flexDirection: "row",
    backgroundColor: "#FFEBEE",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    gap: 8,
    alignItems: "center",
  },
  errorBannerText: { flex: 1, fontSize: 13, color: "#C62828" },

  // ── Step 2 confirm ──
  confirmBody: {
    padding: 28,
    alignItems: "center",
  },
  confirmIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Footer ──
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtn: { backgroundColor: "#f5f5f5", borderColor: "#e0e0e0" },
  cancelBtnText: { color: "#666", fontSize: 14, fontWeight: "600" },
  deleteBtn: { backgroundColor: "#F44336", borderColor: "#F44336" },
  confirmDeleteBtn: { backgroundColor: "#C62828", borderColor: "#C62828" },
  deleteBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  btnDisabled: { opacity: 0.5 },
});
