// styles/inventory.styles.ts
import { StyleSheet } from "react-native";

// ─── Border Radius Tokens ─────────────────────────────────────────────────────
const RADIUS = {
    none: 0,
    xs: 4,      // very small elements (badge corners, selection checkbox)
    sm: 8,      // small buttons, icons
    md: 12,     // medium containers (cards, modals)
    lg: 16,     // large containers (optional)
    pill: 9999, // fully rounded
};

export const styles = StyleSheet.create({
    // ─── Global ────────────────────────────────────────────────────────────────
    container: {
        flex: 1,
        backgroundColor: "#ffffffff",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    accessDenied: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginTop: 16,
        marginBottom: 8,
    },
    accessDeniedSub: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
    },

    // ─── Search & Filter Bar ───────────────────────────────────────────────────
    searchContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#ffffffff",
        gap: 10,
    },
    search: {
        flex: 1,
        height: 45,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        backgroundColor: "#ffffffff",
        borderRadius: RADIUS.md,          // 12
    },
    filterToggle: {
        width: 45,
        height: 45,
        backgroundColor: "#ffffffff",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        position: "relative",
        borderRadius: RADIUS.md,          // 12
    },
    filterToggleActive: {
        backgroundColor: "#ED277C",
        borderColor: "#ED277C",
    },
    filterBadge: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "#ED277C",
        minWidth: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#ffffffff",
        borderRadius: RADIUS.pill,        // fully rounded
    },
    filterBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },

    // ─── Filter Panel ──────────────────────────────────────────────────────────
    filtersContainer: {
        backgroundColor: "#ffffffff",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    filterSection: {
        marginBottom: 12,
    },
    filterSectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
        marginLeft: 16,
        textTransform: "uppercase",
    },
    filterChipsContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    // For individual filter chips (used by FilterChip component)
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#f0f0f0",
        borderRadius: RADIUS.pill,        // pill shape for tags
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    chipSelected: {
        backgroundColor: "#ED277C",
        borderColor: "#ED277C",
    },
    chipText: {
        fontSize: 13,
        color: "#666",
        fontWeight: "500",
    },
    chipTextSelected: {
        color: "#fff",
    },
    chipCount: {
        fontSize: 11,
        marginLeft: 4,
        color: "#999",
    },
    chipCountSelected: {
        color: "#fff",
    },

    // ─── Quick Actions ─────────────────────────────────────────────────────────
    quickActionBar: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        gap: 12,
    },
    quickAction: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ED277C10",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#ED277C20",
        gap: 4,
        borderRadius: RADIUS.sm,          // 8
    },
    quickActionText: {
        fontSize: 12,
        color: "#ED277C",
        fontWeight: "500",
    },

    // ─── Product List ──────────────────────────────────────────────────────────
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: "#999",
        marginTop: 12,
        marginBottom: 12,
    },
    clearFiltersLink: {
        fontSize: 14,
        color: "#ED277C",
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    emptyButton: {
        backgroundColor: "#ED277C",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#ED277C",
        borderRadius: RADIUS.md,          // 12
    },
    emptyButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    // ─── Product Card ──────────────────────────────────────────────────────────
    productCard: {
        backgroundColor: "#ffffffff",
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#f0f0f0",
        borderRadius: RADIUS.md,          // 12
    },
    productRow: {
        flexDirection: "row",
        marginBottom: 12,
    },
    productImageContainer: {
        width: 60,
        height: 60,
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        backgroundColor: "#ffffffff",
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: RADIUS.sm,          // 8
        overflow: "hidden",
    },
    placeholderImage: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f8f8",
    },
    productImage: {
        width: "100%",
        height: "100%",
    },
    productContent: {
        flex: 1,
    },
    productInfo: {
        flex: 1,
        marginRight: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 2,
    },
    productCategory: {
        fontSize: 12,
        color: "#999",
    },
    stockBadge: {
        position: "absolute",
        top: 14,
        right: 14,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: RADIUS.xs,          // 4
        gap: 4,
        zIndex: 10,
    },
    stockBadgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    productDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ED277C",
    },
    productMeta: {
        alignItems: "flex-end",
    },
    productStock: {
        fontSize: 13,
        color: "#666",
        fontWeight: "500",
    },
    productSku: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
        paddingTop: 12,
        flexWrap: "wrap",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f8f8",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        minWidth: 70,
        borderRadius: RADIUS.sm,          // 8
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    actionButtonText: {
        fontSize: 11,
        fontWeight: "500",
        marginLeft: 4,
    },

    // ─── Manage Categories FAB ─────────────────────────────────────────────────
    manageCategoriesButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "#ED277C",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#ED277C",
        gap: 8,
        borderRadius: RADIUS.md,          // 12
    },
    manageCategoriesText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    // ─── Selection & Bulk ──────────────────────────────────────────────────────
    selectionCheckbox: {
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 10,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: RADIUS.xs,          // 4
        padding: 2,
    },
    clearAllFiltersButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 8,
        marginHorizontal: 16,
        backgroundColor: "#f8f8f8",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: RADIUS.md,          // 12
        gap: 6,
    },
    clearAllFiltersText: {
        fontSize: 13,
        color: "#ED277C",
        fontWeight: "500",
    },

    // ─── Modals ────────────────────────────────────────────────────────────────
    modalContainer: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    closeButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        flex: 1,
        textAlign: "center",
    },
    modalListContent: {
        padding: 16,
        paddingBottom: 100,
    },

    // ─── Scanner Button ────────────────────────────────────────────────────────
    scannerButton: {
        width: 45,
        height: 45,
        backgroundColor: "#ffffffff",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: RADIUS.md,
    },
});