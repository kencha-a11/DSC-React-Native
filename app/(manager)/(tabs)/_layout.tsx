import React, { ComponentProps } from "react";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { View, Text, TouchableWithoutFeedback, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FontAwesome5IconName = ComponentProps<typeof FontAwesome5>["name"];
type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

interface TabItem {
  name: string;
  title: string;
  icon: FontAwesome5IconName | MaterialIconName;
  library: "FontAwesome5" | "MaterialIcons";
}

interface TabIconProps {
  library: TabItem["library"];
  name: TabItem["icon"];
  color: string;
}

const TabIcon = ({ library, name, color }: TabIconProps) => {
  if (library === "FontAwesome5") {
    return <FontAwesome5 name={name as FontAwesome5IconName} size={22} color={color} />;
  }
  return <MaterialIcons name={name as MaterialIconName} size={24} color={color} />;
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const tabs: TabItem[] = [
    { name: "index", title: "Dashboard", icon: "home", library: "FontAwesome5" },
    { name: "accounts", title: "Accounts", icon: "users", library: "FontAwesome5" },
    { name: "manager-inventory", title: "Inventory", icon: "box", library: "FontAwesome5" },
    { name: "record", title: "Records", icon: "clipboard-list", library: "FontAwesome5" },
    { name: "profile", title: "Profile", icon: "account-circle", library: "MaterialIcons" },
  ];

  const handleTabPress = (tabName: string, isFocused: boolean) => {
    if (isFocused) return;

    const event = navigation.emit({
      type: "tabPress",
      target: tabName,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      const path = tabName === "index" ? "/(manager)/(tabs)" : `/(manager)/(tabs)/${tabName}`;
      router.push(path as any);
    }
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
      {tabs.map((tab) => {
        const isFocused = state.routes[state.index].name === tab.name;
        const color = isFocused ? "#ED277C" : "#999";

        return (
          <TouchableWithoutFeedback key={tab.name} onPress={() => handleTabPress(tab.name, isFocused)}>
            <View style={styles.tabItem}>
              <TabIcon library={tab.library} name={tab.icon} color={color} />
              <Text style={[styles.tabText, { color }]}>{tab.title}</Text>
            </View>
          </TouchableWithoutFeedback>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="accounts" />
      <Tabs.Screen name="manager-inventory" />
      <Tabs.Screen name="record" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 10,
    fontWeight: "500",
  },
});