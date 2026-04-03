import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "@/components/layout/Header";
import SaleLog from "@/components/records/SaleLog";
import InventoryLog from "@/components/records/InventoryLog";

export default function RecordScreen() {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<"sales" | "inventory">("sales");

    return (
        <View style={[styles.container]}>
            <Header
                title="Record"
                showBackButton={false}
                backgroundColor="#fff"
                titleColor="#333"
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

            {/* Active Component */}
            {activeTab === "sales" ? <SaleLog /> : <InventoryLog />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
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
});