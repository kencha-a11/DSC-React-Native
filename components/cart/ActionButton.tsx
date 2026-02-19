import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router"; // 1. Import the router
import Ionicons from "@expo/vector-icons/Ionicons";
import { iconSize } from "@/utils/responsive";

const ActionButtons = () => {
  const router = useRouter(); // 2. Initialize the router

  return (
    <View style={styles.actioncontainer}>
      {/* 3. Use router.push() to navigate */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.push("/(cashier)/barcode-product-screen")}
      >
        <Ionicons name="barcode-sharp" size={iconSize.medium} color="darkviolet"/>
        <Text className="text-xl font-bold">Barcode Scanner</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.push("/(cashier)/search-product-screen")}
      >
        <Ionicons name="search" size={iconSize.medium} color="violet" />
        <Text className="text-xl font-bold">Search Product</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actioncontainer: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: "#fff",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: "4%",
    marginHorizontal: "4%",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default ActionButtons;
