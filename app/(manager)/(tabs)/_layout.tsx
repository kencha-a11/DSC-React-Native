// app/(manager)/(tabs)/_layout.tsx
import { FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ED277C",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          // Add safe area for Android
          ...(Platform.OS === "android" && {
            height: 60 + 40, // Add extra height for Android nav bar
            paddingBottom: 20, // Extra padding sa ilalim
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={22} color={color} />
          ),
          headerTitle: "Dashboard",
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="users" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="box" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: "Records",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="clipboard-list" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="chart-bar" size={20} color={color} />
          ),
        }}
      />
      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-circle" size={24} color={color} />
          ),
          headerTitle: "Profile",
        }}
      />
    </Tabs>
  );
}
