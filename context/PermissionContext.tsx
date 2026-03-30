// context/PermissionContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "./AuthContext";
import { permissionService } from "@/services/permissionService";
import { ProductPermissions, PermissionKey } from "@/types/permission.types";

// ------------------------------
// Types
// ------------------------------
interface CachedPermissions {
  data: ProductPermissions;
  timestamp: number;
}

interface PermissionContextType {
  permissions: ProductPermissions;
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

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
//   debug: (...args: any[]) => __DEV__ && console.log("🔐 [Permission]", ...args),
//   info: (...args: any[]) =>
//     __DEV__ && console.log("🔐 [Permission] ℹ️", ...args),
//   warn: (...args: any[]) =>
//     __DEV__ && console.warn("🔐 [Permission] ⚠️", ...args),
//   error: (...args: any[]) => console.error("🔐 [Permission] ❌", ...args),
// };

// ------------------------------
// Constants
// ------------------------------
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const EMPTY_PERMISSIONS: ProductPermissions = {
  view_inventory: false,
  add_item: false,
  edit_items: false,
  restock_items: false,
  deduct_items: false,
  remove_items: false,
  create_categories: false,
  remove_categories: false,
};

// ------------------------------
// Role-based defaults
// ------------------------------
const getDefaultPermissions = (role: string): ProductPermissions => {
  switch (role) {
    case "superadmin":
      return {
        ...EMPTY_PERMISSIONS,
        view_inventory: true,
        add_item: true,
        edit_items: true,
        restock_items: true,
        deduct_items: true,
        remove_items: true,
        create_categories: true,
        remove_categories: true,
      };
    case "manager":
      return {
        ...EMPTY_PERMISSIONS,
        view_inventory: true,
        add_item: true,
        edit_items: true,
        restock_items: true,
        deduct_items: true,
        create_categories: true,
      };
    default: // cashier
      return {
        ...EMPTY_PERMISSIONS,
        view_inventory: true,
      };
  }
};

// ------------------------------
// Create Context
// ------------------------------
const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined,
);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [permissions, setPermissions] =
    useState<ProductPermissions>(EMPTY_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  // Refs for performance
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const previousRoleRef = useRef<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ------------------------------
  // Save permissions with timestamp
  // ------------------------------
  const savePermissionsWithTimestamp = useCallback(
    async (userId: number, perms: ProductPermissions) => {
      const cacheEntry: CachedPermissions = {
        data: perms,
        timestamp: Date.now(),
      };
      await SecureStore.setItemAsync(
        `user_permissions_${userId}`,
        JSON.stringify(cacheEntry),
      );
    },
    [],
  );

  // ------------------------------
  // Load permissions with TTL
  // ------------------------------
  const loadPermissionsWithTTL = useCallback(
    async (userId: number): Promise<ProductPermissions | null> => {
      const cached = await SecureStore.getItemAsync(
        `user_permissions_${userId}`,
      );
      if (cached) {
        const entry: CachedPermissions = JSON.parse(cached);
        // Refresh if older than TTL
        if (Date.now() - entry.timestamp < CACHE_TTL) {
          return entry.data;
        }
        log.debug("Cache expired, will refresh from API");
      }
      return null;
    },
    [],
  );

  // ------------------------------
  // Load permissions (main function)
  // ------------------------------
  const loadPermissions = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Deduplicate concurrent calls
    if (loadPromiseRef.current) {
      log.debug("Reusing existing permission load");
      return loadPromiseRef.current;
    }

    if (!user) {
      setPermissions(EMPTY_PERMISSIONS);
      setLoading(false);
      return Promise.resolve();
    }

    setLoading(true);
    const cacheKey = `user_permissions_${user.id}`;

    // Create the load promise
    const loadPromise = (async () => {
      try {
        // Check cache first with TTL
        const cached = await loadPermissionsWithTTL(user.id);
        if (cached) {
          log.debug("Using cached permissions");
          setPermissions(cached);
        }

        // Fetch fresh from API (in background if we had cache)
        const fresh = await permissionService.getUserPermissions(user.id);
        const resolved = fresh ?? getDefaultPermissions(user.role);

        setPermissions(resolved);
        await savePermissionsWithTimestamp(user.id, resolved);

        log.debug("Permissions refreshed from API");
      } catch (error: any) {
        // Don't log aborted requests as errors
        if (error.name === "AbortError") {
          log.debug("Permission load aborted");
          return;
        }

        log.error("Failed to load permissions:", error.message);

        // Fallback: cache → role default
        try {
          const cached = await SecureStore.getItemAsync(cacheKey);
          if (cached) {
            const entry: CachedPermissions = JSON.parse(cached);
            setPermissions(entry.data);
          } else {
            setPermissions(getDefaultPermissions(user.role));
          }
        } catch {
          setPermissions(getDefaultPermissions(user.role));
        }
      } finally {
        setLoading(false);
        loadPromiseRef.current = null;
        abortControllerRef.current = null;
      }
    })();

    loadPromiseRef.current = loadPromise;
    return loadPromise;
  }, [user, loadPermissionsWithTTL, savePermissionsWithTimestamp]);

  // ------------------------------
  // Detect role changes
  // ------------------------------
  useEffect(() => {
    if (user?.role && user.role !== previousRoleRef.current) {
      log.debug("Role changed from", previousRoleRef.current, "to", user.role);
      // Role changed - force refresh
      if (user) {
        SecureStore.deleteItemAsync(`user_permissions_${user.id}`).catch(
          () => {},
        );
        loadPermissions();
      }
    }
    previousRoleRef.current = user?.role;
  }, [user?.role, user, loadPermissions]);

  // ------------------------------
  // Initial load
  // ------------------------------
  useEffect(() => {
    loadPermissions();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadPermissions]);

  // ------------------------------
  // Memoized permission checks
  // ------------------------------
  const hasPermission = useCallback(
    (p: PermissionKey) => permissions[p] === true,
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (ps: PermissionKey[]) => ps.some((p) => permissions[p]),
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (ps: PermissionKey[]) => ps.every((p) => permissions[p]),
    [permissions],
  );

  // Batch permission check helper
  const hasBatchPermissions = useCallback(
    (permissionMap: Record<string, PermissionKey[]>) => {
      const result: Record<string, boolean> = {};
      Object.entries(permissionMap).forEach(([key, perms]) => {
        result[key] = perms.every((p) => permissions[p]);
      });
      return result;
    },
    [permissions],
  );

  const value = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasBatchPermissions, // Optional: can be exposed if needed
    loading,
    refreshPermissions: loadPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// ------------------------------
// Custom hook with validation
// ------------------------------
export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
};

// ------------------------------
// Optional: Higher-order component for permission guarding
// ------------------------------
interface WithPermissionsProps {
  requiredPermissions?: PermissionKey[];
  requiredAnyPermission?: PermissionKey[];
  fallback?: React.ReactNode;
}

export const withPermissions = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPermissionsProps = {},
) => {
  return (props: P) => {
    const { hasAllPermissions, hasAnyPermission, loading } = usePermissions();
    const {
      requiredPermissions,
      requiredAnyPermission,
      fallback = null,
    } = options;

    if (loading) {
      return fallback;
    }

    if (requiredPermissions && !hasAllPermissions(requiredPermissions)) {
      return fallback;
    }

    if (requiredAnyPermission && !hasAnyPermission(requiredAnyPermission)) {
      return fallback;
    }

    return <WrappedComponent {...props} />;
  };
};
