// constants/inventory.constants.ts
export const STOCK_STATUS_OPTIONS = [
    { id: "in_stock", label: "In Stock" },
    { id: "low_stock", label: "Low Stock" },
    { id: "out_of_stock", label: "Out of Stock" },
] as const;

export const STOCK_STATUS_COLORS = {
    in_stock: {
        label: "In Stock",
        color: "#4CAF50",
        bg: "#E8F5E9"
    },
    low_stock: {
        label: "Low Stock",
        color: "#FF9800",
        bg: "#FFF4E0"
    },
    out_of_stock: {
        label: "Out of Stock",
        color: "#F44336",
        bg: "#FFE5E5"
    },
} as const;

export const PERMISSION_KEYS = {
    VIEW_INVENTORY: "view_inventory",
    ADD_ITEM: "add_item",
    EDIT_ITEMS: "edit_items",
    RESTOCK_ITEMS: "restock_items",
    DEDUCT_ITEMS: "deduct_items",
    REMOVE_ITEMS: "remove_items",
    CREATE_CATEGORIES: "create_categories",
    REMOVE_CATEGORIES: "remove_categories",
} as const;

export const ACTION_BUTTONS = {
    view: { icon: "eye-outline", label: "View", color: "#ED277C" },
    add: { icon: "add-circle-outline", label: "Add", color: "#ED277C" },
    edit: { icon: "create-outline", label: "Edit", color: "#ED277C" },
    restock: { icon: "refresh-outline", label: "Restock", color: "#ED277C" },
    deduct: { icon: "remove-circle-outline", label: "Deduct", color: "#ED277C" },
    remove: { icon: "trash-outline", label: "Remove", color: "#F44336" },
} as const;

export const TOAST_DURATION = 3000;
export const SEARCH_DEBOUNCE_MS = 400;
export const DEFAULT_PAGE_SIZE = 50;