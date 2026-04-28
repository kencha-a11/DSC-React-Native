// components/records/TimeLog.tsx
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
import { getTimeLogs, TimeLog as TimeLogType } from "@/services/records/timeLogService";

interface TimeLogProps {
    userId: number;
}

export default function TimeLog({ userId }: TimeLogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [timeLogs, setTimeLogs] = useState<TimeLogType[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<TimeLogType | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await getTimeLogs({ user_id: userId });
            let data = response.data;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                data = data.filter(log =>
                    log.user?.name?.toLowerCase().includes(q) ||
                    log.user?.email?.toLowerCase().includes(q)
                );
            }

            if (startDate || endDate) {
                data = data.filter(log => {
                    const logDate = new Date(log.start_time || log.created_at);
                    if (startDate && logDate < startDate) return false;
                    if (endDate) {
                        const endOfDay = new Date(endDate);
                        endOfDay.setHours(23, 59, 59, 999);
                        if (logDate > endOfDay) return false;
                    }
                    return true;
                });
            }

            setTimeLogs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchLogs();
        }, [userId, searchQuery, startDate, endDate])
    );

    const formatTime = (timeStr: string) => {
        const d = new Date(timeStr);
        const md = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
        let h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${md}  ${h}:${m}${ampm}`;
    };

    const getInitials = (name?: string) => {
        return name ? name.charAt(0).toUpperCase() : "?";
    };

    const formatDuration = (start: string | null, end: string | null) => {
        if (!start) return "N/A";
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();
        const diffMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / 60000);
        if (diffMinutes < 60) return `${diffMinutes} min`;
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const openLogDetails = (log: TimeLogType) => {
        setSelectedLog(log);
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

    const renderItem = ({ item }: { item: TimeLogType }) => {
        const name = item.user?.name || "Unknown User";
        const status = item.status === 'logged_in' ? 'Online' : 'Offline';
        const statusColor = item.status === 'logged_in' ? '#28a745' : '#dc3545';
        const duration = formatDuration(item.start_time, item.end_time);

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openLogDetails(item)}
                style={styles.card}
            >
                <View style={[styles.avatar, { backgroundColor: statusColor }]}>
                    <Ionicons name={item.status === 'logged_in' ? "log-in" : "log-out"} size={22} color="#fff" />
                </View>
                <View style={styles.content}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={[styles.subtitle, { color: statusColor }]}>{status}</Text>
                    <Text style={styles.itemDetail}>Duration: {duration}</Text>
                </View>
                <View style={styles.timeContainer}>
                    <Text style={styles.time}>{formatTime(item.start_time || item.created_at)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
            <View style={styles.searchSection}>
                <View style={styles.searchInputContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search time logs"
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
                    <Text style={styles.activeFiltersText} numberOfLines={1}>
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

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color="#ED277C" />
            ) : (
                <FlatList
                    data={timeLogs}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={styles.emptyText}>No time logs found</Text>}
                />
            )}

            <Modal
                visible={filterModalVisible}
                animationType="fade"
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
                            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                                <Text style={styles.dateButtonLabel}>Start Date</Text>
                                <Text style={styles.dateButtonValue}>
                                    {startDate ? startDate.toLocaleDateString() : "Not set"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
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

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.detailCard}>
                        <View style={styles.summaryHeader}>
                            <Text style={styles.summaryTitle}>Time Log Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailContent}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>User</Text>
                                <Text style={styles.detailValue}>{selectedLog?.user?.name || "Unknown"}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Email</Text>
                                <Text style={styles.detailValue}>{selectedLog?.user?.email || "N/A"}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <Text style={[styles.detailValue, { color: selectedLog?.status === 'logged_in' ? '#28a745' : '#dc3545' }]}>
                                    {selectedLog?.status === 'logged_in' ? 'Online' : 'Offline'}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Start Time</Text>
                                <Text style={styles.detailValue}>
                                    {selectedLog?.start_time ? new Date(selectedLog.start_time).toLocaleString() : "N/A"}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>End Time</Text>
                                <Text style={styles.detailValue}>
                                    {selectedLog?.end_time ? new Date(selectedLog.end_time).toLocaleString() : "Ongoing"}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Duration</Text>
                                <Text style={styles.detailValue}>
                                    {selectedLog ? formatDuration(selectedLog.start_time, selectedLog.end_time) : "N/A"}
                                </Text>
                            </View>
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
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 20,
        width: "90%",
        elevation: 5,
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
        fontSize: 13,
        color: "#666",
        marginBottom: 2,
    },
    dateButtonValue: {
        fontSize: 15,
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
        fontSize: 15,
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
        fontSize: 15,
        fontWeight: "600",
        color: "#fff",
    },
    listContent: {
        padding: 12,
        paddingBottom: 40,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        color: "#999",
        fontSize: 15,
    },
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        alignItems: "center",
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        marginBottom: 2,
    },
    itemDetail: {
        fontSize: 13,
        color: "#666",
    },
    timeContainer: {
        alignSelf: "flex-start",
    },
    time: {
        fontSize: 11,
        fontWeight: "600",
        color: "#333",
    },
    divider: {
        height: 1,
        backgroundColor: "#eaeaea",
    },
    detailCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        width: "100%",
        maxWidth: 400,
        elevation: 5,
        overflow: "hidden",
    },
    summaryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    summaryTitle: {
        fontSize: 19,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    detailContent: {
        padding: 20,
    },
    detailRow: {
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        color: "#333",
        fontWeight: "500",
    },
});