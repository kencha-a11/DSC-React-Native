// app/(manager)/(tabs)/accounts.tsx
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { accountService, AccountResponse } from "@/services/accountService";
import Header from "@/components/layout/Header";

// Constants
const ROLE_STYLES = {
  manager: { bg: "#F3E5F5", color: "#7B1FA2" },
  superadmin: { bg: "#FFEBEE", color: "#C62828" },
  cashier: { bg: "#E3F2FD", color: "#1976D2" },
} as const;

const STATUS_STYLES = {
  activated: { bg: "#E8F5E9", color: "#2E7D32" },
  deactivated: { bg: "#FFEBEE", color: "#C62828" },
} as const;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Component for individual account item
const AccountItem = ({
  account,
  onPress,
}: {
  account: AccountResponse;
  onPress: () => void;
}) => {
  const roleStyle =
    ROLE_STYLES[account.role.toLowerCase() as keyof typeof ROLE_STYLES] ||
    ROLE_STYLES.cashier;
  const statusKey =
    account.account_status.toLowerCase() as keyof typeof STATUS_STYLES;
  const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.activated;

  return (
    <TouchableOpacity style={styles.accountItem} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{account.name.charAt(0)}</Text>
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountEmail}>{account.email}</Text>
        <View style={styles.badgeRow}>
          <Text
            style={[
              styles.badge,
              { backgroundColor: roleStyle.bg, color: roleStyle.color },
            ]}
          >
            {capitalize(account.role)}
          </Text>
          <Text
            style={[
              styles.badge,
              { backgroundColor: statusStyle.bg, color: statusStyle.color },
            ]}
          >
            {capitalize(account.account_status)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
};

// Component for section header
const SectionHeader = ({ letter }: { letter: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{letter}</Text>
  </View>
);

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load accounts on focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      accountService
        .getAccounts()
        .then((response) => {
          // response is { data: AccountResponse[], current_page, etc }
          setAccounts(response.data); // ✅ Extract the array
        })
        .catch(() => setAccounts([]))
        .finally(() => setLoading(false));
    }, []),
  );

  // Filter accounts by search query
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;

    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q),
    );
  }, [accounts, searchQuery]);

  // Group filtered accounts by first letter
  const sections = useMemo(() => {
    const grouped = filteredAccounts.reduce(
      (acc, account) => {
        const letter = account.name.charAt(0).toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(account);
        return acc;
      },
      {} as Record<string, AccountResponse[]>,
    );

    return Object.keys(grouped)
      .sort()
      .map((letter) => ({ letter, data: grouped[letter] }));
  }, [filteredAccounts]);

  const handleViewProfile = (account: AccountResponse) => {
    router.push({
      pathname: "/(manager)/account/[id]" as any,
      params: {
        id: account.id.toString(),
        name: account.name,
        first_name: account.first_name,
        last_name: account.last_name,
        email: account.email,
        phone: account.phone_number,
        role: account.role,
        status: account.account_status,
      },
    });
  };

  const renderSection = ({
    item,
  }: {
    item: { letter: string; data: AccountResponse[] };
  }) => (
    <View>
      <SectionHeader letter={item.letter} />
      {item.data.map((account) => (
        <AccountItem
          key={account.id}
          account={account}
          onPress={() => handleViewProfile(account)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header 
        title="Accounts"
        showBackButton={false}
      />


      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={16}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search accounts..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#ED277C" size="large" />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.letter}
          renderItem={renderSection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No accounts found</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(manager)/account/create/step1" as any)}
      >
        <Ionicons name="person-add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#000" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
    height: 50,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#000" },
  loader: { marginTop: 40 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: {
    backgroundColor: "#f9f9f9",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  sectionHeaderText: { fontSize: 16, fontWeight: "600", color: "#ED277C" },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "600" },
  accountInfo: { flex: 1 },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  accountEmail: { fontSize: 13, color: "#666", marginBottom: 6 },
  badgeRow: { flexDirection: "row", gap: 6 },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { fontSize: 16, color: "#999" },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#ED277C",
    padding: 16,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
