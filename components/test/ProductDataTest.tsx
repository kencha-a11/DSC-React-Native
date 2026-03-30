// components/debug/ProductDataTest.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProducts } from "@/context/ProductContext";
import * as FileSystem from "expo-file-system";

interface ProductDebugInfo {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  status: string;
  image: string | null;
  image_exists: boolean;
  image_path?: string;
  image_url?: string;
  category_id: number | null;
  category_name: string | null;
  categories: any[];
  created_at: string;
  updated_at: string;
  media?: any[];
}

// Define status color mapping
const statusColors: Record<string, { color: string }> = {
  "in stock": { color: "#4CAF50" },
  "low stock": { color: "#FF9800" },
  "out of stock": { color: "#F44336" },
  stock: { color: "#4CAF50" },
  out_of_stock: { color: "#F44336" },
  low_stock: { color: "#FF9800" },
};

export default function ProductDataTest() {
  const { products, loading, fetchProducts, clearCache } = useProducts();
  const [selectedProduct, setSelectedProduct] =
    useState<ProductDebugInfo | null>(null);
  const [imageTestResults, setImageTestResults] = useState<Record<number, any>>(
    {},
  );
  const [testingImage, setTestingImage] = useState<number | null>(null);
  const [workingUrls, setWorkingUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    console.log("📊 [ProductDataTest] Loading products...");
    await fetchProducts({ page: 1, perPage: 50 });
    console.log(`📊 [ProductDataTest] Loaded ${products.length} products`);
  };

  const generateAlternativeUrls = (originalUrl: string) => {
    try {
      const filename = originalUrl.split("/").pop();
      if (!filename) return [];

      const baseUrl = originalUrl.split("/").slice(0, 3).join("/");
      const alternatives = [
        originalUrl, // Original
        `${baseUrl}/api/images/products/${filename}`, // New API route
        `${baseUrl}/storage/products/${filename}`, // Direct storage
        `${baseUrl}/products/${filename}`, // Public products folder
        `http://127.0.0.1:8000/api/images/products/${filename}`, // Localhost API
        `http://192.168.1.4:8000/api/images/products/${filename}`, // Network API
        `http://127.0.0.1:8000/storage/products/${filename}`, // Localhost storage
        `http://192.168.1.4:8000/storage/products/${filename}`, // Network storage
      ];

      // Remove duplicates
      return [...new Set(alternatives)];
    } catch (error) {
      return [originalUrl];
    }
  };

  const testImageUrl = async (product: ProductDebugInfo) => {
    console.log("\n=================================");
    console.log(
      `🔍 [ImageTest] Testing product ID: ${product.id} - ${product.name}`,
    );
    console.log("=================================");

    if (!product.image) {
      console.log(
        `❌ [ImageTest] No image URL provided for product ${product.id}`,
      );
      setImageTestResults((prev) => ({
        ...prev,
        [product.id]: {
          exists: false,
          error: "No image URL provided",
          url: null,
        },
      }));
      return;
    }

    setTestingImage(product.id);

    try {
      console.log(`📸 [ImageTest] Original Image URL:`, product.image);
      console.log(`📸 [ImageTest] Image Exists Flag:`, product.image_exists);

      // Generate alternative URLs
      const alternativeUrls = generateAlternativeUrls(product.image);
      console.log(
        `\n🔄 [ImageTest] Generated ${alternativeUrls.length} alternative URLs:`,
      );
      alternativeUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });

      // Test 1: Check if URL is valid format
      const urlTests = {
        isHttp: product.image.startsWith("http"),
        isHttps: product.image.startsWith("https"),
        isFile: product.image.startsWith("file://"),
        isData: product.image.startsWith("data:"),
        hasExtension: /\.[a-zA-Z]{3,4}$/.test(product.image.split("?")[0]),
        includesStorage: product.image.includes("/storage/"),
      };

      console.log(`\n📋 [ImageTest] URL Format Tests:`);
      Object.entries(urlTests).forEach(([key, value]) => {
        console.log(`   ${key}: ${value ? "✓" : "✗"}`);
      });

      // Test all URLs to find a working one
      console.log(`\n🌐 [ImageTest] Testing all possible URLs...`);
      let workingUrl = null;
      const urlResults = [];

      for (const url of alternativeUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const result = {
            url,
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get("content-type"),
          };

          urlResults.push(result);

          if (response.ok) {
            console.log(`   ✅ ${url} - ${response.status} OK`);
            workingUrl = url;
            break;
          } else {
            console.log(
              `   ❌ ${url} - ${response.status} ${response.statusText}`,
            );
          }
        } catch (error: any) {
          console.log(`   ❌ ${url} - Error: ${error.message}`);
          urlResults.push({
            url,
            error: error.message,
            ok: false,
          });
        }
      }

      if (workingUrl) {
        console.log(`\n✨ [ImageTest] Found working URL: ${workingUrl}`);
        setWorkingUrls((prev) => ({ ...prev, [product.id]: workingUrl }));
      } else {
        console.log(
          `\n💔 [ImageTest] No working URL found for product ${product.id}`,
        );
      }

      // Test 2: Try to fetch image headers for original URL
      console.log(`\n🌐 [ImageTest] Testing original URL HTTP HEAD request...`);
      let headerTest = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(product.image, {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        headerTest = {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get("content-type"),
          contentLength: response.headers.get("content-length"),
        };

        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   OK: ${response.ok}`);
        console.log(`   Content-Type: ${response.headers.get("content-type")}`);
        console.log(
          `   Content-Length: ${response.headers.get("content-length")}`,
        );
      } catch (headerError: any) {
        headerTest = {
          error: headerError.message,
        };
        console.log(`   ❌ Error: ${headerError.message}`);
      }

      // Test 3: Try to load image in native
      console.log(`\n📁 [ImageTest] Testing file system access...`);
      let nativeTest = null;
      try {
        if (product.image.startsWith("file://")) {
          console.log(`   Local file detected: ${product.image}`);
          const fileInfo = await FileSystem.getInfoAsync(product.image);
          nativeTest = {
            exists: fileInfo.exists,
            size: fileInfo.exists ? fileInfo.size : null,
            isDirectory: fileInfo.isDirectory,
          };
          console.log(`   File exists: ${fileInfo.exists}`);
          if (fileInfo.exists) {
            console.log(`   File size: ${fileInfo.size} bytes`);
          }
        } else if (product.image.startsWith("http")) {
          console.log(`   Remote URL detected, checking server...`);
          // Extract base URL
          const baseUrl = product.image.split("/").slice(0, 3).join("/");
          try {
            const serverTest = await fetch(baseUrl, { method: "HEAD" });
            console.log(`   Server reachable: ${serverTest.ok}`);
          } catch (e: any) {
            console.log(`   Server unreachable: ${e.message}`);
          }
        }
      } catch (nativeError: any) {
        nativeTest = {
          error: nativeError.message,
        };
        console.log(`   ❌ Error: ${nativeError.message}`);
      }

      // Test 4: Parse URL components
      console.log(`\n🔧 [ImageTest] URL Analysis:`);
      try {
        const url = new URL(product.image);
        console.log(`   Protocol: ${url.protocol}`);
        console.log(`   Hostname: ${url.hostname}`);
        console.log(`   Port: ${url.port || "default"}`);
        console.log(`   Pathname: ${url.pathname}`);
        console.log(`   Filename: ${url.pathname.split("/").pop()}`);
      } catch (e: any) {
        console.log(`   Invalid URL format: ${e.message}`);
      }

      // Test 5: Check storage path
      if (product.image.includes("/storage/")) {
        const storagePath = product.image.split("/storage/")[1];
        console.log(`\n📂 [ImageTest] Storage path:`, storagePath);
      }

      const results = {
        url: product.image,
        urlTests,
        headerTest,
        nativeTest,
        alternativeUrls,
        urlResults,
        workingUrl,
        timestamp: new Date().toISOString(),
      };

      setImageTestResults((prev) => ({
        ...prev,
        [product.id]: results,
      }));

      // Summary
      console.log(`\n📊 [ImageTest] Test Summary for product ${product.id}:`);
      console.log(
        `   URL Valid: ${urlTests.isHttp || urlTests.isHttps ? "✓" : "✗"}`,
      );
      console.log(`   Has Extension: ${urlTests.hasExtension ? "✓" : "✗"}`);
      console.log(`   Original URL Status: ${headerTest?.status || "Failed"}`);
      console.log(`   Working URL Found: ${workingUrl ? "✓" : "✗"}`);
      if (workingUrl) {
        console.log(`   Working URL: ${workingUrl}`);
      }
      console.log("=================================\n");

      if (workingUrl) {
        Alert.alert(
          "✅ Working URL Found",
          `A working URL has been found for this image. The app should now display it correctly.`,
          [{ text: "OK" }],
        );
      }
    } catch (error: any) {
      console.log(`\n❌ [ImageTest] Fatal error:`, error.message);
      setImageTestResults((prev) => ({
        ...prev,
        [product.id]: {
          url: product.image,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      }));
    } finally {
      setTestingImage(null);
    }
  };

  const testAllImages = async () => {
    console.log("\n🚀 [ImageTest] Starting batch test of all products");
    console.log(`Total products to test: ${products.length}`);

    Alert.alert(
      "Test All Images",
      `This will test ${products.length} product images. Check console for detailed logs. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Test",
          onPress: async () => {
            for (const product of products) {
              await testImageUrl(product as ProductDebugInfo);
            }
            console.log("✅ [ImageTest] Batch test completed");

            // Summary statistics
            const withImages = products.filter((p) => p.image_exists).length;
            const withUrls = products.filter((p) => p.image).length;
            const tested = Object.keys(imageTestResults).length;
            const workingCount = Object.keys(workingUrls).length;

            console.log("\n📊 [ImageTest] Final Statistics:");
            console.log(`   Total Products: ${products.length}`);
            console.log(`   Products with image_exists=true: ${withImages}`);
            console.log(`   Products with image URLs: ${withUrls}`);
            console.log(`   Products tested: ${tested}`);
            console.log(`   Products with working URLs: ${workingCount}`);

            Alert.alert(
              "Test Complete",
              `Found working URLs for ${workingCount} out of ${tested} products with images. Check console for details.`,
              [{ text: "OK" }],
            );
          },
        },
      ],
    );
  };

  const clearCacheAndRefresh = async () => {
    console.log("🧹 [ProductDataTest] Clearing cache and refreshing...");
    await clearCache();
    await loadProducts();
    setImageTestResults({});
    setWorkingUrls({});
    console.log("✅ [ProductDataTest] Cache cleared and data refreshed");
    Alert.alert("Success", "Cache cleared and data refreshed");
  };

  const logProductDetails = (product: ProductDebugInfo) => {
    console.log("\n📋 [ProductDataTest] Product Details:");
    console.log(`   ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Image URL: ${product.image || "null"}`);
    console.log(`   Image Exists Flag: ${product.image_exists}`);
    console.log(`   Category: ${product.category_name || "none"}`);
    console.log(`   Stock: ${product.stock_quantity}`);
    console.log(`   Price: ₱${product.price}`);
  };

  const getStatusStyle = (status: string) => {
    const statusStyle = statusColors[status.toLowerCase()];
    return statusStyle ? statusStyle.color : "#666";
  };

  const getImageSource = (product: ProductDebugInfo) => {
    // Use working URL if found, otherwise use original
    const url = workingUrls[product.id] || product.image;
    return url ? { uri: url } : null;
  };

  const renderProductDetails = (product: ProductDebugInfo) => {
    logProductDetails(product);

    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{product.name}</Text>
          <TouchableOpacity onPress={() => setSelectedProduct(null)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.detailScroll}>
          {/* Basic Info */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID:</Text>
              <Text style={styles.detailValue}>{product.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Barcode:</Text>
              <Text style={styles.detailValue}>{product.barcode}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>₱{product.price}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text style={styles.detailValue}>{product.stock_quantity}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Low Stock Threshold:</Text>
              <Text style={styles.detailValue}>
                {product.low_stock_threshold}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: getStatusStyle(product.status) },
                ]}
              >
                {product.status}
              </Text>
            </View>
          </View>

          {/* Image Information */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Image Information</Text>

            {/* Image Preview - Try working URL first */}
            <View style={styles.imagePreviewContainer}>
              {workingUrls[product.id] ? (
                <View>
                  <Image
                    source={{ uri: workingUrls[product.id] }}
                    style={styles.largeImagePreview}
                    onError={(e) =>
                      console.log(
                        "Working URL also failed:",
                        e.nativeEvent.error,
                      )
                    }
                  />
                  <Text style={styles.workingUrlBadge}>✅ Working URL</Text>
                </View>
              ) : product.image ? (
                <Image
                  source={{ uri: product.image }}
                  style={styles.largeImagePreview}
                  onError={(e) =>
                    console.log("Image load error:", e.nativeEvent.error)
                  }
                />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#ccc" />
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Original URL:</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {product.image || "null"}
              </Text>
            </View>

            {workingUrls[product.id] && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Working URL:</Text>
                <Text
                  style={[styles.detailValue, styles.trueValue]}
                  numberOfLines={2}
                >
                  {workingUrls[product.id]}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Image Exists:</Text>
              <Text
                style={[
                  styles.detailValue,
                  product.image_exists ? styles.trueValue : styles.falseValue,
                ]}
              >
                {product.image_exists ? "true" : "false"}
              </Text>
            </View>

            {/* Test Results */}
            {imageTestResults[product.id] && (
              <View style={styles.testResults}>
                <Text style={styles.sectionTitle}>Image Test Results</Text>
                <Text style={styles.timestamp}>
                  Tested:{" "}
                  {new Date(
                    imageTestResults[product.id].timestamp,
                  ).toLocaleString()}
                </Text>

                {imageTestResults[product.id].error ? (
                  <Text style={styles.errorText}>
                    Error: {imageTestResults[product.id].error}
                  </Text>
                ) : (
                  <>
                    {/* URL Tests */}
                    <Text style={styles.subsectionTitle}>URL Format:</Text>
                    {Object.entries(
                      imageTestResults[product.id].urlTests || {},
                    ).map(([key, value]) => (
                      <View key={key} style={styles.testRow}>
                        <Text style={styles.testLabel}>{key}:</Text>
                        <Text
                          style={[
                            styles.testValue,
                            value ? styles.trueValue : styles.falseValue,
                          ]}
                        >
                          {value ? "✓" : "✗"}
                        </Text>
                      </View>
                    ))}

                    {/* Working URL */}
                    {imageTestResults[product.id].workingUrl && (
                      <>
                        <Text style={styles.subsectionTitle}>
                          ✅ Working URL Found:
                        </Text>
                        <Text style={styles.workingUrl} numberOfLines={2}>
                          {imageTestResults[product.id].workingUrl}
                        </Text>
                      </>
                    )}

                    {/* Header Test */}
                    {imageTestResults[product.id].headerTest && (
                      <>
                        <Text style={styles.subsectionTitle}>
                          Original URL Headers:
                        </Text>
                        {Object.entries(
                          imageTestResults[product.id].headerTest,
                        ).map(([key, value]) => (
                          <View key={key} style={styles.testRow}>
                            <Text style={styles.testLabel}>{key}:</Text>
                            <Text style={styles.testValue}>
                              {String(value)}
                            </Text>
                          </View>
                        ))}
                      </>
                    )}
                  </>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.testButton}
              onPress={() => testImageUrl(product)}
              disabled={testingImage === product.id}
            >
              {testingImage === product.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.testButtonText}>
                  {workingUrls[product.id]
                    ? "Re-test Image URL"
                    : "Test Image URL"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Category Information */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Category Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category ID:</Text>
              <Text style={styles.detailValue}>
                {product.category_id || "null"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category Name:</Text>
              <Text style={styles.detailValue}>
                {product.category_name || "null"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Categories Array:</Text>
              <Text style={styles.detailValue}>
                {JSON.stringify(product.categories)}
              </Text>
            </View>
          </View>

          {/* Timestamps */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Timestamps</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>
                {new Date(product.created_at).toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Updated:</Text>
              <Text style={styles.detailValue}>
                {new Date(product.updated_at).toLocaleString()}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (selectedProduct) {
    return renderProductDetails(selectedProduct);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Product Data Test</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={testAllImages} style={styles.headerButton}>
            <Ionicons name="scan-outline" size={20} color="#ED277C" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={clearCacheAndRefresh}
            style={styles.headerButton}
          >
            <Ionicons name="refresh" size={20} color="#ED277C" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.stats}>
        Total Products: {products.length} | With Images:{" "}
        {products.filter((p) => p.image_exists).length} | With URLs:{" "}
        {products.filter((p) => p.image).length} | Working:{" "}
        {Object.keys(workingUrls).length}
      </Text>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#ED277C" />
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => setSelectedProduct(product as ProductDebugInfo)}
              onLongPress={() => {
                console.log(`\n📱 Long press on product ${product.id}`);
                testImageUrl(product as ProductDebugInfo);
              }}
              delayLongPress={500}
            >
              <View style={styles.productCardContent}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productId}>ID: {product.id}</Text>
                  <Text style={styles.productPrice}>₱{product.price}</Text>
                  {workingUrls[product.id] && (
                    <Text style={styles.workingBadge}>✅ Working</Text>
                  )}
                </View>

                <View style={styles.imageStatus}>
                  {getImageSource(product as ProductDebugInfo) ? (
                    <Image
                      source={getImageSource(product as ProductDebugInfo)!}
                      style={styles.thumbnail}
                      onError={() => {}} // Silent fail
                    />
                  ) : (
                    <View style={styles.noImageThumb}>
                      <Ionicons name="image-outline" size={24} color="#ccc" />
                    </View>
                  )}

                  {imageTestResults[product.id] && (
                    <View
                      style={[
                        styles.statusDot,
                        imageTestResults[product.id].error
                          ? styles.statusError
                          : styles.statusSuccess,
                      ]}
                    />
                  )}
                </View>
              </View>

              <View style={styles.productFooter}>
                <Text style={styles.imageUrl} numberOfLines={1}>
                  {workingUrls[product.id] || product.image || "No image URL"}
                </Text>
                <Text
                  style={[
                    styles.imageExists,
                    product.image_exists ? styles.trueValue : styles.falseValue,
                  ]}
                >
                  exists: {product.image_exists ? "true" : "false"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  stats: {
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 12,
    color: "#666",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
    padding: 12,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  productId: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    color: "#ED277C",
    fontWeight: "600",
    marginTop: 4,
  },
  workingBadge: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 2,
  },
  imageStatus: {
    alignItems: "center",
    position: "relative",
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  noImageThumb: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  statusDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  statusSuccess: {
    backgroundColor: "#4CAF50",
  },
  statusError: {
    backgroundColor: "#F44336",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  imageUrl: {
    flex: 1,
    fontSize: 10,
    color: "#999",
  },
  imageExists: {
    fontSize: 10,
    marginLeft: 8,
  },
  trueValue: {
    color: "#4CAF50",
  },
  falseValue: {
    color: "#F44336",
  },
  workingUrl: {
    color: "#4CAF50",
    fontSize: 12,
    marginVertical: 4,
    padding: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 4,
  },
  workingUrlBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#4CAF50",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: "600",
  },

  // Detail view styles
  detailContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  detailScroll: {
    flex: 1,
  },
  detailSection: {
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
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginTop: 8,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    width: 120,
    fontSize: 13,
    color: "#999",
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  largeImagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  noImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  testResults: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  timestamp: {
    fontSize: 10,
    color: "#999",
    marginBottom: 8,
  },
  testRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  testLabel: {
    width: 100,
    fontSize: 11,
    color: "#666",
  },
  testValue: {
    flex: 1,
    fontSize: 11,
    color: "#333",
  },
  testButton: {
    backgroundColor: "#ED277C",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  testButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 4,
  },
});
