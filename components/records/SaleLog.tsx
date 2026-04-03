import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback } from "react";
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
import { getSalesLogs, SaleLog as SaleLogType } from "@/services/records/saleLogServices";

export default function SaleLog() {
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [sales, setSales] = useState<SaleLogType[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await getSalesLogs();
            let data = response.data;

            // Filter by search query (cashier name)
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                data = data.filter(s =>
                    s.user?.name?.toLowerCase().includes(q) ||
                    s.user?.first_name?.toLowerCase().includes(q)
                );
            }

            // Filter by date range
            if (startDate || endDate) {
                data = data.filter(sale => {
                    const saleDate = new Date(sale.created_at);
                    if (startDate && saleDate < startDate) return false;
                    if (endDate) {
                        // Set end date to end of day for inclusive filtering
                        const endOfDay = new Date(endDate);
                        endOfDay.setHours(23, 59, 59, 999);
                        if (saleDate > endOfDay) return false;
                    }
                    return true;
                });
            }

            setSales(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchLogs();
        }, [searchQuery, startDate, endDate])
    );

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

    const openSaleDetails = (sale: SaleLogType) => {
        setSelectedSale(sale);
        setModalVisible(true);
    };

    const clearDateFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setFilterModalVisible(false);
    };

    const applyDateFilter = () => {
        setFilterModalVisible(false);
    };

    const hasActiveFilters = searchQuery.length > 0 || startDate !== null || endDate !== null;

    const [selectedSale, setSelectedSale] = useState<SaleLogType | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const renderItem = ({ item }: { item: SaleLogType }) => {
        const name = item.user?.name || item.user?.first_name || "Unknown User";
        const itemCount = item.sale_items?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openSaleDetails(item)}
                style={styles.card}
            >
                <View style={[styles.avatar, { backgroundColor: "#28a745" }]}>
                    <Text style={styles.avatarText}>{getInitials(name)}</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.subtitle}>Sold {itemCount} items</Text>
                    <Text style={[styles.amount, { color: "#28a745" }]}>PHP {item.total_amount}</Text>
                </View>
                <View style={styles.timeContainer}>
                    <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Search Bar + Filter Button */}
            <View style={styles.searchSection}>
                <View style={styles.searchInputContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search sales records"
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

            {/* Active filters summary */}
            {hasActiveFilters && (
                <View style={styles.activeFiltersContainer}>
                    <Text style={styles.activeFiltersText}>
                        {searchQuery.length > 0 && `Search: "${searchQuery}"`}
                        {startDate && ` • From: ${startDate.toLocaleDateString()}`}
                        {endDate && ` • To: ${endDate.toLocaleDateString()}`}
                    </Text>
                    <TouchableOpacity onPress={() => {
                        setSearchQuery("");
                        setStartDate(null);
                        setEndDate(null);
                    }}>
                        <Text style={styles.clearFiltersText}>Clear all</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Date Range Filter Modal */}
            <Modal
                visible={filterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter by Date Range</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.datePickerContainer}>
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
                        </View>

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
                            <TouchableOpacity style={styles.clearButton} onPress={clearDateFilter}>
                                <Text style={styles.clearButtonText}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyButton} onPress={applyDateFilter}>
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* List */}
            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color="#ED277C" />
            ) : (
                <FlatList
                    data={sales}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>No sales records found</Text>}
                />
            )}

            {/* Sale Details Modal (unchanged from previous version) */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sale Transaction Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {selectedSale && (
                                <>
                                    <View style={styles.summarySection}>
                                        <Text style={styles.summaryLabel}>Cashier</Text>
                                        <Text style={styles.summaryValue}>
                                            {selectedSale.user?.name || selectedSale.user?.first_name || "Unknown"}
                                        </Text>

                                        <Text style={styles.summaryLabel}>Payment Method</Text>
                                        <Text style={styles.summaryValue}>
                                            {selectedSale.payment_method || "N/A"}
                                        </Text>

                                        <Text style={styles.summaryLabel}>Transaction Date</Text>
                                        <Text style={styles.summaryValue}>
                                            {new Date(selectedSale.created_at).toLocaleString()}
                                        </Text>

                                        <Text style={styles.summaryLabel}>Total Amount</Text>
                                        <Text style={[styles.summaryValue, styles.totalAmount]}>
                                            PHP {selectedSale.total_amount}
                                        </Text>
                                    </View>

                                    <View style={styles.productsSection}>
                                        <Text style={styles.productsTitle}>Items Sold</Text>
                                        {selectedSale.sale_items?.map((item, index) => (
                                            <View key={index} style={styles.productRow}>
                                                <View style={styles.productInfo}>
                                                    <Text style={styles.productName}>
                                                        {item.product?.name || `Product #${item.product_id}`}
                                                    </Text>
                                                    <Text style={styles.productMeta}>
                                                        {item.quantity} x PHP {item.unit_price}
                                                    </Text>
                                                </View>
                                                <Text style={styles.productTotal}>
                                                    PHP {item.subtotal}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 20,
        width: "90%",
        maxHeight: "80%",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
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
    datePickerContainer: {
        padding: 16,
        gap: 12,
    },
    dateButton: {
        backgroundColor: "#f2f2f2",
        padding: 12,
        borderRadius: 8,
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
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        gap: 12,
    },
    clearButton: {
        flex: 1,
        backgroundColor: "#f2f2f2",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
    },
    applyButton: {
        flex: 1,
        backgroundColor: "#ED277C",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    closeButton: {
        backgroundColor: "#ED277C",
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
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
    amount: {
        fontSize: 13,
        fontWeight: "500",
    },
    timeContainer: {
        alignSelf: "flex-start",
    },
    time: {
        fontSize: 12,
        fontWeight: "600",
        color: "#333",
    },
    summarySection: {
        marginBottom: 20,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#666",
        marginTop: 8,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        color: "#333",
        marginBottom: 8,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: "700",
        color: "#28a745",
    },
    productsSection: {
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingTop: 16,
    },
    productsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    productRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
    },
    productMeta: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
    },
    productTotal: {
        fontSize: 14,
        fontWeight: "600",
        color: "#28a745",
    },
    modalScroll: {
        padding: 16,
    },
});