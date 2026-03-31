// app/(manager)/_layout.tsx
import { Stack } from "expo-router";

export default function ManagerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />

      <Stack.Screen
        name="account/create/step1"
        options={{
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="account/create/step2"
        options={{
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="account/[id]/index"
        options={{
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="account/[id]/edit"
        options={{
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="account/[id]/permissions"
        options={{ 
          presentation: "card" 
        }}
      />
    </Stack>
  );
}
