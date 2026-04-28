import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import LogoutModal from "./LogoutModal";

export default function LogoutButton() {
  const { logout, clearError } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      clearError();
      await logout();
      // AuthGuard will handle the redirect to login screen automatically when user becomes null
    } catch (err) {
      console.error("Logout failed:", err);
      // Only reset state if logout fails (and component is still mounted)
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => setShowModal(true)} 
          style={styles.button}
        >
          <Text style={styles.text}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <LogoutModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleLogout}
        loading={loading}
      />
    </>
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