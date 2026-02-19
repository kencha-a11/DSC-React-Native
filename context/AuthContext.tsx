// src/context/AuthContext.tsx
console.info("[AUTHCONTEXT] AuthContext initialized with services and secure storage");

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  checkPin as apiCheckPin,
  verifyPassword as apiVerifyPassword,
  logout as apiLogout,
  getUser,
  User,
  TimeLog,
} from "../services/authServices";
// Imports authentication service functions and related types (PIN check, password verification, logout, user retrieval, and models) for managing auth logic
import * as SecureStore from "expo-secure-store";
// Provides secure, encrypted key-value storage for sensitive data like auth tokens on the device

// ------------------------------
// Types
// ------------------------------
interface AuthContextType {
  user: User | null;
  timeLog: TimeLog | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  checkPin: (pinCode: string) => Promise<CheckPinResult>;
  verifyPassword: (userId: number, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

interface CheckPinResult {
  requirePassword: boolean;
  userId?: number;
}

// ------------------------------
// Create AuthContext
// ------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);
// Initializes the authentication context, allowing app-wide access to user/session state via React Context API

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [timeLog, setTimeLog] = useState<TimeLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = !!user;

  // ------------------------------
  // Initialize auth on app load
  // ------------------------------
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("[AUTHCONTEXT] Initializing auth...");
      setLoading(true);

      try {
        const token = await SecureStore.getItemAsync("auth_token");

        if (!token) {
          console.log("[AUTHCONTEXT] ℹ️ No auth token found - user not logged in",);
          setUser(null);
          setLoading(false);
          return;
        }

        console.log("[AUTHCONTEXT] ✅ Token found, fetching user...");

        // Token exists - fetch user
        const userData = await getUser();
        setUser(userData);
        console.log("[AUTHCONTEXT] ✅ User restored from token:", userData);

        // redirecte the user to the appropriate screen based on their role
        // (this is optional and depends on your app's flow - you might want to handle this in a separate AuthGuard component instead)
        
      } catch (err: any) {
        console.error("[AUTHCONTEXT] ❌ Failed to restore user session:", err);

        if (err.response?.status === 401) {
          console.log("[AUTHCONTEXT] ℹ️ Token invalid - clearing storage");
          await SecureStore.deleteItemAsync("auth_token");
        }

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ------------------------------
  // Check PIN (Step 1)
  // ------------------------------
  const checkPin = async (pinCode: string): Promise<CheckPinResult> => {
    console.log("[AUTHCONTEXT][checkPin] called");
    setError(null);
    setLoading(true);

    try {
      const response = await apiCheckPin(pinCode);

      // Case 1: Manager/Superadmin - need password
      if (response.requirePassword) {
        console.log("[AUTHCONTEXT][checkPin] Password required for user:", response.userId);
        setLoading(false);
        return {
          requirePassword: true,
          userId: response.userId,
        };
      }

      // Case 2: Cashier - authenticated immediately
      console.log("[AUTHCONTEXT][checkPin] ✅ Cashier authenticated");
      setUser(response.user!);
      setTimeLog(response.timeLog!);

      return { requirePassword: false };
    } catch (err: any) {
      console.error("[AUTHCONTEXT][checkPin] ❌ PIN check failed in context:", err);

      // Handle specific error messages
      const errorMessage = err.message || "User Not Found";
      setError(errorMessage);
      setUser(null);
      setTimeLog(null);

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Verify Password (Step 2)
  // ------------------------------
  const verifyPassword = async (
    userId: number,
    password: string,
  ): Promise<void> => {
    console.log("[AUTHCONTEXT][verifyPassword] called");
    setError(null);
    setLoading(true);

    try {
      const response = await apiVerifyPassword(userId, password);

      console.log("[AUTHCONTEXT][verifyPassword] ✅ Manager/Superadmin authenticated");
      setUser(response.user);
      setTimeLog(response.timeLog);
    } catch (err: any) {
      console.error("[AUTHCONTEXT][verifyPassword] ❌ Password verification failed in context:", err);

      // Handle specific error messages
      const errorMessage = err.message || "Wrong Password";
      setError(errorMessage);
      setUser(null);
      setTimeLog(null);

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Logout
  // ------------------------------
  const logout = async (): Promise<void> => {
    console.log("[AUTHCONTEXT][logout] called");
    setLoading(true);
    setError(null);

    try {
      await apiLogout();
      console.log("[AUTHCONTEXT][logout] ✅ Logout successful");
    } catch (err) {
      console.warn("[AUTHCONTEXT][logout] ⚠️ Logout API call failed, but clearing local state:", err);
    } finally {
      setUser(null);
      setTimeLog(null);
      setLoading(false);
    }
  };

  // ------------------------------
  // Clear error
  // ------------------------------
  const clearError = () => {
    // console.log("[AUTHCONTEXT] Clearing error");
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        timeLog,
        loading,
        error,
        isAuthenticated,
        checkPin,
        verifyPassword,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ------------------------------
// Custom hook
// ------------------------------
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("[AUTHCONTEXT] useAuth must be used within an AuthProvider");
  }
  return context;
};
