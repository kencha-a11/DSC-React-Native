import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  accountService,
  AccountResponse,
  AccountFilters,
} from "@/services/accountService";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AccountContextType {
  accounts: AccountResponse[];
  currentAccount: AccountResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  fetchAccounts: (filters?: AccountFilters, refresh?: boolean) => Promise<void>;
  fetchAccountById: (
    id: number,
    force?: boolean,
  ) => Promise<AccountResponse | null>;
  createAccount: (data: any) => Promise<boolean>;
  updateAccount: (id: number, data: any) => Promise<boolean>;
  deleteAccount: (id: number) => Promise<boolean>;
  deleteMultipleAccounts: (ids: number[]) => Promise<boolean>;
  clearCache: () => Promise<void>;
  loadMore: () => Promise<void>;
  searchAccounts: (query: string) => Promise<void>;
  getAccountById: (id: number) => AccountResponse | undefined;
  getAccountsByRole: (role: string) => AccountResponse[];
  getActiveAccounts: () => AccountResponse[];
  invalidateAccount: (id: number) => void;
  invalidateList: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const CACHE_KEY = "accounts_cache";
const CACHE_TIMESTAMP_KEY = "accounts_cache_timestamp";
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [currentAccount, setCurrentAccount] = useState<AccountResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<AccountFilters>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Use ref so functions don't need isAuthenticated in their dep arrays
  const isAuthRef = useRef(false);

  useEffect(() => {
    SecureStore.getItemAsync("auth_token").then((token) => {
      const auth = !!token;
      isAuthRef.current = auth;
      setIsAuthenticated(auth);
    });
  }, []);

  // ─── Cache ────────────────────────────────────────────────────────────────

  const clearCacheStorage = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(CACHE_KEY),
      AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY),
    ]).catch(() => {});
  }, []);

  // saveCache takes data as param — avoids stale closure on `accounts` state
  const saveCache = useCallback(async (data: AccountResponse[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString()),
      ]);
    } catch {}
  }, []);

  const clearCache = useCallback(async () => {
    await clearCacheStorage();
    setAccounts([]);
    setCurrentPage(1);
    setTotalPages(1);
    setHasMore(false);
  }, [clearCacheStorage]);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchAccounts = useCallback(
    async (filters: AccountFilters = {}, refresh = false) => {
      if (!isAuthRef.current) return;

      setLoading(true);
      setError(null);
      setCurrentFilters(filters);

      try {
        const response = await accountService.getAccounts({
          ...filters,
          page: 1,
          perPage: 50,
        });

        setAccounts((prev) =>
          refresh ? response.data : [...prev, ...response.data],
        );
        setCurrentPage(response.current_page);
        setTotalPages(response.last_page);
        setHasMore(response.hasMore);
        await saveCache(response.data); // pass data directly, not from state
      } catch (err: any) {
        setError(err.message || "Failed to fetch accounts");
      } finally {
        setLoading(false);
      }
    },
    [saveCache],
  ); // no isAuthenticated — using ref instead

  const loadCache = useCallback(async () => {
    try {
      const [cached, timestamp] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY),
      ]);

      if (
        cached &&
        timestamp &&
        Date.now() - parseInt(timestamp) < CACHE_EXPIRY_MS
      ) {
        setAccounts(JSON.parse(cached));
        return;
      }
    } catch {}
    await fetchAccounts({}, true);
  }, [fetchAccounts]);

  useEffect(() => {
    if (isAuthenticated) loadCache();
  }, [isAuthenticated]); // intentionally exclude loadCache

  // ─── Account by ID ────────────────────────────────────────────────────────

  const fetchAccountById = useCallback(
    async (id: number, force = false): Promise<AccountResponse | null> => {
      if (!isAuthRef.current) return null;

      if (!force) {
        const cached = accounts.find((a) => a.id === id);
        if (cached) {
          setCurrentAccount(cached);
          return cached;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const data = await accountService.getAccount(id);
        if (data) {
          setCurrentAccount(data);
          setAccounts((prev) => prev.map((a) => (a.id === id ? data : a)));
        }
        return data;
      } catch (err: any) {
        setError(err.message || "Failed to fetch account");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [accounts],
  );

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const createAccount = useCallback(
    async (data: any): Promise<boolean> => {
      if (!isAuthRef.current) return false;
      setLoading(true);
      setError(null);
      try {
        await accountService.createAccount(data);
        await fetchAccounts({}, true);
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to create account");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchAccounts],
  );

  const updateAccount = useCallback(
    async (id: number, data: any): Promise<boolean> => {
      if (!isAuthRef.current) return false;
      setLoading(true);
      setError(null);
      try {
        const result = await accountService.updateAccount(id, data);
        setAccounts((prev) => prev.map((a) => (a.id === id ? result : a)));
        if (currentAccount?.id === id) setCurrentAccount(result);
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to update account");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentAccount],
  );

  const deleteAccount = useCallback(
    async (id: number): Promise<boolean> => {
      if (!isAuthRef.current) return false;
      setLoading(true);
      setError(null);
      try {
        await accountService.deleteAccount(id);
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        if (currentAccount?.id === id) setCurrentAccount(null);
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to delete account");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentAccount],
  );

  const deleteMultipleAccounts = useCallback(
    async (ids: number[]): Promise<boolean> => {
      if (!isAuthRef.current) return false;
      setLoading(true);
      setError(null);
      try {
        await accountService.deleteMultipleAccounts(ids);
        setAccounts((prev) => prev.filter((a) => !ids.includes(a.id)));
        if (currentAccount && ids.includes(currentAccount.id))
          setCurrentAccount(null);
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to delete accounts");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentAccount],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !isAuthRef.current) return;
    await fetchAccounts(currentFilters, false);
  }, [hasMore, loading, currentFilters, fetchAccounts]);

  const searchAccounts = useCallback(
    async (query: string) => {
      await fetchAccounts({ ...currentFilters, search: query }, true);
    },
    [currentFilters, fetchAccounts],
  );

  // ─── Selectors ────────────────────────────────────────────────────────────

  const getAccountById = useCallback(
    (id: number) => accounts.find((a) => a.id === id),
    [accounts],
  );
  const getAccountsByRole = useCallback(
    (role: string) =>
      accounts.filter((a) => a.role.toLowerCase() === role.toLowerCase()),
    [accounts],
  );
  const getActiveAccounts = useCallback(
    () =>
      accounts.filter((a) => a.account_status.toLowerCase() === "activated"),
    [accounts],
  );
  const invalidateAccount = useCallback((_id: number) => {
    setCurrentAccount(null);
  }, []);
  const invalidateList = useCallback(() => {
    fetchAccounts(currentFilters, true);
  }, [currentFilters, fetchAccounts]);

  const value = useMemo(
    () => ({
      accounts,
      currentAccount,
      loading,
      error,
      currentPage,
      totalPages,
      hasMore,
      fetchAccounts,
      fetchAccountById,
      createAccount,
      updateAccount,
      deleteAccount,
      deleteMultipleAccounts,
      clearCache,
      loadMore,
      searchAccounts,
      getAccountById,
      getAccountsByRole,
      getActiveAccounts,
      invalidateAccount,
      invalidateList,
    }),
    [
      accounts,
      currentAccount,
      loading,
      error,
      currentPage,
      totalPages,
      hasMore,
      fetchAccounts,
      fetchAccountById,
      createAccount,
      updateAccount,
      deleteAccount,
      deleteMultipleAccounts,
      clearCache,
      loadMore,
      searchAccounts,
      getAccountById,
      getAccountsByRole,
      getActiveAccounts,
      invalidateAccount,
      invalidateList,
    ],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (!context)
    throw new Error("useAccounts must be used within an AccountProvider");
  return context;
};
