// hooks/usePermissions.ts
import { useAuth } from '@/context/AuthContext';
import { permissionService } from '@/services/permissionService';
import { PermissionKey, ProductPermissions } from '@/types/permission.types';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

// Default permissions based on role
const getDefaultPermissions = (role: string): ProductPermissions => {
    switch (role) {
        case 'superadmin':
            return {
                view_inventory: true,
                add_item: true,
                edit_items: true,
                restock_items: true,
                deduct_items: true,
                remove_items: true,
                create_categories: true,
                remove_categories: true,
            };
        case 'manager':
            return {
                view_inventory: true,
                add_item: true,
                edit_items: true,
                restock_items: true,
                deduct_items: true,
                remove_items: false,
                create_categories: true,
                remove_categories: false,
            };
        case 'cashier':
        default:
            return {
                view_inventory: true,
                add_item: false,
                edit_items: false,
                restock_items: false,
                deduct_items: false,
                remove_items: false,
                create_categories: false,
                remove_categories: false,
            };
    }
};

export const usePermissions = () => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState<ProductPermissions>(getDefaultPermissions('cashier'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPermissions = useCallback(async () => {
        if (!user) {
            setPermissions(getDefaultPermissions('cashier'));
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Try to get from cache first
            const cached = await SecureStore.getItemAsync(`user_permissions_${user.id}`);

            if (cached) {
                const cachedPerms = JSON.parse(cached);
                console.log('🔐 [usePermissions] Loaded from cache:', cachedPerms);
                setPermissions(cachedPerms);
            }

            // Fetch fresh from API
            const freshPerms = await permissionService.getUserPermissions(user.id);

            if (freshPerms) {
                console.log('🔐 [usePermissions] Loaded from API:', freshPerms);
                setPermissions(freshPerms);
                // Update cache
                await SecureStore.setItemAsync(`user_permissions_${user.id}`, JSON.stringify(freshPerms));
            } else if (!cached) {
                // No cache and no API data, use role defaults
                const defaultPerms = getDefaultPermissions(user.role);
                console.log('🔐 [usePermissions] Using role defaults:', defaultPerms);
                setPermissions(defaultPerms);
            }
        } catch (err: any) {
            console.error('🔐 [usePermissions] Error:', err.message);
            setError(err.message);

            // Fallback to role defaults on error
            if (user) {
                setPermissions(getDefaultPermissions(user.role));
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    const hasPermission = useCallback((permission: PermissionKey): boolean => {
        return permissions[permission] === true;
    }, [permissions]);

    const hasAnyPermission = useCallback((requiredPermissions: PermissionKey[]): boolean => {
        return requiredPermissions.some(p => permissions[p] === true);
    }, [permissions]);

    const hasAllPermissions = useCallback((requiredPermissions: PermissionKey[]): boolean => {
        return requiredPermissions.every(p => permissions[p] === true);
    }, [permissions]);

    const updatePermissions = useCallback(async (newPermissions: Partial<ProductPermissions>) => {
        if (!user) return;

        try {
            setLoading(true);
            await permissionService.updateUserPermissions(user.id, newPermissions);

            // Update local state
            setPermissions(prev => ({ ...prev, ...newPermissions }));

            // Update cache
            const updated = { ...permissions, ...newPermissions };
            await SecureStore.setItemAsync(`user_permissions_${user.id}`, JSON.stringify(updated));

            console.log('🔐 [usePermissions] Permissions updated successfully');
        } catch (err: any) {
            console.error('🔐 [usePermissions] Update error:', err.message);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user, permissions]);

    return {
        permissions,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        updatePermissions,
        refreshPermissions: loadPermissions,
    };
};