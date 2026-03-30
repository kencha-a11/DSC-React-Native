import { Stack } from "expo-router";

export default function CashierLayout() {
  return (
    // para gumana dapat walang index.tsx sa (cashier) folder
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Tabs screen sa loob nito */}
      <Stack.Screen name="(tabs)" />

      {/* saka na ibang screen sa cashier liban sa tabs */}
      {/* screen ito para sa cart ng walang (tabs) */}
      {/* <Stack.Screen
        name="cashier/cart"
        options={{
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="cashier/product"
        options={{
          presentation: "card",
        }}
      /> */}
    </Stack>
  );
}
