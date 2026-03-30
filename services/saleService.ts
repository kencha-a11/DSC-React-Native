import api from "@/api/axios";
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
// No longer need productService import

// ==========================================
// 📦 TYPE DEFINITIONS
// ==========================================

export interface SaleItem {
    product_id: number;
    quantity: number;
    price?: number;
}

export interface CreateSalePayload {
    items: SaleItem[];
    total_amount: number;
    device_datetime?: string;
    payment_method?: string;
    notes?: string;
    idempotency_key?: string; // For duplicate prevention
}

export interface SaleResponse {
    message: string;
    sale_id: number;
    transaction_id?: string;
    created_at?: string;
}

export interface OfflineSale extends CreateSalePayload {
    queued_at: string;
    idempotency_key: string;
}

export interface SaleError {
    code: string;
    message: string;
    retryable: boolean;
}

// ==========================================
// 🔧 CONFIGURATION
// ==========================================

const DEFAULT_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const OFFLINE_SALES_KEY = 'offline_sales';

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
//     debug: (...args: any[]) => __DEV__ && console.log("💰 [SaleService]", ...args),
//     info: (...args: any[]) => __DEV__ && console.log("💰 [SaleService] ℹ️", ...args),
//     warn: (...args: any[]) => __DEV__ && console.warn("💰 [SaleService] ⚠️", ...args),
//     error: (...args: any[]) => console.error("💰 [SaleService] ❌", ...args),
// };

// ==========================================
// 🔄 IDEMPOTENCY & DEDUPLICATION
// ==========================================

let pendingSalePromise: Promise<SaleResponse> | null = null;
const processedIdempotencyKeys = new Set<string>();

// ==========================================
// 🔧 HELPER FUNCTIONS
// ==========================================

/**
 * Generate a unique idempotency key without using uuid
 * This avoids the crypto.randomValues() issue in React Native
 */
const generateIdempotencyKey = (): string => {
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2, 10);
    const random2 = Math.random().toString(36).substring(2, 10);
    const random3 = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random1}-${random2}-${random3}`;
};

/**
 * Alternative more compact key generator
 */
const generateCompactKey = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// ==========================================
// 🔄 RETRY UTILITY
// ==========================================

const fetchWithRetry = async <T>(
    fn: () => Promise<T>,
    options?: {
        retries?: number;
        context?: string;
        timeout?: number;
    }
): Promise<T> => {
    const { retries = MAX_RETRIES, context = "", timeout = DEFAULT_TIMEOUT } = options || {};

    for (let i = 0; i < retries; i++) {
        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
            });

            return await Promise.race([fn(), timeoutPromise]) as T;
        } catch (error: any) {
            const isLastAttempt = i === retries - 1;

            // Log retry attempts
            if (!isLastAttempt && __DEV__) {
                log.debug(`Retry ${i + 1}/${retries} for ${context}`, {
                    status: error.response?.status,
                    message: error.message
                });
            }

            // Don't retry certain errors
            if (error.response?.status === 409) { // Conflict (duplicate)
                throw error;
            }

            if (error.response?.status === 422) { // Validation error
                throw error;
            }

            if (isLastAttempt) throw error;

            // Exponential backoff with jitter
            const baseDelay = Math.min(1000 * Math.pow(2, i), 5000);
            const jitter = Math.random() * 200;
            await new Promise(r => setTimeout(r, baseDelay + jitter));
        }
    }

    throw new Error(`Max retries exceeded for ${context}`);
};

// ==========================================
// 📋 SALE SERVICE OBJECT
// ==========================================

export const saleService = {
    /**
     * Create a new sale with idempotency and offline support
     */
    createSale: async (
        payload: CreateSalePayload,
        options?: {
            timeout?: number;
            signal?: AbortSignal;
            allowOffline?: boolean;
            idempotencyKey?: string;
        }
    ): Promise<SaleResponse> => {
        const startTime = performance.now();
        // Use custom generator instead of uuidv4
        const idempotencyKey = options?.idempotencyKey || generateIdempotencyKey();

        log.debug("Creating sale", {
            items: payload.items.length,
            total: payload.total_amount,
            idempotencyKey
        });

        // Check for duplicate in this session
        if (processedIdempotencyKeys.has(idempotencyKey)) {
            log.warn("Duplicate sale detected in same session:", idempotencyKey);
            throw new Error("This sale appears to be a duplicate");
        }

        // Check for pending sale (double-click prevention)
        if (pendingSalePromise) {
            log.debug("Sale already in progress, reusing promise");
            return pendingSalePromise;
        }

        // Check network status for offline mode
        if (options?.allowOffline) {
            const netInfo = await NetInfo.fetch();

            if (!netInfo.isConnected) {
                log.warn("Offline: Queueing sale for later");

                const offlineSale: OfflineSale = {
                    ...payload,
                    queued_at: new Date().toISOString(),
                    idempotency_key: idempotencyKey
                };

                await saleService.queueOfflineSale(offlineSale);

                return {
                    message: 'Sale queued for sync',
                    sale_id: -1,
                    transaction_id: `offline_${Date.now()}`
                };
            }
        }

        // Create the sale promise
        pendingSalePromise = (async () => {
            try {
                const response = await fetchWithRetry(
                    () => api.post<SaleResponse>("/sales/store", {
                        ...payload,
                        idempotency_key: idempotencyKey
                    }, {
                        signal: options?.signal
                    }),
                    {
                        context: 'createSale',
                        timeout: options?.timeout
                    }
                );

                // Mark as processed
                processedIdempotencyKeys.add(idempotencyKey);

                // Clean up old keys after 1 hour
                setTimeout(() => {
                    processedIdempotencyKeys.delete(idempotencyKey);
                }, 60 * 60 * 1000);

                // Invalidate product caches (stock changed)
                // No cache clear needed – product stock is refreshed via ProductContext.refreshProduct()

                // Performance monitoring
                const duration = performance.now() - startTime;
                if (duration > 2000) {
                    log.warn(`Slow sale processing: ${duration.toFixed(0)}ms`);
                }

                log.debug(`Sale ${response.data.sale_id} created successfully in ${duration.toFixed(0)}ms`);
                return response.data;

            } catch (error: any) {
                // Handle specific error types
                if (error.name === 'AbortError') {
                    log.debug('Sale request aborted');
                    throw error;
                }

                if (error.response?.status === 409) {
                    log.warn('Duplicate sale detected:', idempotencyKey);
                    throw new Error('This sale appears to be a duplicate');
                }

                if (error.response?.status === 422) {
                    const message = error.response.data?.message || 'Invalid sale data';
                    log.error('Validation error:', message);
                    throw new Error(message);
                }

                if (error.message.includes('timeout')) {
                    log.error('Sale timed out');
                    throw new Error('Sale request timed out. Please check if it was processed.');
                }

                log.error('Failed to create sale:', {
                    status: error.response?.status,
                    message: error.message
                });

                throw new Error(error.response?.data?.message || 'Failed to create sale');
            } finally {
                pendingSalePromise = null;
            }
        })();

        return pendingSalePromise;
    },

    /**
     * Queue a sale for offline processing
     */
    queueOfflineSale: async (sale: OfflineSale): Promise<void> => {
        try {
            const existing = await AsyncStorage.getItem(OFFLINE_SALES_KEY);
            const queue: OfflineSale[] = existing ? JSON.parse(existing) : [];

            queue.push(sale);

            await AsyncStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(queue));

            log.debug(`Sale queued offline. Queue size: ${queue.length}`);
        } catch (error) {
            log.error('Failed to queue offline sale:', error);
            throw new Error('Could not save sale for offline processing');
        }
    },

    /**
     * Sync pending offline sales
     */
    syncOfflineSales: async (): Promise<{ synced: number; failed: number }> => {
        log.debug('Syncing offline sales');

        try {
            const existing = await AsyncStorage.getItem(OFFLINE_SALES_KEY);
            if (!existing) {
                return { synced: 0, failed: 0 };
            }

            const queue: OfflineSale[] = JSON.parse(existing);
            const failed: OfflineSale[] = [];
            let synced = 0;

            for (const sale of queue) {
                try {
                    await saleService.createSale(sale, {
                        idempotencyKey: sale.idempotency_key,
                        timeout: 30000 // Longer timeout for sync
                    });
                    synced++;
                } catch (error) {
                    log.error('Failed to sync offline sale:', error);
                    failed.push(sale);
                }
            }

            // Update queue with failed items only
            await AsyncStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(failed));

            log.debug(`Sync complete: ${synced} synced, ${failed.length} failed`);
            return { synced, failed: failed.length };

        } catch (error) {
            log.error('Failed to sync offline sales:', error);
            throw error;
        }
    },

    /**
     * Get pending offline sales count
     */
    getOfflineSalesCount: async (): Promise<number> => {
        try {
            const existing = await AsyncStorage.getItem(OFFLINE_SALES_KEY);
            return existing ? JSON.parse(existing).length : 0;
        } catch {
            return 0;
        }
    },

    /**
     * Clear processed idempotency keys (for testing)
     */
    clearProcessedKeys: () => {
        processedIdempotencyKeys.clear();
    },

    /**
     * Get sale by ID
     */
    getSale: async (saleId: number): Promise<any> => {
        try {
            const response = await api.get(`/sales/${saleId}`);
            return response.data;
        } catch (error: any) {
            log.error(`Failed to fetch sale ${saleId}:`, error.message);
            throw error;
        }
    },

    /**
     * Get sales history with pagination
     */
    getSalesHistory: async (params?: {
        page?: number;
        perPage?: number;
        from?: string;
        to?: string;
    }): Promise<any> => {
        try {
            const response = await api.get('/sales', { params });
            return response.data;
        } catch (error: any) {
            log.error('Failed to fetch sales history:', error.message);
            throw error;
        }
    }
};

// ==========================================
// 📊 MONITORING (Optional)
// ==========================================

let salesMetrics = {
    total: 0,
    offline: 0,
    failed: 0,
    totalAmount: 0
};

export const getSalesMetrics = () => ({ ...salesMetrics });

export const resetSalesMetrics = () => {
    salesMetrics = { total: 0, offline: 0, failed: 0, totalAmount: 0 };
};

// Auto-sync offline sales when network comes back
if (typeof window !== 'undefined') {
    NetInfo.addEventListener(state => {
        if (state.isConnected) {
            saleService.syncOfflineSales().catch(() => { });
        }
    });
}