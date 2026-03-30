import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/context/CartContext";
import DscToast from "@/components/common/DscToast";
// TEST
import ProductItem from "@/components/test/learning/useToggleLearningComponent"

const { width } = Dimensions.get("window");

type ToastType = "success" | "error" | "warning" | "info";

export default function HomeScreen() {
  const { hasItems, itemCount } = useCart();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  useFocusEffect(
    useCallback(() => {
      return () => {};
    }, []),
  );

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleNewSale = () => {
    if (hasItems) {
      router.push("/(cashier)/cart");
    } else {
      router.push("/(cashier)/cart");
    }
  };

  const handleViewCart = () => {
    router.push("/(cashier)/cart");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <DscToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
        showCloseButton={true}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>SOUVENIRS</Text>
        </View>
        {hasItems && (
          <TouchableOpacity style={styles.cartBadge} onPress={handleViewCart}>
            <Ionicons name="cart-outline" size={24} color="#fff" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/logo/dsc-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Welcome, Cashier!</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* New Sale / Continue Sale Button */}
        <TouchableOpacity
          style={[styles.newSaleButton, hasItems && styles.continueSaleButton]}
          onPress={handleNewSale}
        >
          <Text style={styles.newSaleText}>
            {hasItems
              ? `Continue Sale (${itemCount} item${itemCount !== 1 ? "s" : ""})`
              : "New Sale"}
          </Text>
        </TouchableOpacity>

        {/* Cart Button (if has items) */}
        {hasItems && (
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={handleViewCart}
          >
            <Ionicons name="cart-outline" size={20} color="#ED277C" />
            <Text style={styles.viewCartText}>View Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  header: {
    backgroundColor: "#ED277C",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    paddingBottom: 20,
  },
  cartBadge: {
    position: "absolute",
    right: 20,
    top: 60,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  badgeText: {
    color: "#ED277C",
    fontSize: 10,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -30,
  },
  logoContainer: {
    backgroundColor: "#ffffff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  logoImage: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  newSaleButton: {
    backgroundColor: "#ED277C",
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#C2185B",
  },
  continueSaleButton: {
    backgroundColor: "#FF9800",
    borderColor: "#F57C00",
  },
  newSaleText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  viewCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ED277C",
    gap: 8,
  },
  viewCartText: {
    color: "#ED277C",
    fontSize: 16,
    fontWeight: "600",
  },
});
