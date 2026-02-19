import { AuthGuard } from "@/context/AuthGuard";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
