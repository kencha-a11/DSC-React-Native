// components/LogsModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getInventoryLogs, InventoryLog } from '@/services/records/inventoryLogService';
import { getSalesLogs, SaleLog } from '@/services/records/salesLogServices';
import { getTimeLogs, TimeLog } from '@/services/records/timeLogService';

type LogType = 'sales' | 'inventory' | 'time';

interface LogsModalProps {
    visible: boolean;
    type: LogType;
    userId: number;
    onClose: () => void;
}

type AnyLog = InventoryLog | SaleLog | TimeLog;

const LogsModal: React.FC<LogsModalProps> = ({ visible, type, userId, onClose }) => {
    const [logs, setLogs] = useState<AnyLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AnyLog | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    const fetchLogs = useCallback(async (pageNum: number, refresh = false) => {
        if (loading) return;
        setLoading(true);
        try {
            let response;
            switch (type) {
                case 'inventory':
                    response = await getInventoryLogs({ page: pageNum, user_id: userId, limit: 20 });
                    break;
                case 'sales':
                    response = await getSalesLogs({ page: pageNum, user_id: userId });
                    break;
                case 'time':
                    response = await getTimeLogs({ page: pageNum, per_page: 20, user_id: userId });
                    break;
            }
            const newData = response.data;
            if (refresh) {
                setLogs(newData);
            } else {
                setLogs(prev => [...prev, ...newData]);
            }
            setHasMore(pageNum < response.last_page);
        } catch (error) {
            console.error(`Failed to fetch ${type} logs:`, error);
        } finally {
            setLoading(false);
        }
    }, [type, userId]);

    // Reset and fetch when modal opens or page changes
    useEffect(() => {
        if (visible) {
            setPage(1);
            setLogs([]);
            setHasMore(true);
            fetchLogs(1, true);
        }
    }, [visible, fetchLogs]);

    const loadMore = () => {
        if (hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchLogs(nextPage);
        }
    };

    const renderLogItem = ({ item }: { item: AnyLog }) => {
        let leftIcon: string;
        let title: string;
        let subtitle: string;
        let rightText: string;

        switch (type) {
            case 'inventory':
                const inv = item as InventoryLog;
                leftIcon = inv.quantity_change >= 0 ? 'arrow-up' : 'arrow-down';
                title = inv.product_name;
                subtitle = `${inv.action} by ${inv.user_name}`;
                rightText = `${inv.quantity_change > 0 ? '+' : ''}${inv.quantity_change}`;
                break;
            case 'sales':
                const sale = item as SaleLog;
                leftIcon = 'cart';
                title = `Sale #${sale.id}`;
                subtitle = `${sale.user?.name || 'User'} • ${sale.payment_method}`;
                rightText = `₱${Number(sale.total_amount).toFixed(2)}`;
                break;
            case 'time':
                const time = item as TimeLog;
                leftIcon = time.status === 'logged_in' ? 'log-in' : 'log-out';
                title = time.user.name;
                subtitle = time.start_time ? new Date(time.start_time).toLocaleString() : 'N/A';
                rightText = time.status === 'logged_in' ? 'Online' : 'Offline';
                break;
        }

        return (
            <TouchableOpacity
                style={styles.logItem}
                onPress={() => {
                    setSelectedLog(item);
                    setDetailVisible(true);
                }}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={leftIcon as any} size={24} color="#ED277C" />
                </View>
                <View style={styles.logContent}>
                    <Text style={styles.logTitle}>{title}</Text>
                    <Text style={styles.logSubtitle}>{subtitle}</Text>
                </View>
                <Text style={styles.logRight}>{rightText}</Text>
            </TouchableOpacity>
        );
    };

    const renderDetailModal = () => {
        if (!selectedLog) return null;
        let details: { label: string; value: string }[] = [];

        switch (type) {
            case 'inventory':
                const inv = selectedLog as InventoryLog;
                details = [
                    { label: 'Product', value: inv.product_name },
                    { label: 'Action', value: inv.action },
                    { label: 'Quantity Change', value: inv.quantity_change.toString() },
                    { label: 'User', value: inv.user_name },
                    { label: 'Date/Time', value: new Date(inv.created_at).toLocaleString() },
                ];
                break;
            case 'sales':
                const sale = selectedLog as SaleLog;
                details = [
                    { label: 'Sale ID', value: sale.id.toString() },
                    { label: 'Total Amount', value: `₱${Number(sale.total_amount).toFixed(2)}` },
                    { label: 'Payment Method', value: sale.payment_method },
                    { label: 'Cashier', value: sale.user?.name || 'Unknown' },
                    { label: 'Date', value: new Date(sale.created_at).toLocaleString() },
                ];
                if (sale.sale_items?.length) {
                    details.push({
                        label: 'Items',
                        value: sale.sale_items.map(i => `${i.quantity}x ${i.product?.name || 'Product'}`).join(', '),
                    });
                }
                break;
            case 'time':
                const time = selectedLog as TimeLog;
                details = [
                    { label: 'User', value: time.user.name },
                    { label: 'Status', value: time.status },
                    { label: 'Start Time', value: time.start_time ? new Date(time.start_time).toLocaleString() : 'N/A' },
                    { label: 'End Time', value: time.end_time ? new Date(time.end_time).toLocaleString() : 'Ongoing' },
                    { label: 'Duration', value: time.duration ? `${time.duration} minutes` : 'N/A' },
                ];
                break;
        }

        return (
            <Modal visible={detailVisible} animationType="slide" transparent>
                <View style={styles.detailContainer}>
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => setDetailVisible(false)}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.detailTitle}>Log Details</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <ScrollView style={styles.detailContent}>
                        {details.map((item, idx) => (
                            <View key={idx} style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{item.label}</Text>
                                <Text style={styles.detailValue}>{item.value}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    return (
        <>
            <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {type === 'sales' ? 'Sales Logs' : type === 'inventory' ? 'Inventory Logs' : 'Time Logs'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={logs}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderLogItem}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={loading ? <ActivityIndicator style={styles.loader} /> : null}
                        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No logs found</Text> : null}
                    />
                </View>
            </Modal>
            {renderDetailModal()}
        </>
    );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ED277C' },
    closeButton: { padding: 4 },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    iconContainer: { width: 40, alignItems: 'center' },
    logContent: { flex: 1, marginLeft: 12 },
    logTitle: { fontSize: 16, fontWeight: '500', color: '#000' },
    logSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
    logRight: { fontSize: 14, fontWeight: '600', color: '#ED277C' },
    loader: { marginVertical: 20 },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
    // Detail modal styles
    detailContainer: { flex: 1, backgroundColor: '#fff', marginTop: 40 },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    detailContent: { padding: 16 },
    detailRow: { marginBottom: 16 },
    detailLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
    detailValue: { fontSize: 16, color: '#000', fontWeight: '500' },
});

export default LogsModal;