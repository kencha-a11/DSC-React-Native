import { View, Text, Button } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function LogoutButton() {
  const { logout, clearError } = useAuth();

  const handleLogout = async () => {
    try {
      clearError(); // optional: clear any lingering errors
      await logout(); // perform logout
      router.replace("/(auth)/pincode-login-screen"); // redirect to PIN login
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <View>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
