// components/test/CategoryFilterTest.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProducts } from "@/context/ProductContext";
import { useCategories } from "@/context/CategoryContext";

// Global singleton to manage modal state
let globalModalVisible = false;
let globalModalListeners: ((visible: boolean) => void)[] = [];

// Internal component with proper display name
const CategoryFilterTestComponent = () => {
  const [visible, setVisible] = useState(false);
  const {
    products,
    loading: productsLoading,
    refreshProducts,
    addProduct,
  } = useProducts();
  const {
    categories,
    loading: categoriesLoading,
    refreshCategories,
    addCategory,
  } = useCategories();

  const [testProductName, setTestProductName] = useState("");
  const [testCategoryName, setTestCategoryName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testProductId, setTestProductId] = useState<number | null>(null);

  // Register listener for global show/hide
  useEffect(() => {
    const listener = (newVisible: boolean) => {
      setVisible(newVisible);
      if (newVisible) {
        // Reset test data when modal opens
        setTestResults([]);
        setTestProductName("");
        setTestCategoryName("");
        setSelectedCategories([]);
        setTestProductId(null);
        // Refresh data
        refreshProducts();
        refreshCategories();
      }
    };
    globalModalListeners.push(listener);
    return () => {
      const index = globalModalListeners.indexOf(listener);
      if (index > -1) globalModalListeners.splice(index, 1);
    };
  }, [refreshProducts, refreshCategories]);

  // Add log to test results
  const addLog = (
    message: string,
    type: "info" | "success" | "error" = "info",
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === "success" ? "✅" : type === "error" ? "❌" : "📝";
    setTestResults((prev) => [
      `${emoji} [${timestamp}] ${message}`,
      ...prev.slice(0, 49),
    ]);
  };

  // Test 1: Create a test category
  const createTestCategory = async () => {
    if (!testCategoryName.trim()) {
      addLog("Please enter a category name", "error");
      return false;
    }

    addLog(`Creating test category: "${testCategoryName}"...`, "info");
    try {
      const newCategory = await addCategory(testCategoryName.trim());
      addLog(`Category created successfully! ID: ${newCategory.id}`, "success");
      await refreshCategories();
      return newCategory.id;
    } catch (error: any) {
      addLog(`Failed to create category: ${error.message}`, "error");
      return null;
    }
  };

  // Test 2: Create a test product with categories
  const createTestProduct = async () => {
    if (!testProductName.trim()) {
      addLog("Please enter a product name", "error");
      return false;
    }

    if (selectedCategories.length === 0) {
      addLog("Please select at least one category for the product", "error");
      return false;
    }

    addLog(
      `Creating test product: "${testProductName}" with categories: ${selectedCategories.join(", ")}...`,
      "info",
    );
    try {
      const productData = {
        name: testProductName.trim(),
        price: 99.99,
        stock_quantity: 100,
        low_stock_threshold: 10,
        category_ids: selectedCategories,
      };

      await addProduct(productData, null);
      addLog(`Product created successfully!`, "success");
      await refreshProducts();
      return true;
    } catch (error: any) {
      addLog(`Failed to create product: ${error.message}`, "error");
      return false;
    }
  };

  // Test 3: Verify product categories in products list
  const verifyProductCategories = async () => {
    addLog("Verifying product categories in products list...", "info");
    await refreshProducts();

    const testProduct = products.find((p) => p.name === testProductName.trim());
    if (!testProduct) {
      addLog(
        `Test product "${testProductName}" not found in products list`,
        "error",
      );
      return false;
    }

    setTestProductId(testProduct.id);
    addLog(`Found product ID: ${testProduct.id}`, "success");

    // Check categories
    const productCategoryIds =
      testProduct.categories?.map((c: any) => c.id) || [];
    const missingCategories = selectedCategories.filter(
      (id) => !productCategoryIds.includes(id),
    );

    if (missingCategories.length === 0) {
      addLog(
        `✅ Product has all ${selectedCategories.length} assigned categories`,
        "success",
      );
      addLog(
        `   Categories: ${testProduct.categories?.map((c: any) => c.name).join(", ")}`,
        "success",
      );
      return true;
    } else {
      addLog(
        `❌ Product missing categories: ${missingCategories.join(", ")}`,
        "error",
      );
      return false;
    }
  };

  // Test 4: Test category filter in products list
  const testCategoryFilter = async () => {
    addLog("Testing category filter...", "info");

    await refreshProducts();

    // Test each selected category
    for (const categoryId of selectedCategories) {
      const category = categories.find((c) => c.id === categoryId);
      if (!category) continue;

      // Filter products by this category
      const filteredProducts = products.filter((p) =>
        p.categories?.some((c: any) => c.id === categoryId),
      );

      const hasTestProduct = filteredProducts.some(
        (p) => p.name === testProductName.trim(),
      );

      if (hasTestProduct) {
        addLog(
          `✅ Category filter "${category.category_name}" correctly shows test product`,
          "success",
        );
      } else {
        addLog(
          `❌ Category filter "${category.category_name}" does NOT show test product`,
          "error",
        );
        addLog(
          `   Filtered ${filteredProducts.length} products, test product missing`,
          "error",
        );
      }
    }

    // Test "All" filter
    const allProducts = products;
    const testProductInAll = allProducts.some(
      (p) => p.name === testProductName.trim(),
    );
    if (testProductInAll) {
      addLog(`✅ "All" filter correctly shows test product`, "success");
    } else {
      addLog(`❌ "All" filter does NOT show test product`, "error");
    }
  };

  // Test 5: Test stock status filter with product
  const testStockStatusFilter = async () => {
    addLog("Testing stock status filter...", "info");

    const testProduct = products.find((p) => p.id === testProductId);
    if (!testProduct) {
      addLog("Test product not found, skipping stock status test", "error");
      return;
    }

    // Determine stock status
    let expectedStatus = "";
    if (testProduct.stock_quantity === 0) {
      expectedStatus = "out_of_stock";
    } else if (testProduct.stock_quantity <= testProduct.low_stock_threshold) {
      expectedStatus = "low_stock";
    } else {
      expectedStatus = "in_stock";
    }

    addLog(
      `Product stock: ${testProduct.stock_quantity}, threshold: ${testProduct.low_stock_threshold}`,
      "info",
    );
    addLog(`Expected status: ${expectedStatus}`, "info");

    // Filter by expected status
    const filteredByStatus = products.filter((p) => {
      if (expectedStatus === "in_stock")
        return p.stock_quantity > p.low_stock_threshold;
      if (expectedStatus === "low_stock")
        return (
          p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0
        );
      if (expectedStatus === "out_of_stock") return p.stock_quantity === 0;
      return true;
    });

    const productInFilter = filteredByStatus.some(
      (p) => p.id === testProduct.id,
    );

    if (productInFilter) {
      addLog(
        `✅ Stock status filter "${expectedStatus}" correctly shows test product`,
        "success",
      );
    } else {
      addLog(
        `❌ Stock status filter "${expectedStatus}" does NOT show test product`,
        "error",
      );
    }
  };

  // Test 6: Verify category counts
  const verifyCategoryCounts = async () => {
    addLog("Verifying category counts...", "info");

    await refreshProducts();

    for (const category of categories) {
      const actualCount = products.filter((p) =>
        p.categories?.some((c: any) => c.id === category.id),
      ).length;

      addLog(
        `Category "${category.category_name}": ${actualCount} products`,
        "info",
      );
    }
  };

  // Run all tests
  const runAllTests = async () => {
    if (isRunningTest) {
      addLog("Test already running, please wait...", "error");
      return;
    }

    setIsRunningTest(true);
    setTestResults([]);
    addLog("🚀 Starting category filter tests...", "info");
    addLog("=====================================", "info");

    try {
      // Step 1: Create test category if not exists
      let categoryId = selectedCategories[0];
      if (!categoryId && testCategoryName) {
        const newId = await createTestCategory();
        if (newId) {
          categoryId = newId;
          setSelectedCategories([categoryId]);
        }
      }

      // Step 2: Create test product
      if (testProductName && selectedCategories.length > 0) {
        const created = await createTestProduct();
        if (!created) {
          addLog("Test aborted - failed to create product", "error");
          return;
        }
      }

      // Step 3: Verify product categories
      if (testProductName) {
        const verified = await verifyProductCategories();
        if (!verified) {
          addLog("Test aborted - category verification failed", "error");
          return;
        }
      }

      // Step 4: Test category filter
      await testCategoryFilter();

      // Step 5: Test stock status filter
      await testStockStatusFilter();

      // Step 6: Verify category counts
      await verifyCategoryCounts();

      addLog("=====================================", "info");
      addLog("✅ All tests completed!", "success");
    } catch (error: any) {
      addLog(`Test failed with error: ${error.message}`, "error");
    } finally {
      setIsRunningTest(false);
    }
  };

  // Clear test data
  const clearTestData = async () => {
    addLog("Clearing test data...", "info");
    setIsRunningTest(true);

    try {
      await refreshProducts();
      await refreshCategories();
      setTestProductId(null);
      setSelectedCategories([]);
      setTestProductName("");
      setTestCategoryName("");
      addLog("Test data cleared - data refreshed", "success");
    } catch (error: any) {
      addLog(`Failed to clear test data: ${error.message}`, "error");
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleClose = () => {
    CategoryFilterTest.hide();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Category Filter Test</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.container}>
            {/* Test Configuration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Configuration</Text>

              {/* Category Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Test Category Name (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={testCategoryName}
                  onChangeText={setTestCategoryName}
                  placeholder="e.g., Test Category"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Product Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Test Product Name *</Text>
                <TextInput
                  style={styles.input}
                  value={testProductName}
                  onChangeText={setTestProductName}
                  placeholder="e.g., Test Product"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Select Categories for Product *
                </Text>
                {categoriesLoading ? (
                  <ActivityIndicator size="small" color="#ED277C" />
                ) : categories.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No categories available. Create one first.
                  </Text>
                ) : (
                  <View style={styles.categoriesContainer}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          selectedCategories.includes(cat.id) &&
                            styles.categoryChipSelected,
                        ]}
                        onPress={() => {
                          setSelectedCategories((prev) =>
                            prev.includes(cat.id)
                              ? prev.filter((id) => id !== cat.id)
                              : [...prev, cat.id],
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            selectedCategories.includes(cat.id) &&
                              styles.categoryChipTextSelected,
                          ]}
                        >
                          {cat.category_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.runButton]}
                  onPress={runAllTests}
                  disabled={
                    isRunningTest ||
                    !testProductName.trim() ||
                    selectedCategories.length === 0
                  }
                >
                  {isRunningTest ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="play" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Run Tests</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.clearButton]}
                  onPress={clearTestData}
                  disabled={isRunningTest}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                  <Text style={[styles.buttonText, styles.clearButtonText]}>
                    Clear Data
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.refreshButton]}
                  onPress={() => {
                    refreshProducts();
                    refreshCategories();
                    addLog(
                      "Manually refreshed products and categories",
                      "success",
                    );
                  }}
                  disabled={isRunningTest}
                >
                  <Ionicons name="refresh" size={20} color="#ED277C" />
                  <Text style={[styles.buttonText, styles.refreshButtonText]}>
                    Refresh
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Test Results */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Results</Text>
              <View style={styles.resultsContainer}>
                {testResults.length === 0 ? (
                  <Text style={styles.emptyResultsText}>
                    Run tests to see results here
                  </Text>
                ) : (
                  <FlatList
                    data={testResults}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                      <Text style={styles.resultText}>{item}</Text>
                    )}
                    scrollEnabled={true}
                    style={styles.resultsList}
                  />
                )}
              </View>
            </View>

            {/* Status Indicators */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Products:</Text>
                  <Text style={styles.statusValue}>{products.length}</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Categories:</Text>
                  <Text style={styles.statusValue}>{categories.length}</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Loading:</Text>
                  <Text style={styles.statusValue}>
                    {productsLoading || categoriesLoading ? "Yes" : "No"}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Set display name for debugging
// CategoryFilterTestComponent.displayName = "CategoryFilterTestComponent";

// Export the singleton with methods
export const CategoryFilterTest = {
  show: () => {
    globalModalVisible = true;
    globalModalListeners.forEach((listener) => listener(true));
  },
  hide: () => {
    globalModalVisible = false;
    globalModalListeners.forEach((listener) => listener(false));
  },
  Component: CategoryFilterTestComponent,
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "90%",
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
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f8f8f8",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryChipSelected: {
    backgroundColor: "#ED277C",
    borderColor: "#ED277C",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#666",
  },
  categoryChipTextSelected: {
    color: "#fff",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    height: 45,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  runButton: {
    backgroundColor: "#ED277C",
  },
  clearButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F44336",
  },
  refreshButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ED277C",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  clearButtonText: {
    color: "#F44336",
  },
  refreshButtonText: {
    color: "#ED277C",
  },
  resultsContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
    minHeight: 150,
  },
  resultsList: {
    flex: 1,
  },
  resultText: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
    marginBottom: 4,
    lineHeight: 16,
  },
  emptyResultsText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  statusContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  statusValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
});
