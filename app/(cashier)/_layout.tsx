// app/(cashier)/_layout.tsx
import { Stack } from "expo-router";

export default function CashierLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      {/* 👇 Add cart screen */}
      <Stack.Screen name="cart" options={{ presentation: "card" }} />
    </Stack>
  );
}