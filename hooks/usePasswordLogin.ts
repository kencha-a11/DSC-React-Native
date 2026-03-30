import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export function usePasswordLogin() {
    const [password, setPassword] = useState("");
    const { verifyPassword, error, loading, clearError, pendingUserId, setPendingUserId } = useAuth();

    useEffect(() => {
        console.log("🔑 [usePasswordLogin] Hook mounted");
        return () => {
            console.log("🔑 [usePasswordLogin] Hook unmounting - clearing error and pendingUserId");
            clearError();
            setPendingUserId(null);
        };
    }, []);

    useEffect(() => {
        if (password) {
            console.log("🔑 [usePasswordLogin] User typing - clearing error");
            clearError();
        }
    }, [password]);

    // Check for pendingUserId on mount and when it changes
    useEffect(() => {
        console.log("🔑 [usePasswordLogin] ========== PENDING USER CHECK ==========");
        console.log("🔑 [usePasswordLogin] Current pendingUserId:", pendingUserId);
        console.log("🔑 [usePasswordLogin] pendingUserId type:", typeof pendingUserId);
        console.log("🔑 [usePasswordLogin] pendingUserId value:", pendingUserId === null ? "null" : pendingUserId);
        console.log("🔑 [usePasswordLogin] =======================================");

        if (pendingUserId === null || pendingUserId === undefined) {
            console.log("🔑 [usePasswordLogin] ❌ No pendingUserId found - showing session expired alert");

            // Use a timeout to avoid immediate redirect if pendingUserId is about to be set
            const timer = setTimeout(() => {
                // Check again after a short delay in case context just updated
                if (pendingUserId === null || pendingUserId === undefined) {
                    console.log("🔑 [usePasswordLogin] Still no pendingUserId after delay - redirecting to PIN");
                    Alert.alert("Error", "Session expired. Please try again.", [
                        {
                            text: "OK",
                            onPress: () => {
                                console.log("🔑 [usePasswordLogin] User pressed OK - redirecting to PIN");
                                router.replace("/(auth)/pincode-login-screen");
                            }
                        },
                    ]);
                }
            }, 500); // 500ms delay to allow context to hydrate

            return () => clearTimeout(timer);
        } else {
            console.log("🔑 [usePasswordLogin] ✅ Valid pendingUserId found:", pendingUserId);
        }
    }, [pendingUserId]);

    const submitPassword = async () => {
        console.log("🔑 [usePasswordLogin] ========== SUBMIT PASSWORD ==========");
        console.log("🔑 [usePasswordLogin] Password entered:", password ? `Yes (length: ${password.length})` : "No");
        console.log("🔑 [usePasswordLogin] Current pendingUserId:", pendingUserId);

        if (!password) {
            console.log("🔑 [usePasswordLogin] ❌ No password entered");
            Alert.alert("Error", "Please enter your password");
            return;
        }

        if (!pendingUserId) {
            console.log("🔑 [usePasswordLogin] ❌ No pendingUserId on submit");
            Alert.alert("Error", "Session expired. Please try again.");
            goBack();
            return;
        }

        clearError();
        try {
            console.log(`🔑 [usePasswordLogin] 📤 Verifying password for userId: ${pendingUserId}`);
            await verifyPassword(pendingUserId, password);
            console.log("🔑 [usePasswordLogin] ✅ Password verified successfully");
        } catch (err: any) {
            console.log("🔑 [usePasswordLogin] ❌ Password verification failed:", err.message);
            // error is handled via AuthContext's error state
        }
    };

    const goBack = () => {
        console.log("🔑 [usePasswordLogin] 🔙 Going back to PIN screen");
        clearError();
        setPendingUserId(null);
        router.replace("/(auth)/pincode-login-screen");
    };

    const submitOnEnter = () => {
        console.log("🔑 [usePasswordLogin] Enter key pressed");
        if (password && !loading) submitPassword();
    };

    return { password, setPassword, submitPassword, submitOnEnter, goBack, loading, error };
}