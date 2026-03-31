// app/(manager)/(tabs)/_layout.tsx
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { Platform, View, Text, TouchableWithoutFeedback, StyleSheet } from "react-native";

type FontAwesome5IconName = React.ComponentProps<typeof FontAwesome5>["name"];
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

// 
<MaterialIcons name="dashboard" size={24} color="black" />

interface TabItem {
  name: string;
  title: string;
  icon: FontAwesome5IconName | MaterialIconName;
  library: "FontAwesome5" | "MaterialIcons";
}

const TabIcon = ({ library, name, color }: { library: TabItem["library"]; name: TabItem["icon"]; color: string }) => {
  if (library === "FontAwesome5") {
    return <FontAwesome5 name={name as FontAwesome5IconName} size={22} color={color} />;
  }
  return <MaterialIcons name={name as MaterialIconName} size={24} color={color} />;
};

function CustomTabBar({ state, navigation }: any) {
  // All manager tabs are always shown
  const tabs: TabItem[] = [
    { name: "index", title: "Dashboard", icon: "home", library: "FontAwesome5" },
    { name: "accounts", title: "Accounts", icon: "users", library: "FontAwesome5" as const },
    { name: "manager-inventory", title: "Inventory", icon: "box", library: "FontAwesome5" as const },
    { name: "record", title: "Records", icon: "clipboard-list", library: "FontAwesome5" as const },
    { name: "report", title: "Reports", icon: "chart-bar", library: "FontAwesome5" as const },
    { name: "profile", title: "Profile", icon: "account-circle", library: "MaterialIcons" as const },
  ];

  const handleTabPress = (tabName: string, isFocused: boolean) => {
    if (isFocused) return;

    const event = navigation.emit({
      type: "tabPress",
      target: tabName,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      // Navigate using Expo Router
      if (tabName === "index") {
        router.push("/(manager)/(tabs)");
      } else if (tabName === "accounts") {
        router.push("/(manager)/(tabs)/accounts");
      } else if (tabName === "manager-inventory") {
        router.push("/(manager)/(tabs)/manager-inventory");
      } else if (tabName === "record") {
        router.push("/(manager)/(tabs)/record");
      } else if (tabName === "report") {
        router.push("/(manager)/(tabs)/report");
      } else if (tabName === "profile") {
        router.push("/(manager)/(tabs)/profile");
      }
    }
  };

  return (
    <View style={styles.tabBar}>
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 40,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "500",
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {/* All screens are declared for routing */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="accounts" />
      <Tabs.Screen name="manager-inventory" />
      <Tabs.Screen name="record" />
      <Tabs.Screen name="report" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}