import { AuthGuard } from "@/context/AuthGuard";
import { Stack } from "expo-router";

export default function SuperAdminLayout() {
  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
