import { AuthGuard } from "@/context/AuthGuard";
import { CartProvider } from "@/context/CartContext";
import { Stack } from "expo-router";

export default function CashierLayout() {
  return (
    <>
      <CartProvider>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }} />
      </CartProvider>
    </>
  );
}
