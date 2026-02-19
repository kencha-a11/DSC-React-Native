// app/_layout.tsx
console.info("[ROOTLAYOUT] Rendering RootLayout with Providers and AuthGuard");

import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/context/AuthGuard";
import { CartProvider } from "@/context/CartContext";
import { ProductProvider } from "@/context/ProductContext";

import { Slot } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <AuthGuard />
          <Slot />
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

/* ProductProvider is nested inside AuthProvider so that 
  Axios calls made by the ProductContext can access the 
  Auth token from your SecureStore/Auth state.
*/
