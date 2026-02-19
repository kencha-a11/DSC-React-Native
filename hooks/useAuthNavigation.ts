// src/hooks/useAuthNavigation.ts
import { useAuth } from "@/context/AuthContext";
import { router, useSegments } from "expo-router";
import { useEffect } from "react";

/**
 * Custom hook to handle authentication-based navigation
 * Redirects users based on authentication status and role
 */
export function useAuthNavigation() {
    const { user, loading } = useAuth();
    const segments = useSegments();

    useEffect(() => {
        if (loading) return; // wait for auth state

        const inAuthGroup = segments[0] === "(auth)";
        const inManagerGroup = segments[0] === "(manager)";
        const inCashierGroup = segments[0] === "(cashier)";
        const inSuperAdminGroup = segments[0] === "(superadmin)";

        console.log("[AUTH NAV]", {
            user,
            segments,
            inAuthGroup,
            loading,
        });

        // -------------------------------
        // Not authenticated → redirect to PIN login
        // -------------------------------
        if (!user) {
            if (!inAuthGroup) {
                console.log("[AUTH NAV] No user, redirecting to PIN login");
                // Use setTimeout to avoid race condition with segments
                setTimeout(() => {
                    router.replace("/(auth)/pincode-login-screen");
                }, 0);
            }
            return;
        }

        // -------------------------------
        // Authenticated → redirect from auth screens
        // -------------------------------
        if (inAuthGroup) {
            // Normalize role to lowercase
            const role = (user.role || "").toLowerCase();

            const roleRoutes = {
                cashier: "/(cashier)/index" as const,
                manager: "/(manager)/index" as const,
                superadmin: "/(superadmin)/index" as const,
            };

            const destination = roleRoutes[role as keyof typeof roleRoutes];

            if (destination) {
                console.log(`[AUTH NAV] User authenticated as ${role}, redirecting to ${destination}`);
                setTimeout(() => {
                    router.replace(destination as any);
                }, 0);
            } else {
                console.warn(`[AUTH NAV] Unknown role: ${role}, redirecting to PIN login`);
                setTimeout(() => {
                    router.replace("/(auth)/pincode-login-screen");
                }, 0);
            }
        }

        // -------------------------------
        // Optional: handle cross-group accidental access
        // For example, authenticated user manually navigates to wrong group
        // -------------------------------
        if (user && !inAuthGroup) {
            // You can add role-based guards here if needed
            // e.g., prevent cashier from accessing manager screens
        }
    }, [user, loading, segments]);
}
