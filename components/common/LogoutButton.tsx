import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function LogoutButton() {
  const { logout, clearError } = useAuth();

  const handleLogout = async () => {
    try {
      clearError();
      await logout();
      router.replace("/(auth)/pincode-login-screen");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleLogout} style={styles.button}>
        <Text style={styles.text}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  button: {
    backgroundColor: "#ED277C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
