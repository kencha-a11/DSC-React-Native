import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useCategories } from "@/context/CategoryContext";

type LogEntry = {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error";
};

export default function CategoryContextTest() {
  const {
    categories,
    loading,
    error,
    fetchCategories,
    refreshCategories,
    fetchCategoryById,
    fetchCategoryProducts,
    getCategoryById,
    getCategoryNameById,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteMultipleCategories,
    onCategoriesChanged,
    updateCategoryCount,
  } = useCategories();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [multipleIds, setMultipleIds] = useState("");
  const [listenerId] = useState(() => Math.random().toString(36));
  const [fetchResult, setFetchResult] = useState<any>(null);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [{ timestamp, message, type }, ...prev.slice(0, 99)]);
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  };

  const clearLogs = () => setLogs([]);

  // Register category change listener
  useEffect(() => {
    const unsubscribe = onCategoriesChanged(() => {
      addLog("📢 onCategoriesChanged triggered – categories updated", "info");
    });
    return unsubscribe;
  }, [onCategoriesChanged]);

  // Helper to wrap async calls with logging and optional refresh after mutation
  const wrap = async (fn: () => Promise<any>, name: string, refreshAfter = false) => {
    addLog(`${name} started...`);
    try {
      const result = await fn();
      addLog(`${name} succeeded: ${JSON.stringify(result).slice(0, 200)}`, "success");
      if (refreshAfter) {
        await refreshCategories();
        addLog(`Refreshed categories after ${name}`, "info");
      }
      return result;
    } catch (err: any) {
      addLog(`${name} failed: ${err.message || err}`, "error");
      throw err;
    }
  };

  // ─── API calls ──────────────────────────────────────────────────────────
  const testFetchCategories = () => wrap(() => fetchCategories(), "fetchCategories");
  const testRefreshCategories = () => wrap(() => refreshCategories(), "refreshCategories");

  const testFetchCategoryById = () => {
    const id = parseInt(categoryId);
    if (isNaN(id)) {
      Alert.alert("Error", "Enter a valid category ID");
      return;
    }
    wrap(() => fetchCategoryById(id), `fetchCategoryById(${id})`);
  };

  const testFetchCategoryProducts = () => {
    const id = parseInt(categoryId);
    if (isNaN(id)) {
      Alert.alert("Error", "Enter a valid category ID");
      return;
    }
    wrap(() => fetchCategoryProducts(id, 1, 10), `fetchCategoryProducts(${id})`);
  };

  const testAddCategory = () => {
    if (!categoryName.trim()) {
      Alert.alert("Error", "Enter category name");
      return;
    }
    wrap(() => addCategory(categoryName), `addCategory("${categoryName}")`, true).then(() => {
      setCategoryName("");
    });
  };

  const testUpdateCategory = () => {
    const id = parseInt(categoryId);
    if (isNaN(id) || !categoryName.trim()) {
      Alert.alert("Error", "Enter category ID and new name");
      return;
    }
    wrap(() => updateCategory(id, categoryName), `updateCategory(${id}, "${categoryName}")`, true).then(() => {
      setCategoryId("");
      setCategoryName("");
    });
  };

  const testDeleteCategory = () => {
    const id = parseInt(categoryId);
    if (isNaN(id)) {
      Alert.alert("Error", "Enter category ID");
      return;
    }
    Alert.alert("Confirm", `Delete category ${id}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          wrap(() => deleteCategory(id), `deleteCategory(${id})`, true).then(() => {
            setCategoryId("");
          }),
      },
    ]);
  };

  const testDeleteMultipleCategories = () => {
    const ids = multipleIds
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    if (ids.length === 0) {
      Alert.alert("Error", "Enter at least one ID (comma separated)");
      return;
    }
    Alert.alert("Confirm", `Delete categories: ${ids.join(", ")}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          wrap(() => deleteMultipleCategories(ids), `deleteMultipleCategories([${ids}])`, true).then(() => {
            setMultipleIds("");
          }),
      },
    ]);
  };

  // Synchronous lookups
  const testGetCategoryById = () => {
    const id = parseInt(categoryId);
    if (isNaN(id)) {
      Alert.alert("Error", "Enter category ID");
      return;
    }
    const cat = getCategoryById(id);
    addLog(`getCategoryById(${id}): ${cat ? cat.category_name : "not found"}`, "info");
  };

  const testGetCategoryNameById = () => {
    const id = parseInt(categoryId);
    if (isNaN(id)) {
      Alert.alert("Error", "Enter category ID");
      return;
    }
    const name = getCategoryNameById(id);
    addLog(`getCategoryNameById(${id}): ${name}`, "info");
  };

  // Manual count adjustment (optimistic) – does not refresh
  const testUpdateCategoryCount = (delta: number) => {
    const id = parseInt(categoryId);
    if (isNaN(id)) {
      Alert.alert("Error", "Enter category ID");
      return;
    }
    updateCategoryCount(id, delta);
    addLog(`updateCategoryCount(${id}, ${delta}) – local count changed (optimistic)`, "success");
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading && categories.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ED277C" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Category Context Test Suite</Text>
      <Text style={styles.error}>{error}</Text>

      {/* Categories List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories ({categories.length})</Text>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.categoryCard}>
            <Text style={styles.categoryName}>{cat.category_name}</Text>
            <Text style={styles.categoryCount}>{cat.product_count ?? 0} products</Text>
          </View>
        ))}
      </View>

      {/* Input Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inputs</Text>
        <TextInput
          style={styles.input}
          placeholder="Category Name"
          value={categoryName}
          onChangeText={setCategoryName}
        />
        <TextInput
          style={styles.input}
          placeholder="Category ID (for update/delete/fetch)"
          value={categoryId}
          onChangeText={setCategoryId}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Multiple IDs (comma separated)"
          value={multipleIds}
          onChangeText={setMultipleIds}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fetch / Refresh</Text>
        <View style={styles.buttonRow}>
          <Button title="Fetch Categories" onPress={testFetchCategories} />
          <Button title="Refresh Categories" onPress={testRefreshCategories} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lookups</Text>
        <View style={styles.buttonRow}>
          <Button title="Fetch Category By ID" onPress={testFetchCategoryById} />
          <Button title="Fetch Category Products" onPress={testFetchCategoryProducts} />
          <Button title="Get Category (sync)" onPress={testGetCategoryById} />
          <Button title="Get Name (sync)" onPress={testGetCategoryNameById} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mutations (auto-refresh after success)</Text>
        <View style={styles.buttonRow}>
          <Button title="Add Category" onPress={testAddCategory} />
          <Button title="Update Category" onPress={testUpdateCategory} />
          <Button title="Delete Category" onPress={testDeleteCategory} />
          <Button title="Delete Multiple" onPress={testDeleteMultipleCategories} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optimistic Count (local only)</Text>
        <View style={styles.buttonRow}>
          <Button title="Count +1" onPress={() => testUpdateCategoryCount(1)} />
          <Button title="Count -1" onPress={() => testUpdateCategoryCount(-1)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
          <Text style={styles.clearButtonText}>Clear Logs</Text>
        </TouchableOpacity>
        <ScrollView style={styles.logsContainer}>
          {logs.map((log, i) => (
            <Text key={i} style={[styles.logText, styles[log.type]]}>
              [{log.timestamp}] {log.message}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const Button = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  error: { color: "red", textAlign: "center", marginBottom: 12 },
  section: { marginBottom: 24, backgroundColor: "#fff", borderRadius: 8, padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  categoryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  categoryName: { fontSize: 14, fontWeight: "500" },
  categoryCount: { fontSize: 12, color: "#ED277C" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
  },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: { backgroundColor: "#ED277C", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  clearButton: { alignSelf: "flex-end", marginBottom: 8, padding: 6, backgroundColor: "#f0f0f0", borderRadius: 6 },
  clearButtonText: { fontSize: 12 },
  logsContainer: { maxHeight: 300, backgroundColor: "#f8f8f8", borderRadius: 6, padding: 8 },
  logText: { fontSize: 10, fontFamily: "monospace", marginVertical: 2 },
  info: { color: "#333" },
  success: { color: "green" },
  error: { color: "red" },
});