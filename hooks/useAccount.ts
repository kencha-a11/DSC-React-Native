// hooks/useAccount.ts
import { useState } from 'react';
import { accountService, AccountResponse, CreateAccountPayload, UpdateAccountPayload } from '@/services/accountService';
import { permissionService } from '@/services/permissionService';

export interface AccountFormData {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password?: string;
    pinCode?: string;
    status: string;
    role: string;
}

export interface UIPermissions {
    viewInventory: boolean;
    addItems: boolean;
    editItems: boolean;
    restockItems: boolean;
    deductItems: boolean;
    removeItems: boolean;
    createCategory: boolean;
    removeCategory: boolean;
}

const toPayload = (form: AccountFormData): CreateAccountPayload => ({
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone_number: form.phoneNumber,
    password: form.password || '',
    pin_code: form.pinCode,
    account_status: form.status?.toLowerCase() || 'activated',
    role: form.role?.toLowerCase() || 'cashier',
});

const toApiPermissions = (ui: UIPermissions) => ({
    view_inventory: ui.viewInventory,
    add_item: ui.addItems,
    edit_items: ui.editItems,
    restock_items: ui.restockItems,
    deduct_items: ui.deductItems,
    remove_items: ui.removeItems,
    create_categories: ui.createCategory,
    remove_categories: ui.removeCategory,
});

export function useAccount() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createAccount = async (
        formData: AccountFormData,
        permissions: UIPermissions
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            const account = await accountService.createAccount(toPayload(formData));
            if (Object.values(permissions).some(Boolean)) {
                await permissionService.updateUserPermissions(account.id, toApiPermissions(permissions));
            }
            return true;
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Failed to create account');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateAccount = async (
        userId: number,
        formData: AccountFormData
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        // Build payload with safe defaults
        const payload: UpdateAccountPayload = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone_number: formData.phoneNumber,
        };

        // Only add status and role if they exist
        if (formData.status) {
            payload.account_status = formData.status.toLowerCase();
        }

        if (formData.role) {
            payload.role = formData.role.toLowerCase();
        }

        // Only include password if it was provided (not empty)
        if (formData.password && formData.password.trim() !== '') {
            payload.password = formData.password;
        }

        // Only include PIN if it was provided (not empty)
        if (formData.pinCode && formData.pinCode.trim() !== '') {
            payload.pin_code = formData.pinCode;
        }

        try {
            await accountService.updateAccount(userId, payload);
            return true;
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Failed to update account');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { createAccount, updateAccount, loading, error };
}