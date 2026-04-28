// app/(manager)/account/[id]/index.tsx
import DscToast from "@/components/common/DscToast";
import Header from "@/components/layout/Header";
import InventoryLog from "@/components/records/InventoryLog";
import SaleLog from "@/components/records/SaleLog";
import TimeLog from "@/components/records/TimeLog";
import { accountService } from "@/services/accountService";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";

const capitalize = (s: string) => {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

// ✅ Add date formatter helper
const formatDate = (dateString?: string) => {
  if (!dateString) return "Unknown";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return "Unknown";
  }
};

// Role badge styles
const ROLE_STYLES = {
  superadmin: { bg: "#FFEBEE", color: "#C62828" },
  manager: { bg: "#F3E5F5", color: "#7B1FA2" },
  cashier: { bg: "#E3F2FD", color: "#1976D2" },
  default: { bg: "#f0f0f0", color: "#666" },
};

type LogViewType = 'sales' | 'inventory' | 'time';

export default function AccountProfileScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    joinDate: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    account_status?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logViewType, setLogViewType] = useState<LogViewType>('sales');

  // Initialize with params data immediately
  const [account, setAccount] = useState({
    id: params.id ? parseInt(params.id) : 0,
    name: params.name || "Unknown User",
    firstName: params.first_name || params.name?.split(" ")[0] || "",
    lastName:
      params.last_name || params.name?.split(" ").slice(1).join(" ") || "",
    email: params.email || "No email provided",
    phone: params.phone || params.phone_number || "No phone number",
    phoneNumber: params.phone_number || params.phone || "",
    role: params.role || "Unknown Role",
    status: params.status || params.account_status || "Unknown",
    joinDate: params.joinDate || "Unknown",
  });

  // Show toast helper
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  // Fetch fresh data in background when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!params.id) {
        setError("No account ID provided");
        return;
      }

      const accountId = Number(params.id);

      setLoading(true);

      accountService
        .getAccount(accountId)
        .then((data) => {
          if (!data) {
            setError("Account not found");
            return;
          }

          setAccount({
            id: data.id,
            name: data.name || account.name,
            firstName: data.first_name || account.firstName,
            lastName: data.last_name || account.lastName,
            email: data.email || account.email,
            phone: data.phone_number || account.phone,
            phoneNumber: data.phone_number || account.phoneNumber,
            role: data.role || account.role,
            status: data.account_status || account.status,
            joinDate: data.created_at || account.joinDate, // ✅ Use created_at from API
          });
          setError(null);
        })
        .catch((error) => {
          console.error("Failed to fetch account data:", error);
          showToast("Failed to refresh account data", "error");
        })
        .finally(() => setLoading(false));
    }, [params.id]),
  );

  const safeRole = account?.role?.toLowerCase?.() || "default";
  const roleStyle =
    ROLE_STYLES[safeRole as keyof typeof ROLE_STYLES] || ROLE_STYLES.default;

  const safeStatus = account?.status?.toLowerCase?.() || "";
  const isActive = safeStatus === "activated";

  const handleEditPress = () => {
    if (!account.id || account.id === 0) {
      showToast("Account ID not found", "error");
      return;
    }

    router.push({
      pathname: "/(manager)/account/[id]/edit",
      params: {
        id: account.id.toString(),
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phoneNumber: account.phoneNumber,
        status: account.status,
        role: account.role,
      },
    });
  };

  const handlePermissionsPress = () => {
    if (!account.id || account.id === 0) {
      showToast("Account ID not found", "error");
      return;
    }

    router.push({
      pathname: "/(manager)/account/[id]/permissions",
      params: {
        id: account.id.toString(),
        name: account.name,
        first_name: account.firstName,
        last_name: account.lastName,
      },
    });
  };

  const openLogView = (type: LogViewType) => {
    if (!account.id || account.id === 0) {
      showToast("Account ID not found", "error");
      return;
    }
    setLogViewType(type);
    setLogModalVisible(true);
  };

  if (error && !account.id) {
    return (
      <View style={styles.container}>
        <Header title="Profile Account" onBackPress={() => router.back()} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#C62828" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              accountService  
                .getAccount(Number(params.id))
                .then((data) => {
                  if (data) {
                    setAccount({
                      id: data.id,
                      name: data.name,
                      firstName: data.first_name,
                      lastName: data.last_name,
                      email: data.email,
                      phone: data.phone_number,
                      phoneNumber: data.phone_number,
                      role: data.role,
                      status: data.account_status,
                      joinDate: data.created_at || account.joinDate,
                    });
                  }
                })
                .catch(() => setError("Failed to load account data"))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Profile Account" onBackPress={() => router.back()} />

      <DscToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
        showCloseButton={true}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {account.name?.charAt(0)?.toUpperCase?.() || "?"}
            </Text>
          </View>
          <Text style={styles.name}>{account.name || "Unknown User"}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleStyle.color }]}>
              {capitalize(account.role) || "Unknown Role"}
            </Text>
          </View>
          {loading && <Text style={styles.refreshing}>Refreshing...</Text>}
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          {[
            { label: "Email", value: account.email },
            { label: "Phone", value: account.phone },
            {
              label: "Status",
              value: capitalize(account.status) || "Unknown",
              badge: true,
            },
            { label: "Member Since", value: formatDate(account.joinDate) }, // ✅ Format the date
          ].map(({ label, value, badge }) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              {badge ? (
                <Text
                  style={[
                    styles.statusBadge,
                    isActive ? styles.activeStatus : styles.inactiveStatus,
                  ]}
                >
                  {value}
                </Text>
              ) : (
                <Text style={styles.infoValue}>{value || "N/A"}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Ionicons name="pencil" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionsButton}
            onPress={handlePermissionsPress}
          >
            <Ionicons name="shield-checkmark" size={20} color="#ED277C" />
            <Text style={styles.permissionsButtonText}>Permissions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logButton}
            onPress={() => openLogView('sales')}
          >
            <Ionicons name="document-text" size={20} color="#ED277C" />
            <Text style={styles.logButtonText}>View sales log</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logButton}
            onPress={() => openLogView('inventory')}
          >
            <Ionicons name="cube" size={20} color="#ED277C" />
            <Text style={styles.logButtonText}>View inventory log</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logButton}
            onPress={() => openLogView('time')}
          >
            <Ionicons name="time" size={20} color="#ED277C" />
            <Text style={styles.logButtonText}>View time logs</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" style={styles.chevron} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Log Viewer Modal */}
      <Modal
        visible={logModalVisible}
        animationType="slide"
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setLogModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {logViewType === 'sales' ? 'Sales Logs' :
                logViewType === 'inventory' ? 'Inventory Logs' : 'Time Logs'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          {logViewType === 'sales' && <SaleLog userId={account.id} />}
          {logViewType === 'inventory' && <InventoryLog userId={account.id} />}
          {logViewType === 'time' && <TimeLog userId={account.id} />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingBottom: 40 },
  content: { padding: 20 },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#C62828",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#ED277C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  refreshing: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    fontStyle: "italic",
  },
  profileHeader: { alignItems: "center", marginBottom: 30 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ED277C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "bold" },
  name: { fontSize: 24, fontWeight: "bold", color: "#000", marginBottom: 8 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  roleBadgeText: { fontSize: 14, fontWeight: "600" },
  section: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ED277C",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: { fontSize: 14, color: "#666", flex: 1 },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
    overflow: "hidden",
  },
  activeStatus: { backgroundColor: "#E8F5E9", color: "#34C759" },
  inactiveStatus: { backgroundColor: "#FFE5E5", color: "#FF3B30" },
  actions: { gap: 12 },
  editButton: {
    backgroundColor: "#ED277C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  permissionsButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ED277C",
    gap: 8,
  },
  permissionsButtonText: { color: "#ED277C", fontSize: 16, fontWeight: "600" },
  logButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  logButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginLeft: 8,
  },
  chevron: { marginLeft: "auto" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ED277C",
  },
});