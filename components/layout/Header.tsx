import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  testID?: string;
}

export default function Header({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  backgroundColor = "#fff",
  titleColor = "#000",
  testID,
}: HeaderProps) {
  return (
    <View style={[styles.header, { backgroundColor }]} testID={testID}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity onPress={onBackPress} testID="back-button">
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        {title && (
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        )}
      </View>

      {/* rightSection grows if needed for badge */}
      <View style={styles.rightSection}>
        {rightComponent ?? <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingTop: 60,
  },
  leftSection: { width: 40, alignItems: "flex-start" },
  centerSection: { flex: 1, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "900" },
  rightSection: { width: 44, alignItems: "flex-end" },
  placeholder: { width: 24, height: 24 },
});
