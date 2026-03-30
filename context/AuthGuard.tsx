// src/components/AuthGuard.tsx

import { useEffect } from "react";
import { router, useSegments } from "expo-router";
import { useAuth } from "@/context/AuthContext";

type UserRole = "cashier" | "manager" | "superadmin";

const ROLE_ROUTES: Record<UserRole, string> = {
  cashier: "/(cashier)",
  manager: "/(manager)",
  superadmin: "/(superadmin)",
};

const GROUP_ALLOWED_ROLES: Record<string, UserRole[]> = {
  "(cashier)": ["cashier", "manager", "superadmin"],
  "(manager)": ["manager", "superadmin"],
  "(superadmin)": ["superadmin"],
};

/**
 * Auth screens that are accessible WITHOUT a logged-in user.
 * Add any future public auth screens here.
 */
const PUBLIC_AUTH_SCREENS = new Set([
  "pincode-login-screen",
  "password-login-screen",
]);

interface AuthGuardProps {
  children?: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    // console.log("🛡️ [AuthGuard] ========== CHECKING ==========");
    // console.log("🛡️ [AuthGuard] segments:", segments);
    // console.log(
    //   "🛡️ [AuthGuard] user:",
    //   user ? `Logged in as ${user.role}` : "Not logged in",
    // );
    // console.log("🛡️ [AuthGuard] loading:", loading);

    const currentGroup = segments[0] as string | undefined;
    const currentScreen = segments[1] as string | undefined;
    const inAuthGroup = currentGroup === "(auth)";

    // console.log("🛡️ [AuthGuard] currentGroup:", currentGroup);
    // console.log("🛡️ [AuthGuard] currentScreen:", currentScreen);
    // console.log("🛡️ [AuthGuard] inAuthGroup:", inAuthGroup);

    // ─────────────────────────────────────────────────────────────
    // 1. Not authenticated
    // ─────────────────────────────────────────────────────────────
    if (!user) {
      // console.log("🛡️ [AuthGuard] User not authenticated");

      // Check if we're on a public auth screen
      if (inAuthGroup && currentScreen) {
        // console.log("🛡️ [AuthGuard] Current screen:", currentScreen);
        // console.log(
        //   "🛡️ [AuthGuard] Is public auth screen?",
        //   PUBLIC_AUTH_SCREENS.has(currentScreen),
        // );

        if (PUBLIC_AUTH_SCREENS.has(currentScreen)) {
          // console.log(
          //   "🛡️ [AuthGuard] ✅ On public auth screen, allowing access",
          // );
          return; // Allow access to public auth screens
        }
      }

      // Not on a public auth screen, redirect to PIN login
      // console.log(
      //   "🛡️ [AuthGuard] ⚠️ Not on public auth screen, redirecting to PIN login",
      // );
      router.replace("/(auth)/pincode-login-screen" as any);
      return;
    }

    const role = (user.role ?? "").toLowerCase() as UserRole;
    // console.log("🛡️ [AuthGuard] User role:", role);

    // ─────────────────────────────────────────────────────────────
    // 2. Authenticated but still on an auth screen → role home
    // ─────────────────────────────────────────────────────────────
    if (inAuthGroup) {
      // console.log(
      //   "🛡️ [AuthGuard] Authenticated but on auth screen, redirecting to role home",
      // );
      const destination = ROLE_ROUTES[role] ?? "/(auth)/pincode-login-screen";
      // console.log("🛡️ [AuthGuard] Redirecting to:", destination);
      router.replace(destination as any);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Role-based protection — prevent cross-group access
    // ─────────────────────────────────────────────────────────────
    const allowedRoles = currentGroup
      ? GROUP_ALLOWED_ROLES[currentGroup]
      : undefined;

    if (allowedRoles && !allowedRoles.includes(role)) {
      // console.log("🛡️ [AuthGuard] Role not allowed in this group, redirecting");
      const destination = ROLE_ROUTES[role];
      if (destination) {
        // console.log("🛡️ [AuthGuard] Redirecting to:", destination);
        router.replace(destination as any);
      }
    } else {
      // console.log("🛡️ [AuthGuard] ✅ Access granted");
    }
  }, [user, loading, segments]);

  return <>{children}</>;
}
