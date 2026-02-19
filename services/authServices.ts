// src/services/authServices.ts
import { api } from '../api/axios';
import * as SecureStore from 'expo-secure-store';

// ------------------------------
// Types
// ------------------------------
export interface User {
    id: number;
    first_name: string;
    last_name: string;
    role: 'cashier' | 'manager' | 'superadmin';
}

export interface TimeLog {
    id: number;
    user_id: number;
    start_time: string;
    status: string;
    duration: number;
}

export interface CheckPinResponse {
    requirePassword: boolean;
    userId?: number;
    user?: User;
    timeLog?: TimeLog;
    token?: string;
    message?: string;
}

export interface VerifyPasswordResponse {
    user: User;
    timeLog: TimeLog;
    token: string;
    message: string;
}

// ------------------------------
// PIN Authentication (Step 1: Check PIN)
// ------------------------------
export const checkPin = async (pinCode: string): Promise<CheckPinResponse> => {
    console.log('[authService] checkPin called with PIN:', pinCode.substring(0, 2) + '***');

    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const payload = { pin_code: pinCode, timezone };

        console.log('🔹 Sending to /auth/check/pin');

        const response = await api.post('/auth/check/pin', payload);

        console.log('✅ PIN check response:', response.data);

        // Case 1: Manager/Superadmin - require password
        if (response.data.require_password) {
            console.log('🔹 Password required for user ID:', response.data.user_id);
            return {
                requirePassword: true,
                userId: response.data.user_id,
            };
        }

        // Case 2: Cashier - authenticated immediately
        console.log('🔹 Cashier authenticated, storing token');
        await SecureStore.setItemAsync('auth_token', response.data.token);

        return {
            requirePassword: false,
            user: response.data.user,
            timeLog: response.data.time_log,
            token: response.data.token,
            message: response.data.message,
        };
    } catch (error: any) {
        console.error('❌ PIN check failed:', error.response?.data || error);

        // Extract error message from Laravel validation
        const errorMessage = error.response?.data?.errors?.pin_code?.[0]
            || error.response?.data?.message
            || 'PIN verification failed';

        throw new Error(errorMessage);
    }
};

// ------------------------------
// Password Verification (Step 2: Manager/Superadmin)
// ------------------------------
export const verifyPassword = async (
    userId: number,
    password: string
): Promise<VerifyPasswordResponse> => {
    console.log('[authService] verifyPassword called for user ID:', userId);

    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const payload = { user_id: userId, password, timezone };

        console.log('🔹 Sending POST to /auth/verify/password');

        const response = await api.post('/auth/verify/password', payload);

        console.log('✅ Password verification successful:', response.data);

        // Store token
        await SecureStore.setItemAsync('auth_token', response.data.token);
        console.log('🔹 Token stored for manager/superadmin');

        return {
            user: response.data.user,
            timeLog: response.data.time_log,
            token: response.data.token,
            message: response.data.message,
        };
    } catch (error: any) {
        console.error('❌ Password verification failed:', error.response?.data || error);

        // Extract error message from Laravel validation
        const errorMessage = error.response?.data?.errors?.password?.[0]
            || error.response?.data?.message
            || 'Wrong Password';

        throw new Error(errorMessage);
    }
};

// ------------------------------
// Get authenticated user
// ------------------------------
export const getUser = async (): Promise<User> => {
    console.log('[authService] getUser called');

    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
        console.log('⚠️ No token found in SecureStore');
        throw new Error('No auth token');
    }

    try {
        console.log('🔹 Sending GET to /user');

        const { data } = await api.get('/user');

        console.log('✅ Fetched user:', data);

        return data;
    } catch (error: any) {
        console.error('❌ Fetching user failed:', error.response?.data || error);

        // If 401, clear token
        if (error.response?.status === 401) {
            await SecureStore.deleteItemAsync('auth_token');
        }

        throw error;
    }
};

// ------------------------------
// Logout user
// ------------------------------
export const logout = async (): Promise<void> => {
    console.log('🔹 logout called');

    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log('🔹 Sending POST to /logout');

        await api.post('/logout', null, {
            headers: { 'X-Device-Timezone': timezone },
        });

        console.log('✅ Logout successful');
    } catch (error: any) {
        console.error('❌ Logout failed:', error);
    } finally {
        // Always clear token on logout
        await SecureStore.deleteItemAsync('auth_token');
        console.log('🔹 Token cleared from SecureStore');
    }
};