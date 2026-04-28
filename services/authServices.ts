import { api, CanceledError } from '../api/axios';
import * as SecureStore from 'expo-secure-store';

// ------------------------------
// Types
// ------------------------------
export interface User {
    id: number;
    first_name: string;
    last_name: string;
    role: 'cashier' | 'manager' | 'superadmin';
    account_status?: string;
    email?: string;
    phone_number?: string;
}

export interface TimeLog {
    id: number;
    user_id: number;
    start_time: string;
    status: string;
    duration: number;
}

// Response types for authentication
export interface CheckPinResponse {
    requirePassword: boolean;
    userId?: number;
    user?: User;
    timeLog?: TimeLog;
    token?: string;
}

export interface VerifyPasswordResponse {
    user: User;
    timeLog: TimeLog;
    token: string;
}

// ------------------------------
// Environment-aware logging
// ------------------------------
const log = {
    debug: (...args: any[]) => { },
    info: (...args: any[]) => { },
    warn: (...args: any[]) => { },
    error: (...args: any[]) => { },
};

// ------------------------------
// Timezone cache
// ------------------------------
const getTimezone = (() => {
    let timezone: string;
    return () => {
        if (!timezone) {
            timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        return timezone;
    };
})();

// ------------------------------
// Error message helper
// ------------------------------
const extractErrorMessage = (error: any, defaultMessage: string): string => {
    // Handle cancellation errors
    if (error instanceof CanceledError || error.code === 'ERR_CANCELED') {
        return 'Operation cancelled';
    }
    
    // Handle our custom errors
    if (error.message && !error.response) {
        return error.message;
    }

    // Handle 422 validation errors
    if (error.response?.status === 422) {
        const errors = error.response.data?.errors;
        // Check for pin_code or password errors
        const fieldError = errors?.pin_code?.[0] || errors?.password?.[0];
        return fieldError || error.response.data?.message || defaultMessage;
    }

    // Network errors
    if (error.request && !error.response) {
        return 'Network connection error. Please check your internet.';
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
        return error.response.data?.message || 'Invalid credentials';
    }

    // Handle 403 errors
    if (error.response?.status === 403) {
        return error.response.data?.message || 'Access denied';
    }

    // Handle 500 errors
    if (error.response?.status >= 500) {
        return 'Server error. Please try again later.';
    }

    return error.response?.data?.message || error.message || defaultMessage;
};

// ------------------------------
// Request deduplication & caching
// ------------------------------
let userCache: { data: User; timestamp: number } | null = null;
let userPromise: Promise<User> | null = null;
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ------------------------------
// PIN Authentication (Step 1: Check PIN)
// ------------------------------
export const checkPin = async (pinCode: string): Promise<CheckPinResponse> => {
    log.debug("Checking PIN");

    try {
        const payload = {
            pin_code: pinCode,
            timezone: getTimezone()
        };

        const response = await api.post('/auth/check/pin', payload);
        log.debug("PIN check response:", response.data);

        // Manager/Superadmin flow
        if (response.data.require_password) {
            log.debug("Password required for user:", response.data.user_id);
            return {
                requirePassword: true,
                userId: response.data.user_id,
            };
        }

        // Cashier flow - store token
        if (response.data.token) {
            await SecureStore.setItemAsync('auth_token', response.data.token);
        }

        // Clear user cache on new login
        userCache = null;

        log.debug("Cashier authenticated successfully");

        return {
            requirePassword: false,
            user: response.data.user,
            timeLog: response.data.time_log,
            token: response.data.token,
        };
    } catch (error: any) {
        const errorMessage = extractErrorMessage(error, 'PIN verification failed');
        log.error("PIN check failed:", errorMessage);
        throw new Error(errorMessage);
    }
};

// ------------------------------
// Password Verification (Step 2)
// ------------------------------
export const verifyPassword = async (
    userId: number,
    password: string
): Promise<VerifyPasswordResponse> => {
    log.debug("Verifying password for user:", userId);

    try {
        const payload = {
            user_id: userId,
            password,
            timezone: getTimezone()
        };

        const response = await api.post('/auth/verify/password', payload);
        log.debug("Password verification response:", response.data);

        // Store token
        if (response.data.token) {
            await SecureStore.setItemAsync('auth_token', response.data.token);
        }

        // Clear user cache
        userCache = null;

        log.debug("Password verification successful");

        return {
            user: response.data.user,
            timeLog: response.data.time_log,
            token: response.data.token,
        };
    } catch (error: any) {
        const errorMessage = extractErrorMessage(error, 'Wrong Password');
        log.error("Password verification failed:", errorMessage);
        throw new Error(errorMessage);
    }
};

// ------------------------------
// Get authenticated user (with caching)
// ------------------------------
export const getUser = async (force = false): Promise<User> => {
    log.debug("Getting user data" + (force ? " (forced)" : ""));

    // Check cache first
    if (!force && userCache && Date.now() - userCache.timestamp < USER_CACHE_TTL) {
        log.debug("Returning cached user data");
        return userCache.data;
    }

    // Deduplicate in-flight requests
    if (userPromise) {
        log.debug("Reusing existing user request");
        return userPromise;
    }

    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
        throw new Error('No auth token');
    }

    userPromise = (async () => {
        try {
            const { data } = await api.get('/user');

            // Update cache
            userCache = {
                data,
                timestamp: Date.now()
            };

            log.debug("User data fetched successfully");
            return data;
        } catch (error: any) {
            // Clear token on 401, but not on cancellation
            if (error.response?.status === 401) {
                await SecureStore.deleteItemAsync('auth_token');
                userCache = null;
            }
            throw error;
        } finally {
            userPromise = null;
        }
    })();

    return userPromise;
};

// ------------------------------
// Logout user
// ------------------------------
export const logout = async (): Promise<void> => {
    log.debug("Logging out");

    try {
        await api.post('/logout', null, {
            headers: { 'X-Device-Timezone': getTimezone() },
        });
    } catch (error: any) {
        // Ignore cancellation errors and network errors during logout
        if (!(error instanceof CanceledError) && 
            error.code !== 'ERR_CANCELED' && 
            error.message !== 'Operation cancelled') {
            log.warn("Logout API error (ignored):", error);
        }
    } finally {
        // Always clear local state
        await SecureStore.deleteItemAsync('auth_token');
        userCache = null;
        userPromise = null;
        log.debug("Logout complete");
    }
};