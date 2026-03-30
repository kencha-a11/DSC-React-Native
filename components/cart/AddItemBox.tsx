import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface AddItemBoxProps {
  onAddItem: () => void;
  onSearch: () => void;
  onBarcodeScan: () => void;
}

export default function AddItemBox({
  onAddItem,
  onSearch,
  onBarcodeScan,
}: AddItemBoxProps) {
  return (
    <View style={styles.container} testID="add-item-box">
      {/* + Add item link */}
      <TouchableOpacity onPress={onAddItem} testID="add-item-button">
        <Text style={styles.addText}>+ Add item</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        {/* Search icon */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={onSearch}
          testID="search-button"
        >
          <Ionicons name="search" size={25} color="#ED277C" />
        </TouchableOpacity>

        {/* Barcode icon */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={onBarcodeScan}
          testID="barcode-button"
        >
          <Ionicons name="barcode-outline" size={25} color="#ED277C" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ED277C",
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  addText: {
    color: "#ED277C",
    fontWeight: "600",
    fontSize: 22,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 18,
  },
  iconContainer: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ED277C",
  },
});
