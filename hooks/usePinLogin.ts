import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

interface CheckPinResult {
    requirePassword: boolean;
    userId?: number;
    user?: { id: number; first_name: string; last_name: string; role: string; };
    token?: string;
}

export function usePinLogin() {
    const [pinCode, setPinCode] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const { checkPin, error, loading, clearError } = useAuth();

    useEffect(() => { return () => clearError(); }, []);
    useEffect(() => { if (pinCode) clearError(); }, [pinCode]);
    useEffect(() => {
        if (error) {
            setSubmitted(false);
            setPinCode("");
        }
    }, [error]);

    const submitPin = async (pin?: string) => {
        const pinToCheck = pin || pinCode;
        if (!pinToCheck) return;

        clearError();
        setSubmitted(true);

        try {
            const result = await checkPin(pinToCheck) as CheckPinResult;

            if (result?.requirePassword) {
                console.log("🔧 [usePinLogin] Password required for user ID:", result.userId);

                // Wait a bit longer to ensure context updates
                await new Promise(resolve => setTimeout(resolve, 300));

                // Check if context was updated (optional)
                console.log("🔧 [usePinLogin] Navigating to password screen after delay");
                router.replace("/(auth)/password-login-screen");
            } else {
                const role = result?.user?.role;
                if (role === "cashier") router.replace("/(cashier)/(tabs)");
                else if (role === "manager") router.replace("/(manager)/(tabs)");
                else if (role === "superadmin") router.replace("/(superadmin)");
                else router.replace("/(cashier)/(tabs)");
            }
        } catch (err: any) {
            // error is handled via AuthContext's error state
        } finally {
            setSubmitted(false);
        }
    };

    return { pinCode, setPinCode, submitPin, error, loading, submitted };
}