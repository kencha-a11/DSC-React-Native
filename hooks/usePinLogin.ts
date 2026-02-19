import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export function usePinLogin() {
    const [pinCode, setPinCode] = useState("123456");
    const [submitted, setSubmitted] = useState(false); // ✅ prevent double submit
    const { checkPin, error, loading, clearError } = useAuth();

    // Clear error on unmount
    useEffect(() => {
        return () => clearError();
    }, []);

    // Clear error when user types
    useEffect(() => {
        if (pinCode) clearError();
    }, [pinCode]);

    // 🔹 Clear PIN automatically on error
    useEffect(() => {
        if (error) {
            setPinCode(""); // clear PIN
            setSubmitted(false); // reset submitted flag
        }
    }, [error]);

    // 🔹 Auto-submit when PIN reaches 6 digits
    useEffect(() => {
        if (pinCode.length === 6 && !loading && !submitted) {
            submitPin(pinCode);
            setSubmitted(true);
        } else if (pinCode.length < 6 && submitted) {
            // Reset submitted flag if user deletes a digit
            setSubmitted(false);
        }
    }, [pinCode, loading, submitted]);

    const submitPin = async (pin?: string) => {
        const pinToCheck = pin || pinCode;

        if (!pinToCheck) return;

        clearError();

        try {
            const result = await checkPin(pinToCheck);

            if (result.requirePassword) {
                router.replace({
                    pathname: "/(auth)/password-login-screen",
                    params: { userId: result.userId },
                });
            } else {
                router.replace("/(cashier)");
            }
        } catch (err) {
            console.error("PIN submit error:", err);
        }
    };

    return {
        pinCode,
        setPinCode,
        submitPin,
        error,
        loading,
    };
}
