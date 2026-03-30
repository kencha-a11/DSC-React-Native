// app/(manager)/account/[id]/permissions.tsx
import DscToast from "@/components/common/DscToast";
import FooterButton, {
  FooterButtonItem,
} from "@/components/layout/FooterButton";
import Header from "@/components/layout/Header";
import { permissionService } from "@/services/permissionService";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UIPermissions {
  viewInventory: boolean;
  addItems: boolean;
  editItems: boolean;
  restockItems: boolean;
  deductItems: boolean;
  removeItems: boolean;
  createCategory: boolean;
  removeCategory: boolean;
}

type PermKey = keyof UIPermissions;

const PERMISSION_ITEMS: { key: PermKey; label: string; description: string }[] =
  [
    {
      key: "viewInventory",
      label: "View Inventory",
      description: "Can view inventory items and stock levels",
    },
    {
      key: "addItems",
      label: "Add Items",
      description: "Can add new items to inventory",
    },
    {
      key: "editItems",
      label: "Edit Items",
      description: "Can edit existing item details",
    },
    {
      key: "restockItems",
      label: "Restock Items",
      description: "Can add stock to existing items",
    },
    {
      key: "deductItems",
      label: "Deduct Items",
      description: "Can deduct stock from items",
    },
    {
      key: "removeItems",
      label: "Remove Items",
      description: "Can remove items from inventory",
    },
    {
      key: "createCategory",
      label: "Create Categories",
      description: "Can create new categories",
    },
    {
      key: "removeCategory",
      label: "Remove Categories",
      description: "Can remove existing categories",
    },
  ];

// Permissions that depend on viewInventory
const DEPENDENT_PERMISSIONS: PermKey[] = [
  "addItems",
  "editItems",
  "restockItems",
  "deductItems",
  "removeItems",
  "createCategory",
  "removeCategory",
];

const DEFAULT: UIPermissions = {
  viewInventory: false,
  addItems: false,
  editItems: false,
  restockItems: false,
  deductItems: false,
  removeItems: false,
  createCategory: false,
  removeCategory: false,
};

// API key ↔ UI key mapping
interface ApiPermissions {
  view_inventory: boolean;
  add_item: boolean;
  edit_items: boolean;
  restock_items: boolean;
  deduct_items: boolean;
  remove_items: boolean;
  create_categories: boolean;
  remove_categories: boolean;
}

const fromApi = (api: ApiPermissions): UIPermissions => ({
  viewInventory: api.view_inventory,
  addItems: api.add_item,
  editItems: api.edit_items,
  restockItems: api.restock_items,
  deductItems: api.deduct_items,
  removeItems: api.remove_items,
  createCategory: api.create_categories,
  removeCategory: api.remove_categories,
});

const toApi = (ui: UIPermissions) => ({
  view_inventory: ui.viewInventory,
  add_item: ui.addItems,
  edit_items: ui.editItems,
  restock_items: ui.restockItems,
  deduct_items: ui.deductItems,
  remove_items: ui.removeItems,
  create_categories: ui.createCategory,
  remove_categories: ui.removeCategory,
});

export default function PermissionAccountScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [accountName, setAccountName] = useState(
    params.name || params.first_name || "User",
  );
  const [permissions, setPermissions] = useState<UIPermissions>(DEFAULT);
  const [initialPermissions, setInitialPermissions] =
    useState<UIPermissions>(DEFAULT);

  // Validate that we have an ID
  if (!params.id) {
    Alert.alert("Error", "No user ID provided", [
      { text: "OK", onPress: () => router.back() },
    ]);
    return null;
  }

  const userId = parseInt(params.id, 10);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Name is already available from params
      if (params.name) setAccountName(params.name);

      setLoading(true);
      permissionService
        .getUserPermissions(userId)
        .then((perms) => {
          const loadedPerms = perms
            ? fromApi(perms as ApiPermissions)
            : DEFAULT;
          console.log("Loaded permissions:", loadedPerms);
          setPermissions(loadedPerms);
          setInitialPermissions(loadedPerms);
        })
        .catch((error) => {
          console.error("Failed to load permissions, using defaults:", error);
          setPermissions(DEFAULT);
          setInitialPermissions(DEFAULT);
        })
        .finally(() => setLoading(false));
    }, [userId, params.name]),
  );

  const handleSave = async () => {
    if (!userId) {
      Alert.alert("Error", "Invalid user ID");
      return;
    }

    setSaving(true);
    try {
      await permissionService.updateUserPermissions(userId, toApi(permissions));
      setInitialPermissions(permissions); // Update initial after save
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        router.back();
      }, 2000);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: PermKey) => {
    setPermissions((prev) => {
      let newState = { ...prev, [key]: !prev[key] };

      // If turning off viewInventory, turn off all dependent permissions
      if (key === "viewInventory" && prev.viewInventory === true) {
        // Turning OFF viewInventory
        DEPENDENT_PERMISSIONS.forEach(depKey => {
          newState[depKey] = false;
        });
      }
      
      // If turning on any dependent permission, ensure viewInventory is on
      if (key !== "viewInventory" && newState[key] === true && !newState.viewInventory) {
        // Auto-enable viewInventory when a dependent permission is enabled
        newState.viewInventory = true;
      }

      console.log(`Toggle ${key}:`, newState[key]);
      return newState;
    });
  };

  const setAll = (val: boolean) => {
    const newPermissions = Object.keys(DEFAULT).reduce((acc, key) => {
      const permKey = key as PermKey;
      if (val === false) {
        // If setting all to false, everything becomes false
        acc[permKey] = false;
      } else {
        // If setting all to true, set viewInventory to true and all others to true
        acc[permKey] = true;
      }
      return acc;
    }, {} as UIPermissions);
    
    console.log("Set all to:", val);
    setPermissions(newPermissions);
  };

  const enabledCount = Object.values(permissions).filter(Boolean).length;

  const hasChanges = Object.keys(permissions).some(
    (key) => permissions[key as PermKey] !== initialPermissions[key as PermKey],
  );

  console.log("hasChanges:", hasChanges);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#ED277C" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Permissions" onBackPress={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account card */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{accountName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.accountName}>{accountName}</Text>
            <Text style={styles.accountId}>Account ID: #{userId}</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {[
            {
              label: "Select All",
              icon: "checkmark-done" as const,
              onPress: () => setAll(true),
              color: "#ED277C",
            },
            {
              label: "Clear All",
              icon: "close" as const,
              onPress: () => setAll(false),
              color: "#666",
            },
          ].map(({ label, icon, onPress, color }) => (
            <TouchableOpacity
              key={label}
              style={styles.quickAction}
              onPress={onPress}
              disabled={saving}
            >
              <Ionicons name={icon} size={18} color={color} />
              <Text style={styles.quickActionText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.permissionsContainer}>
          {PERMISSION_ITEMS.map(({ key, label, description }) => {
            // Check if this permission should be disabled
            const isDisabled = 
              saving || 
              (key !== "viewInventory" && !permissions.viewInventory && !permissions[key]);

            return (
              <View key={key} style={styles.permissionItem}>
                <View style={styles.permissionInfo}>
                  <Text style={[
                    styles.permissionLabel,
                    (!permissions.viewInventory && key !== "viewInventory" && !permissions[key]) && styles.disabledText
                  ]}>
                    {label}
                  </Text>
                  <Text style={[
                    styles.permissionDescription,
                    (!permissions.viewInventory && key !== "viewInventory" && !permissions[key]) && styles.disabledText
                  ]}>
                    {description}
                  </Text>
                  {key !== "viewInventory" && !permissions.viewInventory && permissions[key] && (
                    <Text style={styles.dependencyHint}>
                      Requires View Inventory
                    </Text>
                  )}
                </View>
                <Switch
                  trackColor={{ false: "#E6E6E6", true: "#ED277C" }}
                  thumbColor={permissions[key] ? "#fff" : "#fff"}
                  ios_backgroundColor="#E6E6E6"
                  onValueChange={() => toggle(key)}
                  value={permissions[key]}
                  disabled={isDisabled}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {enabledCount} of {PERMISSION_ITEMS.length} permissions enabled
          </Text>
          {hasChanges && (
            <Text style={styles.unsavedText}>You have unsaved changes</Text>
          )}
        </View>
      </ScrollView>

      <FooterButton>
        <FooterButtonItem
          title="Cancel"
          type="secondary"
          onPress={() => router.back()}
        />
        <FooterButtonItem
          title="Save Permissions"
          type="primary"
          onPress={handleSave}
          disabled={!hasChanges || saving}
        />
      </FooterButton>

      <View style={styles.toastContainer} pointerEvents="none">
        <DscToast
          visible={toastVisible}
          message="Permissions updated successfully!"
          type="success"
          onClose={() => setToastVisible(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120, marginTop:20},
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ED277C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  accountName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  accountId: { fontSize: 13, color: "#666" },
  quickActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginBottom: 20,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  quickActionText: { fontSize: 14, color: "#333" },
  permissionsContainer: { marginBottom: 20 },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  permissionInfo: { flex: 1, marginRight: 15 },
  permissionLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 3,
  },
  permissionDescription: { fontSize: 12, color: "#999" },
  disabledText: {
    color: "#ccc",
  },
  dependencyHint: {
    fontSize: 11,
    color: "#ED277C",
    marginTop: 2,
    fontStyle: "italic",
  },
  summaryContainer: {
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
  },
  summaryText: { fontSize: 14, color: "#666", fontWeight: "500" },
  unsavedText: {
    fontSize: 12,
    color: "#ED277C",
    marginTop: 8,
    fontStyle: "italic",
  },
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 9999,
  },
});