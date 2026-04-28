import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- Types for Mock Data ---
interface ProductItem {
    id: string;
    name: string;
    quantity: number;
    subtotal: number;
}

interface SalesTransaction {
    customerName: string;
    customerInitial: string;
    itemCount: number;
    totalAmount: number;
    dateStr: string;
    timeStr: string;
    products: ProductItem[];
}

// --- MOCK DATA ---
// Exact data from the provided image
const mockSalesTransaction: SalesTransaction = {
    customerName: 'Patrick Pioquinto',
    customerInitial: 'P',
    itemCount: 4,
    totalAmount: 82.0,
    dateStr: '03/18',
    timeStr: '3:35PM',
    products: [
        { id: '1', name: 'Notebook', quantity: 1, subtotal: 24.0 },
        { id: '2', name: 'Pencil', quantity: 1, subtotal: 15.0 },
        { id: '3', name: 'Eraser', quantity: 1, subtotal: 22.0 },
        { id: '4', name: 'Ruler', quantity: 1, subtotal: 21.0 },
    ],
};

// --- Helper Functions ---
const formatCurrency = (amount: number): string => {
    return `₱ ${amount.toFixed(2)}`;
};

// --- Child Components ---

// Column Header Row
const TableHeader = () => (
    <View style={styles.tableHeader}>
        <Text style={[styles.columnLabel, styles.columnProduct, { textAlign: 'left' }]}>
            Product
        </Text>
        <Text style={[styles.columnLabel, styles.columnQuantity, { textAlign: 'center' }]}>
            Quantity
        </Text>
        <Text style={[styles.columnLabel, styles.columnSubtotal, { textAlign: 'right' }]}>
            Subtotal
        </Text>
    </View>
);

// Individual Product Row
const ProductRow = ({ item }: { item: ProductItem }) => (
    <View style={styles.productRow}>
        <Text style={[styles.productText, styles.columnProduct, { textAlign: 'left' }]}>
            {item.name}
        </Text>
        <Text style={[styles.productText, styles.columnQuantity, { textAlign: 'center' }]}>
            {item.quantity}
        </Text>
        <Text style={[styles.productText, styles.columnSubtotal, { textAlign: 'right' }]}>
            {formatCurrency(item.subtotal)}
        </Text>
    </View>
);

// --- Main Modal Component ---
interface SalesSummaryModalProps {
    isVisible: boolean;
    onClose: () => void;
    data: SalesTransaction;
}

const SalesSummaryModal: React.FC<SalesSummaryModalProps> = ({ isVisible, onClose, data }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            {/* Semi-transparent background overlay */}
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    {/* 1. Header Section */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Sales summary</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
          
                    </View>
                    <View style={styles.divider} />

                    {/* 2. Customer & Transaction Info */}
                    <View style={styles.infoSection}>
                        <View style={styles.leftInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{data.customerInitial}</Text>
                            </View>
                            <View style={styles.customerTextDetails}>
                                <Text style={styles.customerName}>{data.customerName}</Text>
                                <Text style={styles.itemCount}>Sold {data.itemCount} items</Text>
                                <Text style={styles.totalAmountGreen}>
                                    {formatCurrency(data.totalAmount)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.rightInfo}>
                            <Text style={styles.dateTimeText}>
                                {data.dateStr} {data.timeStr}
                            </Text>
                        </View>
                    </View>

                    {/* 3. Products Table */}
                    <View style={styles.tableContainer}>
                        <TableHeader />
                        <FlatList
                            data={data.products}
                            renderItem={ProductRow}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            scrollEnabled={false} // Disable list scrolling, modal itself doesn't scroll either in image
                            ItemSeparatorComponent={() => <View style={{ height: 8 }} />} // Space between rows
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// --- App Root / Usage Component ---
export default function App() {
    const [isModalVisible, setIsModalVisible] = useState(false);

    return (
        <SafeAreaView style={styles.appContainer}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.screenContent}>
                <Text style={styles.mainTitle}>Sales Dashboard</Text>
                <Text style={styles.subtitle}>Tap button to view summary</Text>
                <TouchableOpacity
                    style={styles.openButton}
                    onPress={() => setIsModalVisible(true)}
                >
                    <Text style={styles.openButtonText}>View Last Sale Summary</Text>
                </TouchableOpacity>
            </View>

            <SalesSummaryModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                data={mockSalesTransaction}
            />
        </SafeAreaView>
    );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
    // App styles
    appContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    screenContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    openButton: {
        backgroundColor: '#ED277C',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    openButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 400, // Good constraint for larger screens
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        overflow: 'hidden', // Ensures divider doesn't bleed out
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    closeButton: {
        padding: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#eaeaea',
        width: '100%',
    },

    // Info Section
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    leftInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16, // Space between avatar and text blocks
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#38b000', // Green from the image
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '600',
    },
    customerTextDetails: {
        gap: 2, // Fine spacing between text lines
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    itemCount: {
        fontSize: 15,
        color: '#666',
    },
    totalAmountGreen: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2a9d8f', // A nice green close to image's teal/green
    },
    rightInfo: {
        alignItems: 'flex-end',
    },
    dateTimeText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a1a',
    },

    // Products Table
    tableContainer: {
        backgroundColor: '#f5f5f5', // Whole table block gets the gray background
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#efefef', // Darker gray for header bar itself
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    columnLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    listContent: {
        backgroundColor: '#fff', // Rows content are white background
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    productText: {
        fontSize: 15,
        color: '#1a1a1a',
        fontWeight: '400',
    },

    // Column specific alignment and widths
    // Total of flex ratios should cover the full row width
    columnProduct: {
        flex: 4, // More space for name
    },
    columnQuantity: {
        flex: 2, // Enough for number
    },
    columnSubtotal: {
        flex: 3, // Enough for formatted currency
    },
});