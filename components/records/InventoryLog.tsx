// components/records/InventoryLog.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback, useMemo } from "react";
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Modal,
    ScrollView
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { getInventoryLogs, InventoryLog as InventoryLogType } from "@/services/records/inventoryLogService";

type InventoryAction = 'created' | 'update' | 'restock' | 'deducted' | 'deleted' | 'adjusted';

const ALL_ACTIONS: InventoryAction[] = ['created', 'update', 'restock', 'deducted', 'deleted', 'adjusted'];

const ACTION_DISPLAY_NAMES: Record<InventoryAction, string> = {
    created: 'Created product',
    update: 'Updated product',
    restock: 'Restocked',
    deducted: 'Deducted',
    deleted: 'Deleted product',
    adjusted: 'Adjusted quantity',
};

interface InventoryLogProps {
    userId: number;
}

export default function InventoryLog({ userId }: InventoryLogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedActions, setSelectedActions] = useState<Set<InventoryAction>>(new Set());
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [allInventory, setAllInventory] = useState<InventoryLogType[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAllLogs = async () => {
        setLoading(true);
        try {
            const response = await getInventoryLogs({ user_id: userId });
            setAllInventory(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAllLogs();
        }, [userId])
    );

    const filteredInventory = useMemo(() => {
        let result = allInventory;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.user_name?.toLowerCase().includes(q) ||
                item.product_name?.toLowerCase().includes(q)
            );
        }

        if (selectedActions.size > 0) {
            result = result.filter(item =>
                selectedActions.has(item.action.toLowerCase() as InventoryAction)
            );
        }

        if (startDate || endDate) {
            result = result.filter(item => {
                const itemDate = new Date(item.created_at);
                if (startDate && itemDate < startDate) return false;
                if (endDate) {
                    const endOfDay = new Date(endDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    if (itemDate > endOfDay) return false;
                }
                return true;
            });
        }

        return result;
    }, [allInventory, searchQuery, selectedActions, startDate, endDate]);

    const formatTime = (timeStr: string) => {
        const d = new Date(timeStr);
        const md = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
        let h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${md}  ${h}:${m}${ampm}`;
    };

    const getInitials = (name?: string) => {
        return name ? name.charAt(0).toUpperCase() : "?";
    };

    const isAdditionAction = (action: string) => ['created', 'restock'].includes(action.toLowerCase());
    const isReductionAction = (action: string) => ['deducted', 'deleted'].includes(action.toLowerCase());

    const getActionDisplay = (action: string) => {
        const lower = action.toLowerCase() as InventoryAction;
        return ACTION_DISPLAY_NAMES[lower] || action;
    };

    const getActionColor = (action: string, quantityChange?: number) => {
        const lowerAction = action.toLowerCase();
        if (isAdditionAction(lowerAction)) return "#28a745";
        if (isReductionAction(lowerAction)) return "#dc3545";
        if (lowerAction === 'update') return "#ffc107";
        if (lowerAction === 'adjusted') {
            if (quantityChange && quantityChange > 0) return "#28a745";
            if (quantityChange && quantityChange < 0) return "#dc3545";
            return "#6c757d";
        }
        return "#6c757d";
    };

    const toggleActionFilter = (action: InventoryAction) => {
        const newSet = new Set(selectedActions);
        if (newSet.has(action)) newSet.delete(action);
        else newSet.add(action);
        setSelectedActions(newSet);
    };

    const clearFilters = () => {
        setSelectedActions(new Set());
        setSearchQuery("");
        setStartDate(null);
        setEndDate(null);
        setFilterModalVisible(false);
    };

    const hasActiveFilters = selectedActions.size > 0 || searchQuery.length > 0 || startDate !== null || endDate !== null;

    const renderItem = ({ item }: { item: InventoryLogType }) => {
        const action = item.action;
        const quantityChange = item.quantity_change || 0;
        const actionColor = getActionColor(action, quantityChange);
        const displayAction = getActionDisplay(action);

        const quantityAbs = Math.abs(quantityChange);
        const quantityPrefix = quantityChange > 0 ? '+' : (quantityChange < 0 ? '-' : '');
        const quantityText = quantityChange !== 0 ? `${quantityPrefix}${quantityAbs} ${item.product_name}` : `No quantity change`;

        return (
            <View style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: actionColor }]}>
                    <Text style={styles.avatarText}>{getInitials(item.user_name)}</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.name}>{item.user_name}</Text>
                    <Text style={[styles.subtitle, { color: actionColor }]}>
                        {displayAction}
                    </Text>
                    <Text style={styles.itemDetail}>{quantityText}</Text>
                </View>
                <View style={styles.timeContainer}>
                    <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.searchSection}>
                <View style={styles.searchInputContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search inventory records"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons name="filter" size={18} color={hasActiveFilters ? "#ED277C" : "#000"} />
                </TouchableOpacity>
            </View>

            {hasActiveFilters && (
                <View style={styles.activeFiltersContainer}>
                    <Text style={styles.activeFiltersText}>
                        {selectedActions.size > 0 && `Actions: ${Array.from(selectedActions).map(a => ACTION_DISPLAY_NAMES[a]).join(', ')}`}
                        {searchQuery.length > 0 && (selectedActions.size > 0 ? ` • Search: "${searchQuery}"` : `Search: "${searchQuery}"`)}
                        {startDate && ` • From: ${startDate.toLocaleDateString()}`}
                        {endDate && ` • To: ${endDate.toLocaleDateString()}`}
                    </Text>
                    <TouchableOpacity onPress={clearFilters}>
                        <Text style={styles.clearFiltersText}>Clear all</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal
                visible={filterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Records</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            <Text style={styles.filterSectionTitle}>Action Type</Text>
                            {ALL_ACTIONS.map(action => (
                                <TouchableOpacity
                                    key={action}
                                    style={styles.filterOption}
                                    onPress={() => toggleActionFilter(action)}
                                >
                                    <View style={styles.checkbox}>
                                        {selectedActions.has(action) && (
                                            <Ionicons name="checkmark" size={18} color="#ED277C" />
                                        )}
                                    </View>
                                    <Text style={styles.filterOptionText}>
                                        {ACTION_DISPLAY_NAMES[action]}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            <Text style={[styles.filterSectionTitle, { marginTop: 16 }]}>Date Range</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowStartPicker(true)}
                            >
                                <Text style={styles.dateButtonLabel}>Start Date</Text>
                                <Text style={styles.dateButtonValue}>
                                    {startDate ? startDate.toLocaleDateString() : "Not set"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowEndPicker(true)}
                            >
                                <Text style={styles.dateButtonLabel}>End Date</Text>
                                <Text style={styles.dateButtonValue}>
                                    {endDate ? endDate.toLocaleDateString() : "Not set"}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowStartPicker(false);
                                    if (selectedDate) setStartDate(selectedDate);
                                }}
                            />
                        )}

                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowEndPicker(false);
                                    if (selectedDate) setEndDate(selectedDate);
                                }}
                            />
                        )}

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalButton} onPress={clearFilters}>
                                <Text style={styles.modalButtonText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.applyButton]}
                                onPress={() => setFilterModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, styles.applyButtonText]}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color="#ED277C" />
            ) : (
                <FlatList
                    data={filteredInventory}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>No inventory records found</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    searchSection: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
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
        marginLeft: 12,
    },
    filterButtonActive: {
        backgroundColor: "#ffe0f0",
    },
    activeFiltersContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#f5f5f5",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    activeFiltersText: {
        fontSize: 12,
        color: "#666",
        flex: 1,
    },
    clearFiltersText: {
        fontSize: 12,
        color: "#ED277C",
        fontWeight: "500",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    modalScroll: {
        maxHeight: 400,
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 4,
    },
    filterOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#ddd",
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    filterOptionText: {
        fontSize: 16,
        color: "#333",
    },
    dateButton: {
        backgroundColor: "#f2f2f2",
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginVertical: 6,
    },
    dateButtonLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    dateButtonValue: {
        fontSize: 16,
        color: "#333",
        fontWeight: "500",
    },
    modalFooter: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#eee",
        padding: 16,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        backgroundColor: "#f2f2f2",
    },
    applyButton: {
        backgroundColor: "#ED277C",
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    applyButtonText: {
        color: "#fff",
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