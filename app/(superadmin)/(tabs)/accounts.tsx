import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, ActivityIndicator, Modal, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { accountService, AccountResponse } from "@/services/accountService";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";

const ROLE_STYLES = {
  manager: { bg: "#F3E5F5", color: "#7B1FA2" },
  superadmin: { bg: "#FFEBEE", color: "#C62828" },
  cashier: { bg: "#E3F2FD", color: "#1976D2" },
} as const;

const STATUS_STYLES = {
  activated: { bg: "#E8F5E9", color: "#2E7D32" },
  deactivated: { bg: "#FFEBEE", color: "#C62828" },
} as const;

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

const AccountItem = ({ account, onPress }: { account: AccountResponse; onPress: () => void }) => {
  const roleStyle = ROLE_STYLES[account.role.toLowerCase() as keyof typeof ROLE_STYLES] || ROLE_STYLES.cashier;
  const statusStyle = STATUS_STYLES[account.account_status.toLowerCase() as keyof typeof STATUS_STYLES] || STATUS_STYLES.activated;

  return (
    <TouchableOpacity style={styles.accountItem} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{account.name.charAt(0)}</Text>
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountEmail}>{account.email}</Text>
        <View style={styles.badgeRow}>
          <Text style={[styles.badge, { backgroundColor: roleStyle.bg, color: roleStyle.color }]}>
            {capitalize(account.role)}
          </Text>
          <Text style={[styles.badge, { backgroundColor: statusStyle.bg, color: statusStyle.color }]}>
            {capitalize(account.account_status)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
};

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "manager" | "cashier">("all");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { user } = useAuth();

  const isSuperAdmin = user?.role?.toLowerCase().replace(/\s/g, "") === "superadmin";

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      accountService.getAccounts()
        .then((response) => {
          let fetched = response.data;
          if (user?.role?.toLowerCase() === "manager") {
            fetched = fetched.filter(a => a.role.toLowerCase() === "cashier" || a.id === user.id);
          } else if (isSuperAdmin) {
            fetched = fetched.filter(a => ["manager", "cashier"].includes(a.role.toLowerCase()) || a.id === user.id);
          }
          setAccounts(fetched);
        })
        .catch(() => setAccounts([]))
        .finally(() => setLoading(false));
    }, [user?.role, user?.id, isSuperAdmin])
  );

  const filteredAccounts = useMemo(() => {
    let list = accounts;
    if (isSuperAdmin && roleFilter !== "all") {
      list = list.filter(a => a.id === user?.id || a.role.toLowerCase() === roleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
    }
    return list;
  }, [accounts, roleFilter, searchQuery, isSuperAdmin, user?.id]);

  const sections = useMemo(() => {
    const grouped = filteredAccounts.reduce((acc, account) => {
      const letter = account.name.charAt(0).toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(account);
      return acc;
    }, {} as Record<string, AccountResponse[]>);
    return Object.keys(grouped).sort().map(letter => ({ letter, data: grouped[letter] }));
  }, [filteredAccounts]);

  return (
    <View style={styles.container}>
      <Header title="Accounts" showBackButton={false} />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search accounts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
        {isSuperAdmin ? (
          <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filterButton}>
            <Ionicons name="filter" size={20} color="#ED277C" />
            {roleFilter !== "all" ? <View style={styles.filterBadge} /> : null}
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#ED277C" size="large" />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.letter}
          renderItem={({ item }) => (
            <View>
              <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{item.letter}</Text></View>
              {item.data.map(acc => (
                <AccountItem key={acc.id} account={acc} onPress={() => router.push(`/(superadmin)/account/${acc.id}`)} />
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/(superadmin)/account/create/step1")}>
        <Ionicons name="person-add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={filterModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by role</Text>
            {["all", "manager", "cashier"].map((opt) => (
              <TouchableOpacity key={opt} style={styles.modalOption} onPress={() => { setRoleFilter(opt as any); setFilterModalVisible(false); }}>
                <Text style={[styles.modalOptionText, roleFilter === opt && styles.modalOptionActive]}>{capitalize(opt)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 15, marginTop: 20, marginBottom: 20, height: 50 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  filterButton: { paddingHorizontal: 8 },
  filterBadge: { position: "absolute", top: -2, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ED277C" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "white", borderRadius: 16, padding: 20, width: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  modalOptionText: { fontSize: 16 },
  modalOptionActive: { color: "#ED277C", fontWeight: "bold" },
  loader: { marginTop: 40 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: { backgroundColor: "#f9f9f9", padding: 8, marginTop: 10, borderRadius: 8 },
  sectionHeaderText: { fontSize: 16, fontWeight: "600", color: "#ED277C" },
  accountItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#ED277C", justifyContent: "center", alignItems: "center", marginRight: 14 },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "600" },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 16, fontWeight: "600" },
  accountEmail: { fontSize: 13, color: "#666" },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  badge: { fontSize: 11, fontWeight: "600", paddingHorizontal: 8, borderRadius: 10, overflow: "hidden" },
  fab: { position: "absolute", bottom: 20, right: 20, backgroundColor: "#ED277C", padding: 16, borderRadius: 35, elevation: 5 }
});