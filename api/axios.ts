// services/api/axios.ts
import { getApiUrl } from '@/utils/getApiURL';
import { normalizeToUTC } from '@/utils/normalizeToUTC';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ------------------------------
// Environment-aware logging
// ------------------------------
const log = {
    debug: (...args: any[]) => {},
    info: (...args: any[]) => {},
    warn: (...args: any[]) => {},
    error: (...args: any[]) => {},
};
// const log = {
//     debug: (...args: any[]) => __DEV__ && console.log('🔧 [API]', ...args),
//     info: (...args: any[]) => __DEV__ && console.log('🔧 [API] ℹ️', ...args),
//     warn: (...args: any[]) => __DEV__ && console.warn('🔧 [API] ⚠️', ...args),
//     error: (...args: any[]) => console.error('🔧 [API] ❌', ...args),
// };

// ------------------------------
// Debounce helper for storage
// ------------------------------
const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// ------------------------------
// Request priority enum
// ------------------------------
enum RequestPriority {
    HIGH = 0,
    MEDIUM = 1,
    LOW = 2,
}

// ------------------------------
// Network strategy with caching
// ------------------------------
interface NetworkStrategy {
    timeout: number;
    shouldCompress: boolean;
    cacheFirst: boolean;
    shouldQueue: boolean;
}

let networkStrategyCache: { strategy: NetworkStrategy; timestamp: number } | null = null;

const getNetworkStrategy = async (force = false): Promise<NetworkStrategy> => {
    if (!force && networkStrategyCache && Date.now() - networkStrategyCache.timestamp < 5000) {
        return networkStrategyCache.strategy;
    }

    const state = await NetInfo.fetch();
    let strategy: NetworkStrategy;

    if (!state.isConnected) {
        strategy = { timeout: 30000, shouldCompress: false, cacheFirst: true, shouldQueue: true };
    } else if (state.type === 'cellular' && state.details?.cellularGeneration === '3g') {
        strategy = { timeout: 20000, shouldCompress: true, cacheFirst: true, shouldQueue: false };
    } else {
        strategy = { timeout: 10000, shouldCompress: false, cacheFirst: false, shouldQueue: false };
    }

    networkStrategyCache = { strategy, timestamp: Date.now() };
    return strategy;
};

// ------------------------------
// Retry with exponential backoff
// ------------------------------
const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            if (i === maxRetries - 1) throw error;
            if (![502, 503, 504].includes(error.response?.status)) throw error;

            const delay = Math.min(1000 * Math.pow(2, i), 10000);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw new Error('Max retries exceeded');
};

// ------------------------------
// Priority queue with proper typing
// ------------------------------
interface QueueItem<T = any> {
    request: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
}

class PriorityQueue {
    private queues: Map<RequestPriority, QueueItem[]> = new Map();
    private processing = false;

    async add<T>(priority: RequestPriority, request: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.queues.has(priority)) {
                this.queues.set(priority, []);
            }

            this.queues.get(priority)!.push({ request, resolve, reject });
            this.process();
        });
    }

    private async process() {
        if (this.processing) return;
        this.processing = true;

        try {
            for (let priority = RequestPriority.HIGH; priority <= RequestPriority.LOW; priority++) {
                const queue = this.queues.get(priority) || [];
                while (queue.length > 0) {
                    const item = queue.shift();
                    if (item) {
                        try {
                            const result = await item.request();
                            item.resolve(result);
                        } catch (error) {
                            item.reject(error);
                        }
                    }
                }
            }
        } finally {
            this.processing = false;
        }
    }
}

const priorityQueue = new PriorityQueue();

// ------------------------------
// Request batcher with proper typing
// ------------------------------
interface BatchRequest<T = any> {
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
    request: any;
}

class RequestBatcher {
    private batches = new Map<string, { requests: BatchRequest[], timer: ReturnType<typeof setTimeout> | null }>();

    constructor(private apiInstance: AxiosInstance) { }

    add<T>(key: string, request: any, delay: number = 50): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.batches.has(key)) {
                this.batches.set(key, { requests: [], timer: null });
            }

            const batch = this.batches.get(key)!;
            batch.requests.push({ resolve, reject, request });

            if (batch.timer) clearTimeout(batch.timer);
            batch.timer = setTimeout(() => this.processBatch(key), delay);
        });
    }

    private async processBatch(key: string) {
        const batch = this.batches.get(key);
        if (!batch) return;

        const requests = [...batch.requests];
        this.batches.delete(key);

        try {
            const results = await this.apiInstance.post('/batch', {
                requests: requests.map(r => r.request)
            });

            results.data.forEach((result: any, index: number) => {
                requests[index].resolve(result);
            });
        } catch (error) {
            requests.forEach(r => r.reject(error));
        }
    }
}

// ------------------------------
// Persistent cache with size limits and precise invalidation
// ------------------------------
interface CacheEntry {
    data: any;
    timestamp: number;
    etag?: string;
}

class RequestCache {
    private cache = new Map<string, CacheEntry>();
    private pending = new Map<string, Promise<any>>();
    private maxSize: number = 100;

    constructor(private ttl: number = 5 * 60 * 1000) {
        this.loadFromStorage();
    }

    private async loadFromStorage() {
        try {
            const saved = await AsyncStorage.getItem('api_cache');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
                    if (Date.now() - entry.timestamp < this.ttl) {
                        this.cache.set(key, entry);
                    }
                });
            }
        } catch (e) {
            log.debug('Failed to load cache from storage');
        }
    }

    private persistToStorage = debounce(async () => {
        const toSave = Object.fromEntries(this.cache.entries());
        await AsyncStorage.setItem('api_cache', JSON.stringify(toSave));
    }, 5000);

    get(key: string): CacheEntry | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry;
    }

    set(key: string, data: any, etag?: string) {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, { data, timestamp: Date.now(), etag });
        this.persistToStorage();
    }

    getPending(key: string): Promise<any> | null {
        return this.pending.get(key) || null;
    }

    setPending(key: string, promise: Promise<any>) {
        this.pending.set(key, promise);
        promise.finally(() => this.pending.delete(key));
    }

    invalidate(pattern?: string, exact = false) {
        if (pattern) {
            const keys = Array.from(this.cache.keys()).filter(k =>
                exact ? k === pattern : k.includes(pattern)
            );
            keys.forEach(k => this.cache.delete(k));
        } else {
            this.cache.clear();
        }
        this.persistToStorage();
    }
}

const cache = new RequestCache();

// ------------------------------
// Request deduplication helper
// ------------------------------
const deduplicateRequest = async <T>(
    key: string,
    requestFn: () => Promise<T>,
    priority: RequestPriority = RequestPriority.MEDIUM
): Promise<T> => {
    const pending = cache.getPending(key);
    if (pending) return pending;

    const promise = priorityQueue.add(priority, requestFn);
    cache.setPending(key, promise);
    return promise;
};

// ------------------------------
// Helper function to get base URL
// ------------------------------
const getBaseUrl = async (): Promise<string> => {
    log.debug('Getting base URL');
    const envUrl = getApiUrl();
    log.debug('Environment URL:', envUrl);
    return envUrl;
};

// ------------------------------
// Initialize axios instance
// ------------------------------
let apiInstance: AxiosInstance | null = null;
let batcher: RequestBatcher | null = null;
let initializationPromise: Promise<AxiosInstance> | null = null;

export const initializeApi = async (): Promise<AxiosInstance> => {
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
        const BASE_API_URL = await getBaseUrl();
        const strategy = await getNetworkStrategy();

        apiInstance = axios.create({
            baseURL: BASE_API_URL,
            adapter: 'xhr',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Accept-Encoding': strategy.shouldCompress ? 'gzip, deflate' : undefined,
            },
            timeout: strategy.timeout,
            maxRedirects: 5,
        });

        // Initialize batcher with the instance
        batcher = new RequestBatcher(apiInstance);

        // Request Interceptor
        apiInstance.interceptors.request.use(
            async (config) => {
                const strategy = await getNetworkStrategy();

                if (config.method?.toLowerCase() === 'get' && !strategy.cacheFirst) {
                    const cacheKey = `${config.url}-${JSON.stringify(config.params)}`;
                    const cached = cache.get(cacheKey);
                    if (cached?.etag) {
                        config.headers['If-None-Match'] = cached.etag;
                    }
                }

                const token = await SecureStore.getItemAsync('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                config.headers['X-Device-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
                config.headers['X-Platform'] = Platform.OS;
                config.headers['X-App-Version'] = '1.0.0';

                if (config.data) {
                    normalizeToUTC(config.data);
                }

                return config;
            },
            (error) => {
                log.error('Request interceptor error:', error.message);
                return Promise.reject(error);
            }
        );

        // Response Interceptor
        apiInstance.interceptors.response.use(
            (response) => {
                if (response.config.method?.toLowerCase() === 'get') {
                    const cacheKey = `${response.config.url}-${JSON.stringify(response.config.params)}`;
                    const etag = response.headers.etag;
                    cache.set(cacheKey, response.data, etag);
                }
                return response;
            },
            async (error) => {
                const errorConfig = error.config || {};
                const status = error.response?.status;
                const method = errorConfig.method?.toLowerCase();

                if (status === 304) {
                    const cacheKey = `${errorConfig.url}-${JSON.stringify(errorConfig.params)}`;
                    const cached = cache.get(cacheKey);
                    if (cached) {
                        return Promise.resolve({
                            ...errorConfig,
                            data: cached.data,
                            status: 200,
                            statusText: 'OK (Cached)',
                        });
                    }
                }

                if (status === 401) {
                    log.debug('Unauthorized - clearing token');
                    await SecureStore.deleteItemAsync('auth_token');
                    cache.invalidate();
                }

                log.error('Request failed:', {
                    method,
                    url: errorConfig.url,
                    status,
                    message: error.message,
                });

                // Use retryWithBackoff for server errors
                const isIdempotent = ['get', 'put', 'delete'].includes(method || '');
                if (isIdempotent && [502, 503, 504].includes(status)) {
                    return retryWithBackoff(() => apiInstance!(errorConfig));
                }

                return Promise.reject(error);
            }
        );

        return apiInstance;
    })();

    return initializationPromise;
};

const apiPromise = initializeApi();

export const api = {
    get: async <T = any>(
        url: string,
        config?: AxiosRequestConfig,
        priority: RequestPriority = RequestPriority.MEDIUM
    ): Promise<AxiosResponse<T>> => {
        const cacheKey = `${url}-${JSON.stringify(config?.params)}`;
        const strategy = await getNetworkStrategy();

        if (strategy.cacheFirst) {
            const cached = cache.get(cacheKey);
            if (cached) {
                return Promise.resolve({
                    data: cached.data,
                    status: 200,
                    statusText: 'OK (Cached)',
                    headers: {},
                    config: config || {},
                } as AxiosResponse<T>);
            }
        }

        const cached = cache.get(cacheKey);
        if (cached && !config?.headers?.['Cache-Control']?.includes('no-cache')) {
            return Promise.resolve({
                data: cached.data,
                status: 200,
                statusText: 'OK (Cached)',
                headers: {},
                config: config || {},
            } as AxiosResponse<T>);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), strategy.timeout);

        return deduplicateRequest(cacheKey, async () => {
            try {
                const instance = await apiPromise;
                const result = await instance.get<T>(url, {
                    ...config,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                return result;
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        }, priority);
    },

    post: async <T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
        priority: RequestPriority = RequestPriority.HIGH
    ): Promise<AxiosResponse<T>> => {
        const resource = url.split('/')[1];
        if (resource) cache.invalidate(`/${resource}`, false);

        return priorityQueue.add(priority, async () => {
            const instance = await apiPromise;
            return instance.post<T>(url, data, config);
        });
    },

    put: async <T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
        priority: RequestPriority = RequestPriority.HIGH
    ): Promise<AxiosResponse<T>> => {
        const resource = url.split('/')[1];
        if (resource) cache.invalidate(`/${resource}`, false);

        return priorityQueue.add(priority, async () => {
            const instance = await apiPromise;
            return instance.put<T>(url, data, config);
        });
    },

    delete: async <T = any>(
        url: string,
        config?: AxiosRequestConfig,
        priority: RequestPriority = RequestPriority.HIGH
    ): Promise<AxiosResponse<T>> => {
        const resource = url.split('/')[1];
        if (resource) cache.invalidate(`/${resource}`, false);

        return priorityQueue.add(priority, async () => {
            const instance = await apiPromise;

            // Check if there's data in the config and handle it properly
            if (config?.data) {
                // For DELETE requests with body, we need to use a custom config
                // This ensures the data is sent in the request body
                return instance.request<T>({
                    method: 'delete',
                    url,
                    data: config.data,
                    ...config,
                });
            }

            // For DELETE requests without body, use the standard method
            return instance.delete<T>(url, config);
        });
    },

    patch: async <T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
        priority: RequestPriority = RequestPriority.HIGH
    ): Promise<AxiosResponse<T>> => {
        const resource = url.split('/')[1];
        if (resource) cache.invalidate(`/${resource}`, false);

        return priorityQueue.add(priority, async () => {
            const instance = await apiPromise;
            return instance.patch<T>(url, data, config);
        });
    },

    batch: <T = any>(key: string, requests: any[]): Promise<T[]> => {
        if (!batcher) throw new Error('API not initialized');
        return batcher.add(key, requests);
    },
};

export const getApi = async () => await apiPromise;

export default api;