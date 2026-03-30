// providers/index.tsx
import { AuthProvider } from "@/context/AuthContext";
import { PermissionProvider } from "@/context/PermissionContext";
import { ProductProvider } from "@/context/ProductContext";
import { CartProvider } from "@/context/CartContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { memo } from "react";
import { AccountProvider } from "@/context/AccountContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export const AppProviders = memo(({ children }: ProvidersProps) => (
  <AuthProvider>
    <PermissionProvider>
      <CategoryProvider>
        <ProductProvider>
          <AccountProvider>
            <CartProvider>{children}</CartProvider>
          </AccountProvider>
        </ProductProvider>
      </CategoryProvider>
    </PermissionProvider>
  </AuthProvider>
));

AppProviders.displayName = "AppProviders";
