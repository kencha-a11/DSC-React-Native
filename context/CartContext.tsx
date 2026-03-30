// contexts/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react";
import { CreateSalePayload, saleService } from "@/services/saleService";
import { useProducts } from "./ProductContext";
import { useAuth } from "./AuthContext";
import { Alert, Platform, ToastAndroid } from "react-native";

interface AddToCartInput {
  id: number;
  name: string;
  price: number;
  image?: string | null;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (product: AddToCartInput, quantity?: number) => void;
  removeItem: (id: number) => void;
  incrementQuantity: (id: number) => void;
  decrementQuantity: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  confirmPurchase: () => Promise<boolean>;
  total: number;
  formattedTotal: string;
  loading: boolean;
  hasItems: boolean;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const showToast = (message: string, type: "error" | "success" | "warning" = "error") => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(
      type === "error" ? "Error" : type === "success" ? "Success" : "Warning",
      message
    );
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const { products, refreshProducts } = useProducts();

  const productMap = useMemo(() => {
    const map = new Map<number, number>();
    products.forEach(p => {
      map.set(p.id, p.stock_quantity);
      if (p.id === 77) {
      }
    });
    return map;
  }, [products]);

  const getStock = useCallback((id: number) => {
    const stock = productMap.get(id) ?? 0;
    if (id === 77) {
    }
    return stock;
  }, [productMap]);

  const addItem = useCallback((product: AddToCartInput, quantity = 1) => {
    if (!isAuthenticated) {
      showToast("Please log in to add items to cart");
      return;
    }
    const stock = getStock(product.id);
    if (quantity > stock) {
      showToast(`Only ${stock} available.`);
      return;
    }
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > stock) {
          showToast(`Cannot add ${quantity} more. Only ${stock - existing.quantity} additional available.`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { ...product, quantity, image: product.image ?? null }];
    });
  }, [isAuthenticated, getStock]);

  const removeItem = useCallback((id: number) => {
    setCartItems(prev => {
      const newCart = prev.filter(i => i.id !== id);
      return newCart;
    });
  }, []);

  const incrementQuantity = useCallback((id: number) => {
    setCartItems(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) {
        return prev;
      }
      const newQty = item.quantity + 1;
      if (newQty > getStock(id)) {
        showToast(`Cannot add more. Only ${getStock(id)} total available.`);
        return prev;
      }
      return prev.map(i => i.id === id ? { ...i, quantity: newQty } : i);
    });
  }, [getStock]);

  const decrementQuantity = useCallback((id: number) => {
    setCartItems(prev => {
      const newCart = prev
        .map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0);
      return newCart;
    });
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    if (quantity > getStock(id)) {
      showToast(`Cannot set quantity to ${quantity}. Only ${getStock(id)} available.`);
      return;
    }
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, [getStock, removeItem]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const confirmPurchase = useCallback(async () => {

    if (!isAuthenticated) {
      showToast("Please log in to complete purchase");
      return false;
    }
    if (cartItems.length === 0) {
      showToast("Cart is empty");
      return false;
    }

    // Final stock validation
    for (const item of cartItems) {
      const stock = getStock(item.id);
      if (item.quantity > stock) {
        showToast(`"${item.name}" only has ${stock} in stock.`);
        return false;
      }
    }

    setLoading(true);
    try {
      const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const payload: CreateSalePayload = {
        items: cartItems.map(i => ({ product_id: i.id, quantity: i.quantity })),
        total_amount: total,
        device_datetime: new Date().toISOString(),
      };

      const startTime = Date.now();
      const response = await saleService.createSale(payload, { allowOffline: true, timeout: 15000 });
      const saleDuration = Date.now() - startTime;

      if (response.sale_id === -1) {
        showToast("Sale saved offline. Will sync when online.", "warning");
        return false;
      }

      // 🔥 Wait for database to commit the stock change
      await new Promise(resolve => setTimeout(resolve, 500));

      const refreshStart = Date.now();
      await refreshProducts();
      const refreshDuration = Date.now() - refreshStart;

      // Log the stock of product 61 after refresh (to verify it changed)
      const product61 = products.find(p => p.id === 61);
      if (product61) {
      } else {
      }

      setCartItems([]);

      return true;
    } catch (error: any) {
      showToast(error.message || "Something went wrong");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, cartItems, getStock, refreshProducts, products]);

  // Log when cart changes
  useEffect(() => {
  }, [cartItems]);

  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const formattedTotal = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(total);
  const hasItems = cartItems.length > 0;
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        removeItem,
        incrementQuantity,
        decrementQuantity,
        updateQuantity,
        clearCart,
        confirmPurchase,
        total,
        formattedTotal,
        loading,
        hasItems,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};