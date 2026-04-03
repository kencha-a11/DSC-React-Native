// app/(manager)/account/create/step2.tsx
import DscToast from "@/components/common/DscToast";
import FooterButton, {
  FooterButtonItem,
} from "@/components/layout/FooterButton";
import Header from "@/components/layout/Header";
import { useAccount } from "@/hooks/useAccount";
import { useAuth } from "@/context/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

// Types
interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  status: string;
  role: string;
}

interface Permissions {
  viewInventory: boolean;
  addItems: boolean;
  editItems: boolean;
  restockItems: boolean;
  deductItems: boolean;
  removeItems: boolean;
  createCategory: boolean;
  removeCategory: boolean;
}

type PermissionKey = keyof Permissions;

// Constants
const PERMISSIONS = [
  { key: "viewInventory", label: "View inventory" },
  { key: "addItems", label: "Add items" },
  { key: "editItems", label: "Edit items" },
  { key: "restockItems", label: "Restock items" },
  { key: "deductItems", label: "Deduct items" },
  { key: "removeItems", label: "Remove items" },
  { key: "createCategory", label: "Create category" },
  { key: "removeCategory", label: "Remove category" },
] as const;

const DEFAULT_PERMISSIONS: Permissions = {
  viewInventory: false,
  addItems: false,
  editItems: false,
  restockItems: false,
  deductItems: false,
  removeItems: false,
  createCategory: false,
  removeCategory: false,
};

export default function CreateSecondScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const { user } = useAuth(); // Get current authenticated user
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [toastVisible, setToastVisible] = useState(false);

  const { createAccount, loading, error } = useAccount();

  // Determine if permissions should be shown
  // Only cashier accounts require permission selection (regardless of who creates)
  const shouldShowPermissions = accountData?.role === "cashier";

  // Parse incoming data
  useEffect(() => {
    if (!data) {
      Alert.alert("Error", "No account data found", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }

    try {
      setAccountData(JSON.parse(data));
    } catch {
      Alert.alert("Error", "Invalid account data", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [data]);

  const handleSave = async () => {
    if (!accountData) return;

    // For manager accounts, send default permissions (backend will ignore them)
    const permissionsToSend = shouldShowPermissions ? permissions : DEFAULT_PERMISSIONS;

    const success = await createAccount(accountData, permissionsToSend);
    if (success) {
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        router.replace("/(manager)/(tabs)/accounts");
      }, 2000);
    }
  };

  const togglePermission = (key: PermissionKey) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const enabledCount = Object.values(permissions).filter(Boolean).length;

  // Summary rows
  const summary = accountData
    ? [
        {
          label: "Name",
          value: `${accountData.firstName} ${accountData.lastName}`,
        },
        { label: "Email", value: accountData.email },
        { label: "Phone", value: accountData.phoneNumber },
        { label: "Status", value: accountData.status },
        {
          label: "Role",
          value:
            accountData.role.charAt(0).toUpperCase() +
            accountData.role.slice(1),
        },
      ]
    : [];

  return (
    <View style={styles.container}>
      <Header title="create account" onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepText}>STEP 2 OF 2</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
        </View>

        {/* Account summary */}
        {accountData && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Account Summary</Text>
            {summary.map(({ label, value }) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}:</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Error message */}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Permissions section - only for cashier accounts */}
        {shouldShowPermissions && (
          <>
            <View style={styles.permissions}>
              {PERMISSIONS.map(({ key, label }) => (
                <View key={key} style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>{label}</Text>
                  <Switch
                    trackColor={{ false: "#E6E6E6", true: "#ED277C" }}
                    thumbColor="#fff"
                    onValueChange={() => togglePermission(key)}
                    value={permissions[key]}
                  />
                </View>
              ))}
            </View>

            {/* Summary box */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxText}>
                {enabledCount} of {PERMISSIONS.length} permissions selected
              </Text>
            </View>

            <Text style={styles.note}>
              Permissions are optional. You can set them now or later.
            </Text>
          </>
        )}
      </ScrollView>

      <FooterButton>
        <FooterButtonItem
          title="Back"
          type="secondary"
          onPress={() => router.back()}
        />
        <FooterButtonItem
          title="Save"
          type="primary"
          onPress={handleSave}
          disabled={loading}
        />
      </FooterButton>

      <View style={styles.toast} pointerEvents="none">
        <DscToast
          visible={toastVisible}
          message="Account created successfully!"
          type="success"
          onClose={() => setToastVisible(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { paddingHorizontal: 20, paddingBottom: 120 },

  // Step indicator
  stepContainer: { marginBottom: 30, alignItems: "center" },
  stepText: {
    fontSize: 14,
    color: "#ED277C",
    fontWeight: "600",
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#f0f0f0",
    width: "100%",
    overflow: "hidden",
  },
  progressFill: { height: 4, backgroundColor: "#ED277C" },

  // Summary card
  summary: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ED277C",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryLabel: { fontSize: 14, color: "#666", fontWeight: "500" },
  summaryValue: { fontSize: 14, color: "#333" },

  // Error
  error: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },

  // Section title
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },

  // Permissions
  permissions: { marginBottom: 20 },
  permissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  permissionLabel: { fontSize: 16, color: "#333" },

  // Summary box
  summaryBox: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  summaryBoxText: { fontSize: 14, color: "#666", fontWeight: "500" },

  // Note
  note: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
    fontStyle: "italic",
  },

  // Toast
  toast: {
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