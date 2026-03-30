// app/(manager)/_layout.tsx
import { Stack } from "expo-router";

export default function ManagerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 👈 Hide header for ALL screens
      }}
    >
      {/* Tabs screen - may tabs ito */}
      <Stack.Screen name="(tabs)" />

      {/* Create Account - Step 1 */}
      <Stack.Screen
        name="account/create/step1"
        options={{
          presentation: "card", // or "modal" if gusto mo modal effect
        }}
      />

      {/* Create Account - Step 2 */}
      <Stack.Screen
        name="account/create/step2"
        options={{
          presentation: "card",
        }}
      />

      {/* Account screen */}
      <Stack.Screen
        name="account/[id]/index.tsx"
        options={{
          presentation: "card",
        }}
      />

      {/* Edit Account screen */}
      <Stack.Screen
        name="account/[id]/edit"
        options={{
          presentation: "card",
        }}
      />

      {/* Permission Account screen */}
      <Stack.Screen
        name="account/[id]/permission"
        options={{ presentation: "card" }}
      />
    </Stack>
  );
}
