// src/components/AuthGuard.tsx
console.info("[AUTHGUARD] Rendering AuthGuard component");

import { useEffect } from "react";
import { router, useSegments } from "expo-router";
import { useAuth } from "@/context/AuthContext";

type UserRole = "cashier" | "manager" | "superadmin";

export function AuthGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const currentGroup = segments[0];
    const inAuthGroup = currentGroup === "(auth)";

    // -------------------------------
    // 1️⃣ Not authenticated → PIN login
    // -------------------------------
    if (!user) {
      if (!inAuthGroup) {
        console.log("[AUTHGUARD] No user, redirecting to PIN login");
        // Use the actual file path without parentheses if the error persists,
        // but typically standardizing on the exported Href type is best.
        router.replace("/(auth)/pincode-login-screen" as any);
      }
      return;
    }

    const role = (user.role || "").toLowerCase() as UserRole;

    // -------------------------------
    // 2️⃣ Authenticated → Redirect away from (auth)
    // -------------------------------
    if (inAuthGroup) {
      // Best Practice: Always point to a specific screen (like /index)
      // rather than just the group name folder.
      const roleRoutes: Record<UserRole, string> = {
        cashier: "/(cashier)",
        manager: "/(manager)",
        superadmin: "/(superadmin)",
      };

      const destination = roleRoutes[role];

      if (destination) {
        console.log(`[AUTHGUARD] Redirecting ${role} to ${destination}`);
        router.replace(destination as any);
      } else {
        console.warn(`[AUTHGUARD] Unknown role "${role}"`);
        router.replace("/(auth)/pincode-login-screen" as any);
      }
      return;
    }

    // -------------------------------
    // 3️⃣ Role-based protection (prevent cross-access)
    // -------------------------------
    if (!inAuthGroup) {
      const groupRoleMap: Record<string, UserRole[]> = {
        "(cashier)": ["cashier", "manager", "superadmin"],
        "(manager)": ["manager", "superadmin"],
        "(superadmin)": ["superadmin"],
      };

      const allowedRoles = groupRoleMap[currentGroup];

      if (allowedRoles && !allowedRoles.includes(role)) {
        console.warn(
          `[AUTHGUARD] Role "${role}" not allowed in ${currentGroup}`,
        );

        const roleRedirects: Record<UserRole, string> = {
          cashier: "/(cashier)",
          manager: "/(manager)",
          superadmin: "/(superadmin)",
        };

        router.replace(roleRedirects[role] as any);
      }
    }
  }, [user, loading, segments]);

  return null;
}
