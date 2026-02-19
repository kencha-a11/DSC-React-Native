import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export function usePasswordLogin() {
    const [password, setPassword] = useState("password");

    const { verifyPassword, error, loading, clearError } = useAuth();
    const { userId } = useLocalSearchParams<{ userId: string }>();

    // Clear error on unmount
    useEffect(() => {
        return () => clearError();
    }, []);

    // Clear error when user types
    useEffect(() => {
        if (password) clearError();
    }, [password]);

    // Validate userId
    useEffect(() => {
        if (!userId) {
            Alert.alert("Error", "Session expired. Please try again.", [
                {
                    text: "OK",
                    onPress: () => router.replace("/(auth)/pincode-login-screen"),
                },
            ]);
        }
    }, [userId]);

    // ------------------------------
    // Submit password
    // ------------------------------
    const submitPassword = async () => {
        if (!password) {
            Alert.alert("Error", "Please enter your password");
            return;
        }

        if (!userId) {
            Alert.alert("Error", "Session expired. Please try again.");
            goBack();
            return;
        }

        clearError();

        try {
            await verifyPassword(Number(userId), password);
            console.log("[PASSWORD LOGIN] authenticated");
            // AuthGuard will redirect automatically
        } catch (err) {
            console.error("Password submit error:", err);
        }
    };

    // ------------------------------
    // Back to PIN
    // ------------------------------
    const goBack = () => {
        clearError();
        router.replace("/(auth)/pincode-login-screen");
    };

    // ------------------------------
    // Enter key handler
    // ------------------------------
    const submitOnEnter = () => {
        if (password && !loading) {
            submitPassword();
        }
    };

    return {
        password,
        setPassword,
        submitPassword,
        submitOnEnter,
        goBack,
        loading,
        error,
    };
}
