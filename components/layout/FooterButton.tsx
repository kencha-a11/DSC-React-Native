// components/common/FooterButton.tsx
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import React from "react";

// Props interface for FooterButton
interface FooterButtonProps {
  children?: React.ReactNode;
  containerStyle?: ViewStyle;
}

// Props interface for FooterButtonItem
interface FooterButtonItemProps {
  title: string;
  onPress?: () => void;
  type?: "primary" | "secondary";
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function FooterButton({
  children,
  containerStyle,
}: FooterButtonProps) {
  return <View style={[styles.container, containerStyle]}>{children}</View>;
}

// Pre-built button components for convenience
export const FooterButtonItem: React.FC<FooterButtonItemProps> = ({
  title,
  onPress,
  type = "primary",
  style,
  textStyle,
  disabled = false,
}) => {
  const isPrimary = type === "primary";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        style, // ← custom style applied before disabled so disabled always wins
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.buttonText,
          isPrimary ? styles.primaryText : styles.secondaryText,
          textStyle,
          disabled && styles.disabledText, // Text color for disabled state
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
    marginBottom: 40,
    gap: 15,
  } as ViewStyle,
  button: {
    flex: 1,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  primaryButton: {
    backgroundColor: "#ED277C",
  } as ViewStyle,
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#ED277C",
    backgroundColor: "transparent",
  } as ViewStyle,
  disabledButton: {
    backgroundColor: "#ccc", // solid gray — no opacity trick
    borderColor: "#ccc", // also covers secondary border
    opacity: 1, // explicit reset so no stacking
  } as ViewStyle,
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  } as TextStyle,
  primaryText: {
    color: "#fff",
  } as TextStyle,
  secondaryText: {
    color: "#ED277C",
  } as TextStyle,
  disabledText: {
    color: "#666", // Darker gray for better contrast on light gray background
  } as TextStyle,
});
