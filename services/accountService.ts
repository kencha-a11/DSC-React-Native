// services/accountService.ts
import api from "@/api/axios";
import { extractDataFromResponse, extractItemFromResponse, extractMessageFromResponse } from "@/utils/extractDataFromResponse";

// ==========================================
// 📦 TYPE DEFINITIONS
// ==========================================

export interface CreateAccountPayload {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    password: string;
    pin_code?: string;
    account_status: string;
    role: string;
}

export interface UpdateAccountPayload {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    password?: string;
    pin_code?: string;
    account_status?: string;
    role?: string;
}

export interface AccountResponse {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    phone_number: string;
    role: string;
    account_status: string;
    pin_code?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    hasMore: boolean;
}

export interface AccountFilters {
    page?: number;
    perPage?: number;
    search?: string;
    role?: string;
    status?: string;
}

export interface BatchAccountsResponse {
    results: Record<string, AccountResponse | null>;
    success: boolean;
}

// ==========================================
// 🔧 CONFIGURATION & CONSTANTS
// ==========================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 10000; // 10 seconds

const EMPTY_PAGINATED_RESPONSE: PaginatedResponse<any> = {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
    hasMore: false,
};

// ==========================================
// 📝 ENVIRONMENT LOGGING
// ==========================================
const log = {
    debug: (...args: any[]) => { },
    info: (...args: any[]) => { },
    warn: (...args: any[]) => { },
    error: (...args: any[]) => { },
};
// const log = {
//     debug: (...args: any[]) => __DEV__ && console.log("👤 [AccountService]", ...args),
//     info: (...args: any[]) => __DEV__ && console.log("👤 [AccountService] ℹ️", ...args),
//     warn: (...args: any[]) => __DEV__ && console.warn("👤 [AccountService] ⚠️", ...args),
//     error: (...args: any[]) => console.error("👤 [AccountService] ❌", ...args),
// };

// ==========================================
// 📊 CACHE STATS & MONITORING
// ==========================================

interface CacheStats {
    size: number;
    pendingRequests: number;
    hits: number;
    misses: number;
    bytesSaved: number;
    avgHitRate: number;
}

class CacheMonitor {
    private hits = 0;
    private misses = 0;
    private bytesSaved = 0;

    recordHit(bytes?: number) {
        this.hits++;
        if (bytes) this.bytesSaved += bytes;
    }

    recordMiss() {
        this.misses++;
    }

    getStats(): CacheStats {
        const total = this.hits + this.misses;
        return {
            size: accountCache.getSize(),
            pendingRequests: accountCache.getPendingCount(),
            hits: this.hits,
            misses: this.misses,
            bytesSaved: this.bytesSaved,
            avgHitRate: total > 0 ? (this.hits / total) * 100 : 0,
        };
    }

    reset() {
        this.hits = 0;
        this.misses = 0;
        this.bytesSaved = 0;
    }
}

const cacheMonitor = new CacheMonitor();

// ==========================================
// 💾 CACHE MANAGEMENT
// ==========================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    etag?: string;
    size?: number;
}

class AccountCache {
    private cache = new Map<string, CacheEntry<any>>();
    private pending = new Map<string, Promise<any>>();

    get<T>(key: string): CacheEntry<T> | null {
        const entry = this.cache.get(key);
        if (!entry) {
            cacheMonitor.recordMiss();
            return null;
        }

        if (Date.now() - entry.timestamp > CACHE_TTL) {
            this.cache.delete(key);
            cacheMonitor.recordMiss();
            return null;
        }

        cacheMonitor.recordHit(entry.size);
        return entry as CacheEntry<T>;
    }

    set<T>(key: string, data: T, etag?: string): void {
        const size = new TextEncoder().encode(JSON.stringify(data)).length;

        if (this.cache.size >= 100) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            etag,
            size
        });
    }

    getPending<T>(key: string): Promise<T> | null {
        return this.pending.get(key) || null;
    }

    setPending<T>(key: string, promise: Promise<T>): void {
        this.pending.set(key, promise);
        promise.finally(() => this.pending.delete(key));
    }

    invalidate(pattern?: string): void {
        if (pattern) {
            const keys = Array.from(this.cache.keys())
                .filter(key => key.includes(pattern));
            keys.forEach(key => this.cache.delete(key));
            log.debug(`Invalidated ${keys.length} cache entries matching: ${pattern}`);
        } else {
            this.cache.clear();
            log.debug("Cleared entire cache");
        }
    }

    getSize(): number {
        return this.cache.size;
    }

    getPendingCount(): number {
        return this.pending.size;
    }
}

const accountCache = new AccountCache();

// ==========================================
// 🔄 RETRY UTILITY WITH TIMEOUT
// ==========================================

const fetchWithRetry = async <T>(
    fn: () => Promise<T>,
    options?: {
        retries?: number;
        context?: string;
        timeout?: number;
    }
): Promise<T> => {
    const {
        retries = MAX_RETRIES,
        context = "",
        timeout = DEFAULT_TIMEOUT
    } = options || {};

    for (let i = 0; i < retries; i++) {
        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
            });

            return await Promise.race([fn(), timeoutPromise]) as T;
        } catch (error: any) {
            const isLastAttempt = i === retries - 1;

            if (!isLastAttempt && __DEV__) {
                log.debug(`Retry ${i + 1}/${retries} for ${context}`, {
                    status: error.response?.status,
                    message: error.message,
                    timeout: error.message.includes('timeout') ? true : false
                });
            }

            if (error.response?.status >= 400 &&
                error.response?.status < 500 &&
                error.response?.status !== 429) {
                throw error;
            }

            if (isLastAttempt) throw error;

            const baseDelay = Math.min(1000 * Math.pow(2, i), 5000);
            const jitter = Math.random() * 200;
            await new Promise(r => setTimeout(r, baseDelay + jitter));
        }
    }

    throw new Error(`Max retries exceeded for ${context}`);
};

// ==========================================
// 🔧 HELPER FUNCTIONS
// ==========================================

const buildCacheKey = (endpoint: string, filters: AccountFilters = {}): string => {
    const { page = 1, perPage = 50, search = "", role = "", status = "" } = filters;
    return `${endpoint}:${page}:${perPage}:${search}:${role}:${status}`;
};

const buildParams = (filters: AccountFilters = {}) => {
    const { page = 1, perPage = 50, search = "", role = "", status = "" } = filters;
    return {
        page,
        perPage,
        search,
        ...(role && role.trim() !== "" ? { role } : {}),
        ...(status && status.trim() !== "" ? { status } : {}),
    };
};

// ==========================================
// 📋 ACCOUNT SERVICE
// ==========================================

export const accountService = {
    /**
     * Get paginated accounts with filters
     */
    getAccounts: async (
        filters?: AccountFilters,
        options?: { force?: boolean; signal?: AbortSignal; timeout?: number }
    ): Promise<PaginatedResponse<AccountResponse>> => {
        const endpoint = "/users";
        const cacheKey = buildCacheKey(endpoint, filters);
        const { force = false, signal, timeout } = options || {};

        log.debug("Fetching accounts", { filters, force });

        if (!force) {
            const cached = accountCache.get<PaginatedResponse<AccountResponse>>(cacheKey);
            if (cached) {
                log.debug(`Cache hit for ${cacheKey}`);
                return cached.data;
            }
        }

        const pending = accountCache.getPending<PaginatedResponse<AccountResponse>>(cacheKey);
        if (pending) {
            log.debug(`Reusing pending request for ${cacheKey}`);
            return pending;
        }

        const promise = (async () => {
            try {
                const response = await fetchWithRetry(
                    () => api.get(endpoint, {
                        params: buildParams(filters),
                        signal
                    }),
                    {
                        context: `${endpoint}:${cacheKey}`,
                        timeout
                    }
                );

                const paginatedData = extractDataFromResponse<AccountResponse>(response);

                const data: PaginatedResponse<AccountResponse> = {
                    data: paginatedData.data,
                    current_page: paginatedData.current_page,
                    last_page: paginatedData.last_page,
                    per_page: paginatedData.per_page,
                    total: paginatedData.total,
                    hasMore: paginatedData.hasMore,
                };

                accountCache.set(cacheKey, data, response.headers.etag);

                log.debug(`Successfully fetched ${data.data.length} accounts`);
                return data;
            } catch (error: any) {
                if (error.response?.status === 304) {
                    const cached = accountCache.get<PaginatedResponse<AccountResponse>>(cacheKey);
                    if (cached) {
                        log.debug(`304 - returning cached data for ${cacheKey}`);
                        return cached.data;
                    }
                }

                if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                    log.debug(`Request aborted for ${cacheKey}`);
                    throw error;
                }

                log.error("Failed to fetch accounts:", {
                    filters,
                    status: error.response?.status,
                    message: error.message,
                    timeout: error.message.includes('timeout')
                });

                return {
                    ...EMPTY_PAGINATED_RESPONSE,
                    per_page: filters?.perPage || 50
                };
            }
        })();

        accountCache.setPending(cacheKey, promise);
        return promise;
    },

    /**
     * Get single account by ID
     */
    getAccount: async (
        userId: number,
        options?: { force?: boolean; signal?: AbortSignal; timeout?: number }
    ): Promise<AccountResponse | null> => {
        const cacheKey = `account:${userId}`;
        const { force = false, signal, timeout } = options || {};

        log.debug(`Fetching account ${userId}`, { force });

        if (!force) {
            const cached = accountCache.get<AccountResponse>(cacheKey);
            if (cached) {
                log.debug(`Cache hit for account ${userId}`);
                return cached.data;
            }
        }

        const pending = accountCache.getPending<AccountResponse>(cacheKey);
        if (pending) {
            log.debug(`Reusing pending request for account ${userId}`);
            return pending;
        }

        const promise = (async () => {
            try {
                const response = await fetchWithRetry(
                    () => api.get(`/users/${userId}`, { signal }),
                    { context: `account:${userId}`, timeout }
                );

                const account = extractItemFromResponse<AccountResponse>(response);

                if (account) {
                    accountCache.set(cacheKey, account);
                }

                log.debug(`Account ${userId} fetched successfully`);
                return account;
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    throw error;
                }

                if (error.response?.status === 404) {
                    log.debug(`Account ${userId} not found`);
                    return null;
                }

                log.error(`Failed to fetch account ${userId}:`, {
                    status: error.response?.status,
                    message: error.message,
                    timeout: error.message.includes('timeout')
                });

                const stale = accountCache.get<AccountResponse>(cacheKey);
                if (stale) {
                    log.warn(`Returning stale cache for account ${userId} due to error`);
                    return stale.data;
                }

                return null;
            }
        })();

        accountCache.setPending(cacheKey, promise);
        return promise;
    },

    /**
     * Get multiple accounts by IDs (batch operation)
     */
    getMultipleAccounts: async (
        userIds: number[],
        options?: { signal?: AbortSignal; timeout?: number }
    ): Promise<Map<number, AccountResponse | null>> => {
        const results = new Map<number, AccountResponse | null>();

        log.debug(`Batch fetching ${userIds.length} accounts`);

        const uncached: number[] = [];

        for (const id of userIds) {
            const cached = accountCache.get<AccountResponse>(`account:${id}`);
            if (cached) {
                results.set(id, cached.data);
            } else {
                uncached.push(id);
            }
        }

        if (uncached.length === 0) {
            log.debug(`All ${userIds.length} accounts found in cache`);
            return results;
        }

        log.debug(`Fetching ${uncached.length} uncached accounts from API`);

        try {
            const response = await fetchWithRetry(
                () => api.post('/users/batch', {
                    ids: uncached
                }, { signal: options?.signal }),
                { context: 'batch-accounts', timeout: options?.timeout }
            );

            const data = response.data as { success: boolean; results: Record<string, AccountResponse | null> };

            if (data.success && data.results) {
                for (const [id, account] of Object.entries(data.results)) {
                    const numId = parseInt(id, 10);
                    if (account) {
                        accountCache.set(`account:${numId}`, account);
                        results.set(numId, account);
                    } else {
                        results.set(numId, null);
                    }
                }
            }

            return results;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw error;
            }

            log.error(`Failed to batch fetch accounts:`, {
                message: error.message,
                uncached: uncached.length
            });

            return results;
        }
    },

    /**
     * Create new account
     */
    createAccount: async (
        payload: CreateAccountPayload,
        options?: { signal?: AbortSignal; timeout?: number }
    ): Promise<AccountResponse> => {
        log.debug("Creating new account", { role: payload.role });

        try {
            const response = await fetchWithRetry(
                () => api.post('/users', payload, {
                    signal: options?.signal
                }),
                { context: 'createAccount', timeout: options?.timeout }
            );

            const account = extractItemFromResponse<AccountResponse>(response);

            accountCache.invalidate("/users");

            log.debug(`Account created successfully with ID: ${account.id}`);
            return account;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw error;
            }

            log.error("Failed to create account:", {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });

            if (error.response?.status === 422) {
                throw new Error(error.response.data?.message || 'Validation failed');
            }

            throw new Error(error.response?.data?.message || 'Failed to create account');
        }
    },

    /**
     * Update existing account
     */
    updateAccount: async (
        userId: number,
        payload: UpdateAccountPayload,
        options?: { signal?: AbortSignal; timeout?: number }
    ): Promise<AccountResponse> => {
        log.debug(`Updating account ${userId}`);

        try {
            const response = await fetchWithRetry(
                () => api.put(`/users/${userId}`, payload, {
                    signal: options?.signal
                }),
                { context: `updateAccount:${userId}`, timeout: options?.timeout }
            );

            const account = extractItemFromResponse<AccountResponse>(response);

            accountCache.invalidate("/users");
            accountCache.invalidate(`account:${userId}`);

            log.debug(`Account ${userId} updated successfully`);
            return account;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw error;
            }

            log.error(`Failed to update account ${userId}:`, {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });

            if (error.response?.status === 404) {
                throw new Error('Account not found');
            }

            if (error.response?.status === 422) {
                throw new Error(error.response.data?.message || 'Validation failed');
            }

            throw new Error(error.response?.data?.message || 'Failed to update account');
        }
    },

    /**
     * Delete account
     */
    deleteAccount: async (
        userId: number,
        options?: { signal?: AbortSignal }
    ): Promise<void> => {
        log.debug(`Deleting account ${userId}`);

        try {
            const response = await api.delete(`/users/${userId}`, {
                signal: options?.signal
            });

            const message = extractMessageFromResponse(response);
            log.debug(message);

            accountCache.invalidate("/users");
            accountCache.invalidate(`account:${userId}`);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw error;
            }

            log.error(`Failed to delete account ${userId}:`, {
                status: error.response?.status,
                message: error.message
            });

            throw new Error(error.response?.data?.message || 'Failed to delete account');
        }
    },

    /**
     * Delete multiple accounts
     */
    deleteMultipleAccounts: async (
        userIds: number[],
        options?: { signal?: AbortSignal }
    ): Promise<void> => {
        log.debug(`Deleting ${userIds.length} accounts`);

        try {
            const response = await api.delete("/users/multiple", {
                data: { users: userIds },
                signal: options?.signal
            });

            const message = extractMessageFromResponse(response);
            log.debug(message);

            accountCache.invalidate("/users");
            userIds.forEach(id => accountCache.invalidate(`account:${id}`));
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw error;
            }

            log.error(`Failed to delete multiple accounts:`, {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
            throw error;
        }
    },

    /**
     * Get accounts by role
     */
    getAccountsByRole: async (
        role: string,
        options?: { force?: boolean; signal?: AbortSignal }
    ): Promise<AccountResponse[]> => {
        const result = await accountService.getAccounts(
            { role, perPage: 100 },
            options
        );
        return result.data;
    },

    /**
     * Get active accounts
     */
    getActiveAccounts: async (
        options?: { force?: boolean; signal?: AbortSignal }
    ): Promise<AccountResponse[]> => {
        const result = await accountService.getAccounts(
            { status: 'active', perPage: 100 },
            options
        );
        return result.data;
    },

    // ==========================================
    // 🧹 CACHE MANAGEMENT
    // ==========================================

    clearCache: (pattern?: string) => {
        accountCache.invalidate(pattern);
    },

    getCacheStats: () => {
        return cacheMonitor.getStats();
    },

    resetStats: () => {
        cacheMonitor.reset();
    },

    // ==========================================
    // 🚀 PREFETCHING
    // ==========================================

    prefetchAccounts: async (filters?: AccountFilters): Promise<void> => {
        accountService.getAccounts(filters, { force: false }).catch(() => { });
    },

    prefetchAccount: async (userId: number): Promise<void> => {
        accountService.getAccount(userId, { force: false }).catch(() => { });
    },
};