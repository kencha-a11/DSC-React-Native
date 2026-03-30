// components/inventory/AddProductBarcodeModal.tsx
import React, { useRef, useState, useEffect } from "react";
import {
    Dimensions,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useProducts } from "@/context/ProductContext";
import DscToast from "@/components/common/DscToast";
import Header from "@/components/layout/Header";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const scanZone = {
    x: screenWidth * 0.1,
    y: screenHeight * 0.3,
    width: screenWidth * 0.8,
    height: screenHeight * 0.2,
};

const SCAN_INTERVAL = 2000;

const isInsideRect = (bounds: any, zone: typeof scanZone) => {
    if (!bounds?.origin || !bounds?.size) return false;
    const barcodeBox = {
        x: bounds.origin.x,
        y: bounds.origin.y,
        width: bounds.size.width,
        height: bounds.size.height,
    };
    return (
        barcodeBox.x < zone.x + zone.width &&
        barcodeBox.x + barcodeBox.width > zone.x &&
        barcodeBox.y < zone.y + zone.height &&
        barcodeBox.y + barcodeBox.height > zone.y
    );
};

interface AddProductBarcodeModalProps {
    visible: boolean;
    onClose: () => void;
    onBarcodeScanned: (barcode: string) => void;
}

export default function AddProductBarcodeModal({
    visible,
    onClose,
    onBarcodeScanned,
}: AddProductBarcodeModalProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [enabled, setEnabled] = useState(true);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const lastScanTimeRef = useRef<number>(0);
    const lastScannedCodeRef = useRef<string | null>(null);

    const { getProductByBarcode, loading } = useProducts();
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setEnabled(true);
            setLastScanned(null);
            setIsChecking(false);
            setToast(null);
            lastScanTimeRef.current = 0;
            lastScannedCodeRef.current = null;
        }
    }, [visible]);

    const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const canScan = (barcode: string): boolean => {
        const now = Date.now();
        const timeSinceLastScan = now - lastScanTimeRef.current;
        if (
            barcode === lastScannedCodeRef.current &&
            timeSinceLastScan < SCAN_INTERVAL
        ) {
            return false;
        }
        return true;
    };

    const handleBarcodeLookup = async (barcode: string) => {
        if (!barcode || loading || isChecking) return;

        setIsChecking(true);
        setLastScanned(barcode);
        lastScannedCodeRef.current = barcode;
        lastScanTimeRef.current = Date.now();

        try {
            const product = await getProductByBarcode(barcode);
            if (product) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                showToast(
                    `Barcode already exists for product: ${product.name}`,
                    "error"
                );
                setEnabled(true);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast(`Barcode ${barcode} is available!`, "success");
                setTimeout(() => {
                    onBarcodeScanned(barcode);
                    onClose();
                }, 1000);
            }
        } catch (error) {
            console.error("Error checking barcode:", error);
            showToast("Failed to check barcode", "error");
            setEnabled(true);
        } finally {
            setIsChecking(false);
        }
    };

    const handleBarCodeScanned = async ({ data, bounds }: any) => {
        if (!enabled || loading || isChecking) return;
        if (!canScan(data)) return;

        if (isInsideRect(bounds, scanZone)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await handleBarcodeLookup(data);
        }
    };

    if (!permission) {
        return (
            <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
                <View style={styles.container}>
                    <StatusBar barStyle="light-content" />
                    <Header
                        title="Scan Barcode"
                        onBackPress={onClose}
                        backgroundColor="#000"
                        titleColor="#fff"
                    />
                    <View style={styles.centerContainer}>
                        <Text style={styles.textLight}>Loading camera...</Text>
                    </View>
                </View>
            </Modal>
        );
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
                <View style={styles.container}>
                    <StatusBar barStyle="light-content" />
                    <Header
                        title="Scan Barcode"
                        onBackPress={onClose}
                        backgroundColor="#000"
                        titleColor="#fff"
                    />
                    <View style={styles.centerContainer}>
                        <View style={styles.permissionCard}>
                            <Ionicons name="alert-circle-outline" size={48} color="#ED277C" />
                            <Text style={styles.permissionTitle}>Camera Access Required</Text>
                            <Text style={styles.permissionDescription}>
                                We need camera access to scan barcodes.
                            </Text>
                            <TouchableOpacity
                                style={styles.permissionButton}
                                onPress={requestPermission}
                                activeOpacity={1}
                            >
                                <Text style={styles.permissionButtonText}>Enable Camera</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <Header
                    title="Scan Barcode"
                    onBackPress={onClose}
                    backgroundColor="#000"
                    titleColor="#fff"
                />

                <DscToast
                    visible={!!toast}
                    message={toast?.message || ""}
                    type={toast?.type || "success"}
                    onClose={() => setToast(null)}
                    showCloseButton
                />

                <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "code128", "ean13", "ean8", "upc_a", "upc_e"],
                    }}
                    onBarcodeScanned={handleBarCodeScanned}
                />

                {/* Overlay with scan zone */}
                <View style={styles.overlay} pointerEvents="none">
                    <View style={[styles.darkOverlay, { height: scanZone.y }]}>
                        <View style={styles.statusContainer}>
                            <View style={styles.statusBadge}>
                                <Ionicons
                                    name={isChecking || loading ? "sync" : "scan-outline"}
                                    size={16}
                                    color="#fff"
                                />
                                <Text style={styles.statusText}>
                                    {isChecking || loading ? "Checking barcode..." : "Ready to scan"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.middleRow}>
                        <View style={[styles.darkOverlay, { width: scanZone.x }]} />
                        <View
                            style={[
                                styles.scanZone,
                                { width: scanZone.width, height: scanZone.height },
                            ]}
                        >
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                        <View
                            style={[
                                styles.darkOverlay,
                                { width: screenWidth - scanZone.x - scanZone.width },
                            ]}
                        />
                    </View>

                    <View style={[styles.darkOverlay, { flex: 1 }]}>
                        <View style={styles.bottomContent}>
                            {lastScanned && (
                                <View style={styles.lastScanned}>
                                    <Text style={styles.lastScannedText}>Last: {lastScanned}</Text>
                                </View>
                            )}
                            <Text style={styles.instruction}>
                                Position barcode in the frame
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Cancel button - matching the back button style from InventoryBarcode */}
                <View style={styles.buttonContainer} pointerEvents="box-none">
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        activeOpacity={1}
                    >
                        <Ionicons name="close" size={20} color="#ED277C" />
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    darkOverlay: {
        backgroundColor: "rgba(0,0,0,0.7)",
    },
    statusContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.8)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    statusText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    middleRow: {
        flexDirection: "row",
        height: scanZone.height,
    },
    scanZone: {
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
    },
    corner: {
        position: "absolute",
        width: 24,
        height: 24,
        borderColor: "#ED277C",
        borderWidth: 3,
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    bottomContent: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 110,
    },
    lastScanned: {
        backgroundColor: "rgba(0,0,0,0.8)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 12,
    },
    lastScannedText: {
        color: "#ED277C",
        fontSize: 12,
        fontWeight: "500",
    },
    instruction: {
        color: "#fff",
        fontSize: 14,
        backgroundColor: "rgba(0,0,0,0.8)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 20,
    },
    buttonContainer: {
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 20,
    },
    cancelButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.8)",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: "#ED277C",
        minWidth: "60%",
    },
    cancelButtonText: {
        color: "#ED277C",
        fontSize: 14,
        fontWeight: "600",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        padding: 20,
    },
    textLight: {
        color: "#fff",
        fontSize: 16,
    },
    permissionCard: {
        backgroundColor: "#111",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        width: "100%",
        maxWidth: 320,
        gap: 16,
    },
    permissionTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    permissionDescription: {
        color: "#aaa",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
    permissionButton: {
        backgroundColor: "#ED277C",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        width: "100%",
        alignItems: "center",
    },
    permissionButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});