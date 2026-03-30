// types/permission.types.ts
export interface ProductPermissions {
    view_inventory: boolean;
    add_item: boolean;
    edit_items: boolean;
    restock_items: boolean;
    deduct_items: boolean;
    remove_items: boolean;
    create_categories: boolean;
    remove_categories: boolean;
}

export type PermissionKey = keyof ProductPermissions;

export interface PermissionsApiResponse {
    success: boolean;
    permissions: ProductPermissions | null;
    message?: string;
}

export interface UpdatePermissionsResponse {
    success: boolean;
    message: string;
    permissions: ProductPermissions;
}