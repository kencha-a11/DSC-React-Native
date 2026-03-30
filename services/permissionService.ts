// services/permissionService.ts
import api from '@/api/axios';
import {
    PermissionsApiResponse,
    ProductPermissions,
    UpdatePermissionsResponse
} from '@/types/permission.types';

// ------------------------------
// Types
// ------------------------------
interface CacheEntry {
    data: ProductPermissions;
    timestamp: number;
}

interface ServiceConfig {
    cacheTTL: number;        // Time to live in ms
    maxRetries: number;       // Max retry attempts
    retryDelay: number;       // Base retry delay in ms
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
// const log = {
//     debug: (...args: any[]) => __DEV__ && console.log("🔑 [PermissionService]", ...args),
//     info: (...args: any[]) => __DEV__ && console.log("🔑 [PermissionService] ℹ️", ...args),
//     warn: (...args: any[]) => __DEV__ && console.warn("🔑 [PermissionService] ⚠️", ...args),
//     error: (...args: any[]) => console.error("🔑 [PermissionService] ❌", ...args),
// };

// ------------------------------
// Configuration
// ------------------------------
const DEFAULT_CONFIG: ServiceConfig = {
    cacheTTL: 5 * 60 * 1000,  // 5 minutes
    maxRetries: 3,
    retryDelay: 1000,
};

// ------------------------------
// Cache & Pending Requests
// ------------------------------
const permissionCache = new Map<number, CacheEntry>();
const pendingRequests = new Map<number, Promise<ProductPermissions | null>>();

// ------------------------------
// Retry helper with exponential backoff
// ------------------------------
const fetchWithRetry = async <T>(
    fn: () => Promise<T>,
    config: ServiceConfig = DEFAULT_CONFIG
): Promise<T> => {
    let lastError: any;

    for (let i = 0; i < config.maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry client errors (4xx)
            if (error.response?.status >= 400 && error.response?.status < 500) {
                throw error;
            }

            // Don't retry if it's the last attempt
            if (i === config.maxRetries - 1) break;

            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.min(
                config.retryDelay * Math.pow(2, i),
                5000 // Max 5 seconds
            );

            log.debug(`Retry attempt ${i + 1}/${config.maxRetries} after ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
        }
    }

    throw lastError;
};

// ------------------------------
// Service implementation
// ------------------------------
export const permissionService = {
    /**
     * Get user permissions with caching and deduplication
     */
    getUserPermissions: async (
        userId: number,
        options?: { force?: boolean; config?: Partial<ServiceConfig> }
    ): Promise<ProductPermissions | null> => {
        const { force = false, config = {} } = options || {};
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };

        log.debug(`Getting permissions for user ${userId}${force ? ' (forced)' : ''}`);

        // Check cache first
        if (!force) {
            const cached = permissionCache.get(userId);
            if (cached && Date.now() - cached.timestamp < mergedConfig.cacheTTL) {
                log.debug(`Returning cached permissions for user ${userId}`);
                return cached.data;
            }
        }

        // Deduplicate in-flight requests - FIXED TYPE ISSUE
        if (pendingRequests.has(userId)) {
            const pending = pendingRequests.get(userId);
            if (pending) {
                log.debug(`Reusing pending request for user ${userId}`);
                return pending;
            }
        }

        // Create request promise
        const promise = (async (): Promise<ProductPermissions | null> => {
            try {
                const response = await fetchWithRetry(
                    () => api.get<PermissionsApiResponse>(`/permissions/user/${userId}`),
                    mergedConfig
                );

                if (!response.data.success) {
                    log.warn(`API returned success=false for user ${userId}:`, response.data.message);

                    // Return stale cache if available
                    const stale = permissionCache.get(userId);
                    if (stale) {
                        log.debug(`Returning stale cache for user ${userId}`);
                        return stale.data;
                    }

                    return null;
                }

                if (response.data.permissions) {
                    // Update cache
                    permissionCache.set(userId, {
                        data: response.data.permissions,
                        timestamp: Date.now()
                    });

                    log.debug(`Successfully fetched permissions for user ${userId}`);
                    return response.data.permissions;
                }

                return null;
            } catch (error: any) {
                log.error(`Failed to fetch permissions for user ${userId}:`, error.message);

                // Return stale cache on error
                const stale = permissionCache.get(userId);
                if (stale) {
                    log.debug(`Returning stale cache for user ${userId} due to error`);
                    return stale.data;
                }

                throw error;
            } finally {
                pendingRequests.delete(userId);
            }
        })();

        pendingRequests.set(userId, promise);
        return promise;
    },

    /**
     * Update user permissions with optimistic update
     */
    updateUserPermissions: async (
        userId: number,
        permissions: Partial<ProductPermissions>,
        config?: Partial<ServiceConfig>
    ): Promise<ProductPermissions> => {
        log.debug(`Updating permissions for user ${userId}`);

        // Store previous state for rollback
        const previousEntry = permissionCache.get(userId);
        const previousPermissions = previousEntry?.data;

        // Optimistic update
        if (previousPermissions) {
            permissionCache.set(userId, {
                data: { ...previousPermissions, ...permissions },
                timestamp: Date.now()
            });
            log.debug(`Optimistically updated cache for user ${userId}`);
        }

        try {
            const response = await fetchWithRetry(
                () => api.post<UpdatePermissionsResponse>(
                    `/permissions/user/${userId}/update`,
                    permissions
                ),
                { ...DEFAULT_CONFIG, ...config }
            );

            // Update cache with server response
            permissionCache.set(userId, {
                data: response.data.permissions,
                timestamp: Date.now()
            });

            log.debug(`Successfully updated permissions for user ${userId}`);
            return response.data.permissions;
        } catch (error) {
            // Rollback on error
            if (previousEntry) {
                permissionCache.set(userId, previousEntry);
                log.debug(`Rolled back cache for user ${userId} due to error`);
            }
            log.error(`Failed to update permissions for user ${userId}:`, error);
            throw error;
        }
    },

    /**
     * Reset user permissions to default
     */
    resetUserPermissions: async (userId: number): Promise<void> => {
        log.debug(`Resetting permissions for user ${userId}`);

        try {
            await fetchWithRetry(
                () => api.delete(`/permissions/user/${userId}/reset`)
            );

            // Invalidate cache
            permissionCache.delete(userId);

            log.debug(`Successfully reset permissions for user ${userId}`);
        } catch (error) {
            log.error(`Failed to reset permissions for user ${userId}:`, error);
            throw error;
        }
    },

    /**
     * Clear permission cache for a user or all users
     */
    clearCache: (userId?: number): void => {
        if (userId) {
            permissionCache.delete(userId);
            log.debug(`Cleared cache for user ${userId}`);
        } else {
            permissionCache.clear();
            log.debug("Cleared entire permission cache");
        }
    },

    /**
     * Prefetch permissions for a user (useful for anticipated navigation)
     */
    prefetchPermissions: async (userId: number): Promise<void> => {
        // Don't wait for this - fire and forget
        permissionService.getUserPermissions(userId).catch(() => {
            // Silently fail - this is just a prefetch
        });
    },
};