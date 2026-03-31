import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCategories } from "@/context/CategoryContext";
import { useProducts } from "@/context/ProductContext";
import { usePermissions } from "@/context/PermissionContext";
import DscToast from "@/components/common/DscToast";
import AddProductBarcodeModal from "@/components/product/AddProductBarcode";

interface EditProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: any | null;
}

interface FormState {
  name: string;
  price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  description: string;
  barcode: string;
  category_id: number | null;
  image: any | null;
  imagePreview: string | null;
  removeImage: boolean;
}

export default function EditProductModal({
  visible,
  onClose,
  onSuccess,
  product,
}: EditProductModalProps) {
  const { categories } = useCategories();
  const { editProduct, loading } = useProducts();
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission("edit_items");

  // Form state
  const [form, setForm] = useState<FormState>({
    name: "",
    price: "",
    stock_quantity: "",
    low_stock_threshold: "10",
    description: "",
    barcode: "",
    category_id: null,
    image: null,
    imagePreview: null,
    removeImage: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);

  // Reset modal state when it opens
  useEffect(() => {
    if (visible) {
      setIsSubmitting(false);
      setErrors({});
      setToast(null);
    }
  }, [visible]);

  // Load product data when modal opens or product changes
  useEffect(() => {
    if (visible && product) {
      loadProductData(product);
    }
  }, [visible, product]);

  // Auto‑close if permission denied
  useEffect(() => {
    if (visible && !canEdit) {
      showToast("You don't have permission to edit products", "error");
      setTimeout(onClose, 2000);
    }
  }, [visible, canEdit]);

  const loadProductData = (product: any) => {
    const primaryCategory = product.category_ids?.[0] ?? product.category_id ?? null;
    setForm({
      name: product.name || "",
      price: product.price?.toString() || "",
      stock_quantity: product.stock_quantity?.toString() || "",
      low_stock_threshold: product.low_stock_threshold?.toString() || "10",
      description: product.description || "",
      barcode: product.barcode || "",
      category_id: primaryCategory,
      image: null,
      imagePreview: product.image || null,
      removeImage: false,
    });
    setErrors({});
  };

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleBarcodeScanned = (barcode: string) => {
    setForm({ ...form, barcode });
  };

  // Image handling
  const requestMediaPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photos to update product images.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your camera to take product photos.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const processImage = (asset: ImagePicker.ImagePickerAsset) => {
    const filename = asset.uri.split("/").pop() || "image.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    setForm({
      ...form,
      image: { uri: asset.uri, name: filename, type },
      imagePreview: asset.uri,
      removeImage: false,
    });
    if (errors.image) {
      const { image, ...rest } = errors;
      setErrors(rest);
    }
  };

  const pickImage = async () => {
    if (!(await requestMediaPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    if (!(await requestCameraPermission())) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0]);
    }
  };

  const removeImage = () => {
    setForm({
      ...form,
      image: null,
      imagePreview: null,
      removeImage: true,
    });
  };

  const showImageOptions = () => {
    Alert.alert("Update Product Image", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickImage },
      { text: "Remove Current Image", onPress: removeImage, style: "destructive" },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (form.name.length > 255) {
      newErrors.name = "Product name must be less than 255 characters";
    }

    const priceNum = parseFloat(form.price);
    if (!form.price.trim()) {
      newErrors.price = "Price is required";
    } else if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = "Price must be a valid positive number";
    }

    const stockNum = parseInt(form.stock_quantity);
    if (!form.stock_quantity.trim()) {
      newErrors.stock_quantity = "Stock quantity is required";
    } else if (isNaN(stockNum) || stockNum < 0) {
      newErrors.stock_quantity = "Stock quantity must be a valid non-negative number";
    }

    // Barcode validation (optional, but if provided, check format)
    if (form.barcode.trim() && form.barcode.length > 50) {
      newErrors.barcode = "Barcode must be less than 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!canEdit) {
      showToast("You don't have permission to edit products", "error");
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
    const productData: any = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
      category_ids: form.category_id ? [form.category_id] : [],
      barcode: form.barcode.trim() || undefined,
    };
    if (form.removeImage) productData.remove_image = true;

    try {
      await editProduct(product.id, productData, form.image || undefined);
      showToast("Product updated successfully!", "success");
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      setIsSubmitting(false);
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        const newErrors: Record<string, string> = {};
        if (serverErrors.name) newErrors.name = Array.isArray(serverErrors.name) ? serverErrors.name[0] : serverErrors.name;
        if (serverErrors.price) newErrors.price = Array.isArray(serverErrors.price) ? serverErrors.price[0] : serverErrors.price;
        if (serverErrors.stock_quantity) newErrors.stock_quantity = Array.isArray(serverErrors.stock_quantity) ? serverErrors.stock_quantity[0] : serverErrors.stock_quantity;
        if (serverErrors.barcode) newErrors.barcode = Array.isArray(serverErrors.barcode) ? serverErrors.barcode[0] : serverErrors.barcode;
        setErrors(newErrors);
        const firstMessage = Object.values(serverErrors)[0];
        const msg = Array.isArray(firstMessage) ? firstMessage[0] : "Validation error";
        showToast(msg, "error");
      } else if (error.message?.includes("unique") || error.message?.includes("already exists")) {
        if (error.message?.includes("barcode")) {
          setErrors({ ...errors, barcode: "This barcode is already in use" });
          showToast("Barcode already exists", "error");
        } else {
          setErrors({ ...errors, name: "A product with this name already exists" });
          showToast("Product name already exists", "error");
        }
      } else {
        showToast(error.message || "Failed to update product", "error");
      }
    }
  };

  // Permission guard
  if (!canEdit && visible) {
    return null; // auto‑closed by useEffect
  }

  return (
    <>
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
              <Text style={styles.headerTitle}>Edit Product</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                disabled={isSubmitting}
                activeOpacity={1}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Image Section */}
              <View style={styles.imageSection}>
                {form.imagePreview ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: form.imagePreview }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.editImageButton}
                      onPress={showImageOptions}
                      activeOpacity={1}
                    >
                      <Ionicons name="camera" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.imagePicker}
                    onPress={showImageOptions}
                    activeOpacity={1}
                  >
                    <Ionicons name="camera-outline" size={32} color="#ED277C" />
                    <Text style={styles.imagePickerText}>Add Product Image</Text>
                    <Text style={styles.imagePickerHint}>Optional • Tap to choose</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Basic Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter product name"
                    value={form.name}
                    onChangeText={(text) => {
                      setForm({ ...form, name: text });
                      if (errors.name) delete errors.name;
                    }}
                    editable={!isSubmitting}
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <Text style={styles.label}>Price (₱) <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, errors.price && styles.inputError]}
                      placeholder="0.00"
                      value={form.price}
                      onChangeText={(text) => {
                        setForm({ ...form, price: text });
                        if (errors.price) delete errors.price;
                      }}
                      keyboardType="numeric"
                      editable={!isSubmitting}
                    />
                    {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                  </View>

                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <Text style={styles.label}>Stock Quantity <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, errors.stock_quantity && styles.inputError]}
                      placeholder="0"
                      value={form.stock_quantity}
                      onChangeText={(text) => {
                        setForm({ ...form, stock_quantity: text });
                        if (errors.stock_quantity) delete errors.stock_quantity;
                      }}
                      keyboardType="numeric"
                      editable={!isSubmitting}
                    />
                    {errors.stock_quantity && <Text style={styles.errorText}>{errors.stock_quantity}</Text>}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Low Stock Threshold</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10 (default)"
                    value={form.low_stock_threshold}
                    onChangeText={(text) => setForm({ ...form, low_stock_threshold: text })}
                    keyboardType="numeric"
                    editable={!isSubmitting}
                  />
                  <Text style={styles.hintText}>You'll be notified when stock falls below this number</Text>
                </View>
              </View>

              {/* Categories */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Category <Text style={styles.optional}>(Optional)</Text>
                </Text>
                <View style={styles.categoriesContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        form.category_id === cat.id && styles.categoryChipSelected,
                      ]}
                      onPress={() => setForm({ ...form, category_id: form.category_id === cat.id ? null : cat.id })}
                      activeOpacity={1}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          form.category_id === cat.id && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat.category_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.category_ids && <Text style={styles.errorText}>{errors.category_ids}</Text>}
              </View>

              {/* Barcode Field */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Barcode <Text style={styles.optional}>(Optional)</Text>
                </Text>
                <View style={styles.barcodeContainer}>
                  <TextInput
                    style={[styles.input, styles.barcodeInput, errors.barcode && styles.inputError]}
                    placeholder="Enter barcode (e.g., 1234567890)"
                    value={form.barcode}
                    onChangeText={(text) => {
                      setForm({ ...form, barcode: text });
                      if (errors.barcode) delete errors.barcode;
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => setBarcodeModalVisible(true)}
                    activeOpacity={1}
                  >
                    <Ionicons name="scan-outline" size={24} color="#ED277C" />
                  </TouchableOpacity>
                </View>
                {errors.barcode && <Text style={styles.errorText}>{errors.barcode}</Text>}
                <Text style={styles.hintText}>
                  Add or update barcode to enable scanning for quick product lookup
                </Text>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter product description (optional)"
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                  numberOfLines={4}
                  editable={!isSubmitting}
                />
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
                  <Text style={styles.submitButtonText}>Update Product</Text>
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

      <AddProductBarcodeModal
        visible={barcodeModalVisible}
        onClose={() => setBarcodeModalVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
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
    maxHeight: "90%",
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
  imageSection: {
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  imagePicker: {
    width: "100%",
    height: 100,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ED277C",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: "#ED277C",
    fontWeight: "600",
    marginTop: 4,
  },
  imagePickerHint: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  imagePreviewContainer: {
    position: "relative",
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ED277C",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  optional: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
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
    marginTop: 2,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryChipSelected: {
    backgroundColor: "#ED277C",
    borderColor: "#ED277C",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#666",
  },
  categoryChipTextSelected: {
    color: "#fff",
  },
  barcodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barcodeIcon: {
    width: 40,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
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