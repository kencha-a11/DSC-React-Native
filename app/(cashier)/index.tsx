import React from "react";
import { StyleSheet, View } from "react-native";
import CartSection from "@/components/cart/CartSection";
import CartSummary from "@/components/cart/CartSummary";
import ActionButtons from "@/components/cart/ActionButton";
import { useCart } from "@/context/CartContext";

import ProductTestData from "@/components/test/ProductTestData";
import SaleTestData from "@/components/test/SaleTestData";
import ProductTestDataBarcode from "@/components/test/ProductTestDataBarcode";

const CashierDashboard = () => {
  const { cartItems, total } = useCart();

  console.log("🛒 Dashboard Cart Count:", cartItems.length);

  return (
    <View style={{flex:1}}>
      <View style={styles.container}>
        <CartSection items={cartItems} />
        <CartSummary
          total={total.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        />
        <ActionButtons />
      </View>

      {/* <ProductTestData /> */}
      {/* <SaleTestData /> */}
      {/* <ProductTestDataBarcode /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default CashierDashboard;
