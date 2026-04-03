// components/modal/ExitCartModal.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

interface ExitCartModalProps {
  visible: boolean;
  onClose: () => void;
  onClearAndExit: () => void;
  onExit: () => void;
  itemCount: number;
}

export default function ExitCartModal({
  visible,
  onClose,
  onClearAndExit,
  onExit,
  itemCount,
}: ExitCartModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalContent}>
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="exit-outline" size={50} color="#ED277C" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Leave with items?</Text>

            {/* Message */}
            <Text style={styles.message}>
              You have {itemCount} item{itemCount !== 1 ? "s" : ""} in your
              cart. What would you like to do?
            </Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.option, styles.clearOption]}
                onPress={onClearAndExit}
              >
                <Ionicons name="trash-outline" size={24} color="#ED277C" />
                <Text style={styles.optionTitle}>Clear Cart & Exit</Text>
                <Text style={styles.optionDescription}>
                  Remove all items and go back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, styles.keepOption]}
                onPress={onExit}
              >
                <Ionicons name="cart-outline" size={24} color="#ED277C" />
                <Text style={styles.optionTitle}>Keep Items & Exit</Text>
                <Text style={styles.optionDescription}>
                  Items will stay in your cart
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  optionsContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 16,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    alignItems: "center",
  },
  clearOption: {
    backgroundColor: "#FFF0F0",
  },
  keepOption: {
    backgroundColor: "#F0F5FF",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
});
