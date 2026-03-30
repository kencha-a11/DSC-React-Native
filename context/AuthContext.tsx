// src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  checkPin as apiCheckPin,
  verifyPassword as apiVerifyPassword,
  logout as apiLogout,
  getUser,
  User,
  TimeLog,
} from "../services/authServices";
import * as SecureStore from "expo-secure-store";
import IntroductionProgress from "@/components/common/IntroductionProgress";
import { useToggle } from "@/hooks/useToggle";

// ------------------------------
// Types
// ------------------------------
export interface CheckPinResult {
  requirePassword: boolean;
  userId?: number;
  user?: User;
  timeLog?: TimeLog;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  timeLog: TimeLog | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  pendingUserId: number | null;
  setPendingUserId: (id: number | null) => void;
  checkPin: (pinCode: string) => Promise<CheckPinResult>;
  verifyPassword: (userId: number, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// ------------------------------
// Create AuthContext
// ------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [timeLog, setTimeLog] = useState<TimeLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const isAuthenticated = !!user;

  // Splash screen state (initial app load)
  const [showSplash, toggleSplash] = useToggle(true);
  const [progress, setProgress] = useState(0);
  
  // Auth operation overlay (PIN / Password)
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // ------------------------------
  // Initialize auth on app load (splash)
  // ------------------------------
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        setProgress(15);
        await delay(300);

        const token = await SecureStore.getItemAsync("auth_token");
        setProgress(50);
        await delay(300);

        if (token) {
          const userData = await getUser();
          setUser(userData);
          setProgress(85);
          await delay(300);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          await SecureStore.deleteItemAsync("auth_token");
        }
        setUser(null);
      } finally {
        setProgress(100);
        setLoading(false);
        setTimeout(() => toggleSplash(), 800);
      }
    };

    initializeAuth();
  }, []);

  // ------------------------------
  // Check PIN (Step 1) with progress overlay
  // ------------------------------
  const checkPin = async (pinCode: string): Promise<CheckPinResult> => {
    setError(null);
    setShowAuthOverlay(true);
    setAuthProgress(10);

    try {
      await delay(200);
      setAuthProgress(30);

      const response = await apiCheckPin(pinCode);
      setAuthProgress(70);

      if (response.requirePassword) {
        setAuthProgress(100);
        if (response.userId) setPendingUserId(response.userId);
        // Keep overlay visible for password step; will be reset later
        return { requirePassword: true, userId: response.userId };
      }

      setAuthProgress(100);
      setUser(response.user!);
      setTimeLog(response.timeLog!);
      setPendingUserId(null);
      return {
        requirePassword: false,
        user: response.user,
        timeLog: response.timeLog,
        token: response.token,
      };
    } catch (err: any) {
      setError(err.message || "PIN verification failed");
      throw err;
    } finally {
      // Hide overlay after a short delay, unless we're moving to password
      setTimeout(() => {
        setShowAuthOverlay(false);
        setAuthProgress(0);
      }, 500);
    }
  };

  // ------------------------------
  // Verify Password (Step 2) with progress overlay
  // ------------------------------
  const verifyPassword = async (userId: number, password: string): Promise<void> => {
    setError(null);
    setShowAuthOverlay(true);
    setAuthProgress(10);

    try {
      await delay(200);
      setAuthProgress(40);

      const response = await apiVerifyPassword(userId, password);
      setAuthProgress(80);
      setUser(response.user);
      setTimeLog(response.timeLog);
      setPendingUserId(null);
      setAuthProgress(100);
    } catch (err: any) {
      setError(err.message || "Wrong Password");
      throw err;
    } finally {
      setTimeout(() => {
        setShowAuthOverlay(false);
        setAuthProgress(0);
      }, 500);
    }
  };

  // ------------------------------
  // Logout
  // ------------------------------
  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    // Cancel overlay processes
    setShowAuthOverlay(false);
    setAuthProgress(0);
    
    try {
      await apiLogout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setTimeLog(null);
      setPendingUserId(null);
      setLoading(false);
    }
  };

  // ------------------------------
  // Clear error
  // ------------------------------
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        timeLog,
        loading,
        error,
        isAuthenticated,
        pendingUserId,
        setPendingUserId,
        checkPin,
        verifyPassword,
        logout,
        clearError,
      }}
    >
      {children}
      
      {/* Initial splash screen (only on app start) */}
      <IntroductionProgress visible={showSplash} progress={progress} />
      
      {/* Auth operation overlay (PIN / Password) */}
      <IntroductionProgress visible={showAuthOverlay} progress={authProgress} />
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