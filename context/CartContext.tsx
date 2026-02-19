import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { CreateSalePayload, createSale } from "@/services/saleServices";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProducts } from "./ProductContext";

// Define input type for adding items (without quantity)
interface AddToCartInput {
  id: number;
  name: string;
  price: number;
}

// Cart item type (includes quantity)
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (product: AddToCartInput, quantity?: number) => void; // Changed to AddToCartInput
  removeItem: (id: number) => void;
  incrementQuantity: (id: number) => void;
  decrementQuantity: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  confirmPurchase: () => Promise<void>;
  total: number;
  loading: boolean;
  hasItems: boolean;
  itemCount: number;
}

const CACHE_KEY = "cart_cache";
const CACHE_TIMESTAMP_KEY = "cart_cache_timestamp";
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

const CartContext = createContext<CartContextType | undefined>(undefined);

// 2. The Provider (The "Engine" that manages the data)
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchProducts, products } = useProducts(); // Get both in one call

  // 💾 Load cached cart on mount
  useEffect(() => {
    loadCache();
  }, []);

  // 💾 Save to cache whenever cartItems changes
  useEffect(() => {
    if (cartItems.length > 0) {
      saveCache(cartItems);
    } else {
      clearCacheStorage();
    }
  }, [cartItems]);

  const loadCache = async () => {
    try {
      const [cached, timestamp] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY),
      ]);

      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_EXPIRY_MS) {
          setCartItems(JSON.parse(cached));
          console.log("[CartContext] ✅ Loaded cart from cache");
          return;
        } else {
          console.log("[CartContext] ⏰ Cart cache expired, starting fresh");
          await clearCacheStorage();
        }
      }
    } catch (e) {
      console.error("[CartContext] ❌ Cache load error:", e);
    }
  };

  const saveCache = async (data: CartItem[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString()),
      ]);
      console.log("[CartContext] 💾 Cart saved to cache");
    } catch (e) {
      console.error("[CartContext] ❌ Cache save error:", e);
    }
  };

  const clearCacheStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEY),
        AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY),
      ]);
      console.log("[CartContext] 🗑️ Cache cleared");
    } catch (e) {
      console.error("[CartContext] ❌ Cache clear error:", e);
    }
  };

  const clearCart = async () => {
    setCartItems([]); // reset state
    await clearCacheStorage(); // clear storage
  };

  // Helper function to check stock - using only stock_quantity
  const checkStockAvailability = (
    productId: number,
    requestedQuantity: number,
  ): { available: boolean; stock: number } => {
    const actualProduct = products.find((p) => p.id === productId);
    // Only use stock_quantity, remove the fallback to 'stock'
    const availableStock = actualProduct?.stock_quantity ?? 0;

    return {
      available: requestedQuantity <= availableStock,
      stock: availableStock,
    };
  };

  const addItem = (product: AddToCartInput, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const { available, stock } = checkStockAvailability(product.id, quantity);

      if (!available) {
        alert(`Not enough stock. Only ${stock} available.`);
        return prev;
      }

      if (existing) {
        const newQuantity = existing.quantity + quantity;
        // Check total quantity including existing cart items
        const { available: totalAvailable, stock: totalStock } =
          checkStockAvailability(product.id, newQuantity);

        if (!totalAvailable) {
          alert(
            `Cannot add ${quantity} more. Only ${totalStock - existing.quantity} additional available.`,
          );
          return prev;
        }

        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item,
        );
      }

      // Create a CartItem from AddToCartInput and quantity
      const newItem: CartItem = {
        ...product,
        quantity,
      };
      return [...prev, newItem];
    });
  };

  const removeItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Increment quantity by 1 with stock check
  const incrementQuantity = (id: number) => {
    setCartItems((prev) => {
      const item = prev.find((item) => item.id === id);
      if (!item) return prev;

      const { available, stock } = checkStockAvailability(
        id,
        item.quantity + 1,
      );

      if (!available) {
        alert(`Cannot add more. Only ${stock} total available.`);
        return prev;
      }

      return prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );
    });
  };

  // Decrement quantity by 1, remove if reaches 0
  const decrementQuantity = (id: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  // Set exact quantity (useful for manual input)
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setCartItems((prev) => {
      const { available, stock } = checkStockAvailability(id, quantity);

      if (!available) {
        alert(`Cannot set quantity to ${quantity}. Only ${stock} available.`);
        return prev;
      }

      return prev.map((item) =>
        item.id === id ? { ...item, quantity } : item,
      );
    });
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const confirmPurchase = async () => {
    if (cartItems.length === 0) {
      alert("Cart is empty");
      return;
    }

    // Double-check stock before confirming purchase
    for (const item of cartItems) {
      const { available, stock } = checkStockAvailability(
        item.id,
        item.quantity,
      );
      if (!available) {
        alert(
          `Sorry, "${item.name}" stock changed. Only ${stock} available. Please adjust your cart.`,
        );
        return;
      }
    }

    setLoading(true);
    try {
      const payload: CreateSalePayload = {
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        total_amount: total,
        device_datetime: new Date().toISOString(),
      };

      // 1. Send data to backend (PHP store function)
      await createSale(payload);

      // 2. Refresh ProductContext stocks (to update "30 left" in UI)
      await fetchProducts();

      // 3. Success! Clear the cart (this will also clear cache)
      clearCart();
      alert("Purchase Successful!");
    } catch (error: any) {
      // Error handling for issues like "Not enough stock" from backend
      alert(error.message || "Something went wrong");
      console.error("[CartContext] ❌ Purchase failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasItems = cartItems.length > 0;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
        loading,
        hasItems,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 3. The Hook (How you use it in other files)
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
