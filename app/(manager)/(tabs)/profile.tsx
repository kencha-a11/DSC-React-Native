import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import Header from "@/components/layout/Header";
import LogoutButton from "@/components/common/LogoutButton";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const insets = useSafeAreaInsets();

  // Match your custom tab bar height (adjust if needed)
  const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 60 : 80;
  const bottomPadding = TAB_BAR_HEIGHT + insets.bottom;

  const enabledPermissions = Object.values(permissions).filter(Boolean).length;
  const totalPermissions = Object.keys(permissions).length;

  const getFullName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return "Cashier User";
  };

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || "";
    const last = user?.last_name?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const role = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Cashier";

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        showBackButton={false}
        backgroundColor="#fff"
        titleColor="#333"
        rightComponent={<View style={styles.placeholder} />}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{getFullName()}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>

        {/* Contact Info Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Ionicons name="mail-outline" size={24} color="#ED277C" />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.email || "No email"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="call-outline" size={24} color="#ED277C" />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.phone_number || "No phone"}
            </Text>
          </View>
        </View>

        {/* Permissions Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#ED277C" />
            <Text style={styles.sectionTitle}>Permissions</Text>
          </View>
          <View style={styles.permissionSummary}>
            <Text style={styles.permissionCount}>
              {enabledPermissions} / {totalPermissions}
            </Text>
            <Text style={styles.permissionLabel}>enabled</Text>
          </View>
          <View style={styles.permissionBar}>
            <View
              style={[
                styles.permissionProgress,
                { width: `${(enabledPermissions / totalPermissions) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#ED277C" />
            <Text style={styles.sectionTitle}>Account Details</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>First Name</Text>
            <Text style={styles.infoRowValue}>{user?.first_name || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Last Name</Text>
            <Text style={styles.infoRowValue}>{user?.last_name || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Role</Text>
            <Text style={styles.infoRowValue}>{role}</Text>
          </View>
        </View>

        <LogoutButton />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  placeholder: {
    width: 24,
    height: 24,
  },
  profileCard: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 24,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ED277C",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: "#ED277C10",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: "#ED277C",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  permissionSummary: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 8,
  },
  permissionCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ED277C",
  },
  permissionLabel: {
    fontSize: 14,
    color: "#666",
  },
  permissionBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  permissionProgress: {
    height: "100%",
    backgroundColor: "#ED277C",
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoRowLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});