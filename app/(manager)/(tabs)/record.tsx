import Header from "@/components/layout/Header";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Mock Data
const MOCK_SALES = Array.from({ length: 6 }).map((_, i) => ({
    id: `s-${i}`,
    name: "Patrick Pioquinto",
    action: "Sold 10 items",
    amount: "PHP 219.25",
    time: "03/18  3:35PM",
    initial: "P",
}));

const MOCK_INVENTORY = [
    {
        id: "i-0",
        name: "Patrick Pioquinto",
        action: "Added new item",
        actionColor: "#28a745",
        detail: "20 Notebooks",
        time: "03/18  3:35PM",
        initial: "P",
        avatarColor: "#28a745",
    },
    {
        id: "i-1",
        name: "Rasheed Gavin Espo...",
        action: "Deducted an item",
        actionColor: "#dc3545",
        detail: "2 Crayons - Damaged",
        time: "03/18  3:35PM",
        initial: "R",
        avatarColor: "#5b9bd5",
    },
    {
        id: "i-2",
        name: "Patrick Pioquinto",
        action: "Added new item",
        actionColor: "#28a745",
        detail: "20 Notebooks",
        time: "03/18  3:35PM",
        initial: "R", // matching screenshot visual bug
        avatarColor: "#5b9bd5",
    },
    {
        id: "i-3",
        name: "Patrick Pioquinto",
        action: "Added new item",
        actionColor: "#28a745",
        detail: "20 Notebooks",
        time: "03/18  3:35PM",
        initial: "P",
        avatarColor: "#28a745",
    },
    {
        id: "i-4",
        name: "Patrick Pioquinto",
        action: "Added new item",
        actionColor: "#28a745",
        detail: "20 Notebooks",
        time: "03/18  3:35PM",
        initial: "P",
        avatarColor: "#28a745",
    },
];

export default function RecordScreen() {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<"sales" | "inventory">("sales");
    const [searchQuery, setSearchQuery] = useState("");

    const renderSalesItem = ({ item }: { item: typeof MOCK_SALES[0] }) => (
        <View style={styles.card}>
            <View style={[styles.avatar, { backgroundColor: "#28a745" }]}>
                <Text style={styles.avatarText}>{item.initial}</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.action}</Text>
                <Text style={[styles.amount, { color: "#28a745" }]}>{item.amount}</Text>
            </View>
            <View style={styles.timeContainer}>
                <Text style={styles.time}>{item.time}</Text>
            </View>
        </View>
    );

    const renderInventoryItem = ({ item }: { item: typeof MOCK_INVENTORY[0] }) => (
        <View style={styles.card}>
            <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
                <Text style={styles.avatarText}>{item.initial}</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={[styles.subtitle, { color: item.actionColor }]}>
                    {item.action}
                </Text>
                <Text style={styles.itemDetail}>{item.detail}</Text>
            </View>
            <View style={styles.timeContainer}>
                <Text style={styles.time}>{item.time}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header
                title="Record"
                showBackButton={false}
                backgroundColor="#fff"
                titleColor="#333"
            // rightComponent={<View style={styles.placeholder} />}
            />
            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === "sales" && styles.activeTabButton,
                    ]}
                    onPress={() => setActiveTab("sales")}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "sales" && styles.activeTabText,
                        ]}
                    >
                        Sales log
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === "inventory" && styles.activeTabButton,
                    ]}
                    onPress={() => setActiveTab("inventory")}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "inventory" && styles.activeTabText,
                        ]}
                    >
                        Inventory log
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchInputContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search records"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />
                </View>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="funnel" size={18} color="#000" />
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={activeTab === "sales" ? (MOCK_SALES as any[]) : (MOCK_INVENTORY as any[])}
                keyExtractor={(item) => item.id}
                renderItem={
                    activeTab === "sales" ? renderSalesItem as any : renderInventoryItem as any
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
    },
    placeholder: {
        width: 24,
        height: 24,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#fff",
    },
    tabButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: "center",
        borderBottomWidth: 3,
        borderBottomColor: "#e0e0e0",
    },
    activeTabButton: {
        borderBottomColor: "#ED277C",
    },
    tabText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#666",
    },
    activeTabText: {
        color: "#ED277C",
    },
    searchSection: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        gap: 12,
        backgroundColor: "#fff",
    },
    searchInputContainer: {
        flex: 1,
        backgroundColor: "#f2f2f2",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === "ios" ? 10 : 8,
    },
    searchInput: {
        fontSize: 14,
        color: "#333",
    },
    filterButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f2f2f2",
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        padding: 12,
        paddingBottom: 40,
    },
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        alignItems: "center",
        // Light shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "600",
    },
    content: {
        flex: 1,
        justifyContent: "center",
    },
    name: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: "#666",
        marginBottom: 2,
    },
    amount: {
        fontSize: 13,
        fontWeight: "500",
    },
    itemDetail: {
        fontSize: 13,
        color: "#333",
    },
    timeContainer: {
        alignSelf: "flex-start",
    },
    time: {
        fontSize: 12,
        fontWeight: "600",
        color: "#333",
    },
});