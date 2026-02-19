import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface CartSummaryProps {
  total: string;
}

// Added ": CartSummaryProps" here
const CartSummary = ({ total }: CartSummaryProps) => {
  return (
    <View style={styles.submitcontainer}>
      <Text className="text-2xl font-bold">Total: ₱ {total}</Text>
      <TouchableOpacity className="bg-violet-400 rounded-lg">
        <Text className="text-2xl font-bold text-white p-2 py-4">
          Complete Purchase
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  submitcontainer: {
    flex: 1,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "4%",
  },
});

export default CartSummary;