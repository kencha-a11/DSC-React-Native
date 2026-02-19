// [API LAYER] Purpose: Low‑level HTTP client used to send requests to your backend.
import axios from 'axios'
// Lightweight, promise-based HTTP client for making API requests in the browser and Node.js.
import { getApiUrl } from '@/utils/getApiURL';
// Dynamically resolves the correct backend endpoint based on the current environment (Local, Staging, or Production).
import { normalizeToUTC } from '@/utils/normalizeToUTC';
// Integrates the custom date-normalization utility into your API configuration file.
import * as SecureStore from 'expo-secure-store'
// Provides a way to encrypt and securely store key-value pairs locally on the device.

// ------------------------------
// Base URL (Expo-safe) 
// ------------------------------
const BASE_API_URL = getApiUrl();
// console.log('🔹 API Base URL:', BASE_API_URL);
// Root endpoint for API calls, sourced from environment variables for different deployment stages.
// if (!BASE_API_URL) {console.warn('⚠️ EXPO_PUBLIC_API_URL is not defined')}

// ------------------------------
// Axios Instance
// ------------------------------
export const apiInstance = axios.create({
    baseURL: BASE_API_URL,
    // Sets the prefix for all request URLs, allowing for shorter relative paths in API calls.
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    // Defines standard communication formats to ensure the server sends and receives JSON data.
    timeout: 10000,
    // Aborts the request if no response is received within 10 seconds to prevent hanging calls.
});
// Custom Axios instance to centralize configuration, such as base URLs, timeouts, and headers.

// ------------------------------
// Request Interceptor
// ------------------------------
apiInstance.interceptors.request.use(
    // Middleware that processes or modifies outgoing requests before they are sent to the server.
    async (config) => {
        // Asynchronous handler to prepare the request configuration, often used to inject auth tokens.
        config.headers['X-Device-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Injects the user's local IANA timezone into the headers for server-side localization and logging.
        const token = await SecureStore.getItemAsync('auth_token');
        // Asynchronously fetches the encrypted authentication token from the device's secure storage.
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // console.log('🔹 Authorization header set:', token.substring(0, 16) + '...');
        }
        // Attaches the retrieved JWT to the request headers and logs a masked version for debugging.
        if (config.data) { normalizeToUTC(config.data); }
        // Pre-processes the request body to ensure all Date objects are converted to UTC before transmission.
        return config;
    },
    (error) => Promise.reject(error)
);

// ------------------------------
// Response Interceptor
// ------------------------------
apiInstance.interceptors.response.use(
    // Middleware that intercepts and processes the server's response before it reaches your application logic.
    (response) => response,
    // Passes the successful response through without modification for the calling function to handle.
    async (error) => {
    // Catches and handles API errors globally, such as network failures or HTTP error codes.
        const status = error.response?.status;
        // Safely extracts the HTTP status code (e.g., 401, 404, 500) from the error response.

        console.error('[AXIOS] API:', status, error?.response?.data);

        if (status === 401) {
            // console.warn('[ERROR] Token expired or invalid. Clearing token.');
            await SecureStore.deleteItemAsync('auth_token');
        }
        // Detects authentication failure and clears the compromised or expired session from secure storage.

        if ([502, 503, 504].includes(status) && !error.config?._retry) {
        // Detects temporary server or gateway issues and prevents infinite loops during retry attempts.
            error.config._retry = true;
            // Marks the request to prevent multiple retry attempts and avoid infinite loops on failure.
            // console.warn(`[ERROR] Server: ${status}. Retrying once...`);
            await new Promise((r) => setTimeout(r, 2000));
            // Forces a 2-second pause before proceeding, typically used to give a struggling server time to recover.
            return apiInstance(error.config);
        }
        return Promise.reject(error);
    }
);

// console.log("[AXIOS] Raw Axios Instance:", apiInstance);
// console.log("[AXIOS] API Axios Request Interceptors:", apiInstance.interceptors.request);
// console.log("[AXIOS] API Axios Response Interceptors:", apiInstance.interceptors.response);
// ------------------------------
// Exports
// ------------------------------
export const api = apiInstance;
export default api;
// Best practice: use api everywhere, keep apiInstance internal.