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

      {/* WRAPPER: Now takes all available space and is fully touchable */}
      <TouchableOpacity
        style={styles.addWrapper}
        onPress={onAddItem}
        testID="add-item-button"
      >
        <Text style={styles.addText}>+ Add item</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
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
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    // Removed padding from here to let the touchable handle it
  },
  addWrapper: {
    flex: 1, // <--- This forces it to fill the left side
    paddingVertical: 24, // Matches your desired height
    paddingHorizontal: 16,
  },
  addText: {
    color: "#ED277C",
    fontWeight: "600",
    fontSize: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingRight: 8, // Adds some breathing room from the edge
  },
  iconContainer: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ED277C",
    marginRight: 8,
  },
});