import { FontAwesome5 } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { View, Text, TouchableWithoutFeedback, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { usePermissions } from "@/context/PermissionContext";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FontAwesome5IconName = React.ComponentProps<typeof FontAwesome5>["name"];
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

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

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { hasPermission } = usePermissions();

  const hasInventoryAccess =
    hasPermission("view_inventory") ||
    hasPermission("add_item") ||
    hasPermission("edit_items") ||
    hasPermission("restock_items") ||
    hasPermission("deduct_items") ||
    hasPermission("remove_items");

  const tabs: TabItem[] = [
    { name: "index", title: "Home", icon: "home", library: "FontAwesome5" },
    ...(hasInventoryAccess
      ? [
        {
          name: "cashier-inventory",
          title: "Inventory",
          icon: "inventory" as MaterialIconName,
          library: "MaterialIcons" as const,
        },
      ]
      : []),
    {
      name: "profile",
      title: "Profile",
      icon: "account-circle" as MaterialIconName,
      library: "MaterialIcons" as const,
    },
  ];

  const handleTabPress = (tabName: string, isFocused: boolean) => {
    if (isFocused) return;

    const event = navigation.emit({
      type: "tabPress",
      target: tabName,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      if (tabName === "index") {
        router.push("/(cashier)/(tabs)");
      } else if (tabName === "cashier-inventory") {
        router.push("/(cashier)/(tabs)/cashier-inventory");
      } else if (tabName === "profile") {
        router.push("/(cashier)/(tabs)/profile");
      }
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

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="cashier-inventory" />
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