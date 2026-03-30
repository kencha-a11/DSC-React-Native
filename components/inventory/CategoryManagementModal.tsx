// components/inventory/CategoryManagementModal.tsx
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCategories } from "@/context/CategoryContext";
import { useProducts } from "@/context/ProductContext";
import { usePermissions } from "@/context/PermissionContext";
import DscToast from "@/components/common/DscToast";
import EditCategoryModal from "./EditCategoryModal";
import RemoveCategoryModal from "@/components/inventory/RemoveCategoryModal";
import RemoveMultipleCategoryModal from "./RemoveMultipleCategoryModal";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CategoryManagementModal({
  visible,
  onClose,
  onSuccess,
}: Props) {
  const { categories, loading: categoriesLoading, refreshCategories } = useCategories();
  // FIX: useProducts is now only needed for refreshProducts after a mutation.
  // We no longer iterate the products array to compute per-category counts
  // (which was wrong for paginated stores). Category counts come from
  // category.product_count, which the backend populates via withCount('products').
  const { refreshProducts } = useProducts();
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission("create_categories");
  const canRemove = hasPermission("remove_categories");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState<any[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const filtered = useMemo(
    () =>
      categories.filter((c) =>
        c.category_name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [categories, searchQuery],
  );

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === filtered.length ? [] : filtered.map((c) => c.id),
    );
  }, [filtered]);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (!selectedIds.length) return;
    setBulkDeleteTargets(categories.filter((c) => selectedIds.includes(c.id)));
  }, [selectedIds, categories]);

  const handleEditSuccess = useCallback(async () => {
    await refreshProducts();
    await refreshCategories();
    showToast("Category updated successfully!");
    setEditTargetId(null);
    onSuccess?.();
  }, [showToast, onSuccess, refreshProducts]);

  const handleDeleteSuccess = useCallback(async () => {
    await refreshProducts();
    showToast("Category deleted successfully!");
    setDeleteTarget(null);
    onSuccess?.();
  }, [showToast, onSuccess, refreshProducts]);

  const handleBulkDeleteSuccess = useCallback(async () => {
    await refreshProducts();
    showToast(
      `${selectedIds.length} categor${selectedIds.length === 1 ? "y" : "ies"} deleted`,
    );
    setBulkDeleteTargets([]);
    exitSelectionMode();
    onSuccess?.();
  }, [
    showToast,
    selectedIds.length,
    exitSelectionMode,
    onSuccess,
    refreshProducts,
  ]);

  return (
    <>
      <Modal visible={visible} transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Manage Categories</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#999"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {!!searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Bulk actions */}
            {canRemove && (
              <View style={styles.bulkBar}>
                {!isSelectionMode ? (
                  <TouchableOpacity
                    style={styles.bulkRow}
                    onPress={() => setIsSelectionMode(true)}
                  >
                    <Ionicons
                      name="checkbox-outline"
                      size={20}
                      color="#ED277C"
                    />
                    <Text style={styles.bulkText}>Select Multiple</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.bulkRow}>
                    <TouchableOpacity
                      style={styles.bulkItem}
                      onPress={toggleSelectAll}
                    >
                      <Ionicons
                        name={
                          selectedIds.length === filtered.length
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={20}
                        color="#ED277C"
                      />
                      <Text style={styles.bulkText}>
                        {selectedIds.length === filtered.length
                          ? "Deselect All"
                          : "Select All"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.bulkItem,
                        !selectedIds.length && styles.disabled,
                      ]}
                      onPress={handleBulkDelete}
                      disabled={!selectedIds.length}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={selectedIds.length ? "#F44336" : "#ccc"}
                      />
                      <Text
                        style={[
                          styles.bulkText,
                          !selectedIds.length && styles.disabledText,
                        ]}
                      >
                        Delete ({selectedIds.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bulkItem}
                      onPress={exitSelectionMode}
                    >
                      <Ionicons name="close" size={20} color="#666" />
                      <Text style={styles.bulkText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Category list */}
            {categoriesLoading && categories.length === 0 ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#ED277C" />
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            ) : (
              <ScrollView style={styles.list}>
                {filtered.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons
                      name="folder-open-outline"
                      size={48}
                      color="#ccc"
                    />
                    <Text style={styles.emptyText}>No categories found</Text>
                  </View>
                ) : (
                  filtered.map((category) => (
                    <View key={category.id} style={styles.item}>
                      <View style={styles.itemRow}>
                        {isSelectionMode && canRemove && (
                          <TouchableOpacity
                            onPress={() => toggleSelection(category.id)}
                          >
                            <Ionicons
                              name={
                                selectedIds.includes(category.id)
                                  ? "checkbox"
                                  : "square-outline"
                              }
                              size={24}
                              color={
                                selectedIds.includes(category.id)
                                  ? "#ED277C"
                                  : "#ccc"
                              }
                              style={{ marginRight: 12 }}
                            />
                          </TouchableOpacity>
                        )}

                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>
                            {category.category_name}
                          </Text>
                          {/* FIX: product_count from the backend (withCount) — accurate
                              across all products, not just the current page. */}
                          <Text style={styles.itemCount}>
                            {category.product_count ?? 0} products
                          </Text>
                        </View>

                        {!isSelectionMode && (
                          <View style={styles.actions}>
                            {canEdit && (
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.editBtn]}
                                onPress={() => setEditTargetId(category.id)}
                              >
                                <Ionicons
                                  name="create-outline"
                                  size={18}
                                  color="#ED277C"
                                />
                                <Text style={styles.editBtnText}>Edit</Text>
                              </TouchableOpacity>
                            )}
                            {canRemove && (
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={() => setDeleteTarget(category)}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={18}
                                  color="#F44336"
                                />
                                <Text style={styles.deleteBtnText}>Delete</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast outside the Modal so it sits in the root stacking context */}
      <DscToast
        visible={!!toast}
        message={toast?.message ?? ""}
        type={toast?.type ?? "success"}
        onClose={() => setToast(null)}
        showCloseButton
      />

      <EditCategoryModal
        visible={editTargetId !== null}
        categoryId={editTargetId}
        onClose={() => setEditTargetId(null)}
        onSuccess={handleEditSuccess}
      />

      <RemoveCategoryModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleDeleteSuccess}
        category={deleteTarget}
      />

      <RemoveMultipleCategoryModal
        visible={bulkDeleteTargets.length > 0}
        onClose={() => setBulkDeleteTargets([])}
        onSuccess={handleBulkDeleteSuccess}
        selectedCategories={bulkDeleteTargets}
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
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    height: 45,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
  },
  searchInput: { flex: 1, height: 45, fontSize: 14, color: "#333" },
  bulkBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bulkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bulkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bulkText: { fontSize: 14, color: "#333" },
  disabled: { opacity: 0.5 },
  disabledText: { color: "#ccc" },
  list: { maxHeight: 400 },
  loader: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#ED277C" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#999", marginTop: 8 },
  item: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "500", color: "#333", marginBottom: 4 },
  itemCount: { fontSize: 12, color: "#999" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
    gap: 4,
  },
  editBtn: { backgroundColor: "#ED277C10", borderColor: "#ED277C20" },
  editBtnText: { fontSize: 12, color: "#ED277C", fontWeight: "500" },
  deleteBtn: { backgroundColor: "#F4433610", borderColor: "#F4433620" },
  deleteBtnText: { fontSize: 12, color: "#F44336", fontWeight: "500" },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  closeBtn: {
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  closeBtnText: { color: "#666", fontSize: 14, fontWeight: "600" },
});
