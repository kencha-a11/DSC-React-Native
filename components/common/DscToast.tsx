import { Text, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

type ToastType = "success" | "error" | "warning" | "info";

interface DscToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const TOAST_CONFIG = {
  success: { icon: "check-circle", color: "#34C759", bg: "#CFF3D7" },
  error: { icon: "exclamation-circle", color: "#FF3B30", bg: "#FFE5E5" },
  warning: { icon: "exclamation-triangle", color: "#FF9500", bg: "#FFF4E0" },
  info: { icon: "info-circle", color: "#007AFF", bg: "#E5F0FF" },
} as const;

export default function DscToast({
  visible,
  message,
  type = "success",
  onClose,
  showCloseButton = true,
}: DscToastProps) {
  if (!visible) return null;

  const config = TOAST_CONFIG[type];

  return (
    <View style={[styles.toast, { backgroundColor: config.bg }]}>
      <FontAwesome name={config.icon} size={20} color={config.color} />
      <Text style={styles.text}>{message}</Text>
      {showCloseButton && (
        <TouchableWithoutFeedback onPress={onClose}>
          <FontAwesome name="times" size={18} color="#666" />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
  },
});
