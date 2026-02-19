// [CONTEXT LAYER] Responsibility: Manage React state, caching, pagination, and expose functions to components.
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getProductsApi,
  getSellProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  deleteMultipleProductsApi,
  restockProductApi,
  deductProductApi,
  getProductByBarcodeApi,
  Product,
  ProductFilters,
} from "@/services/productServices";
import { productToFormData } from "@/utils/productToFormData";

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchSellProducts: (filters?: ProductFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  clearCache: () => Promise<void>;
  addProduct: (product: Partial<Product>, imageFile?: File) => Promise<void>;
  editProduct: (
    id: number,
    product: Partial<Product>,
    imageFile?: File,
  ) => Promise<void>;
  removeProduct: (id: number) => Promise<void>;
  removeMultipleProducts: (ids: number[]) => Promise<void>;
  restockProduct: (id: number, quantity: number) => Promise<void>;
  getProductByBarcode: (barcode: string) => Promise<Product | null>;
  deductProduct: (
    id: number,
    quantity: number,
    reason?: string,
  ) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const CACHE_KEY = "products_cache";
const CACHE_TIMESTAMP_KEY = "products_cache_timestamp";
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>({});

  // 💾 Load cached products on mount
  useEffect(() => {
    loadCache();
  }, []);

  // 💾 Auto-save products to cache whenever they change
  useEffect(() => {
    if (products.length > 0) {
      saveCache(products);
    }
  }, [products]);

  const loadCache = async () => {
    try {
      const [cached, timestamp] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY),
      ]);

      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_EXPIRY_MS) {
          setProducts(JSON.parse(cached));
          console.log("[ProductContext] ✅ Loaded from Cache");
          return;
        } else {
          console.log("[ProductContext] ⏰ Cache expired");
          await clearCacheStorage();
        }
      }

      console.log("[ProductContext] 📡 Fetching fresh data");
      fetchProducts();
    } catch (e) {
      console.error("[ProductContext] ❌ Cache load error:", e);
      fetchProducts(); // Fallback to API if cache fails
    }
  };

  const saveCache = async (data: Product[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString()),
      ]);
      console.log("[ProductContext] 💾 Cache saved");
    } catch (e) {
      console.error("[ProductContext] ❌ Cache save error:", e);
    }
  };

  const clearCacheStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEY),
        AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY),
      ]);
      console.log("[ProductContext] 🗑️ Cache storage cleared");
    } catch (e) {
      console.error("[ProductContext] ❌ Cache clear error:", e);
    }
  };

  const clearCache = async () => {
    await clearCacheStorage();
    setProducts([]);
    setCurrentPage(1);
    setTotalPages(1);
    setHasMore(false);
    console.log("[ProductContext] 🗑️ Cache and state cleared");
  };

  const fetchProducts = async (filters: ProductFilters = {}) => {
    setLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      const response = await getProductsApi({
        ...filters,
        page: 1,
        perPage: 50,
      });
      setProducts(response.data);
      setCurrentPage(response.current_page);
      setTotalPages(response.last_page);
      setHasMore(response.hasMore);
      // Cache is saved automatically via useEffect
      console.log("[ProductContext] ✅ Products fetched successfully");
    } catch (err: any) {
      console.error("[ProductContext] ❌ Fetch Error:", err);
      setError(err.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchSellProducts = async (filters: ProductFilters = {}) => {
    setLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      const response = await getSellProductsApi({
        ...filters,
        page: 1,
        perPage: 50,
      });
      setProducts(response.data);
      setCurrentPage(response.current_page);
      setTotalPages(response.last_page);
      setHasMore(response.hasMore);
      console.log("[ProductContext] ✅ Sell products fetched successfully");
    } catch (err: any) {
      console.error("[ProductContext] ❌ Fetch Sell Products Error:", err);
      setError(err.response?.data?.message || "Failed to fetch sell products");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const response = await getProductsApi({
        ...currentFilters,
        page: nextPage,
        perPage: 50,
      });
      setProducts((prev) => [...prev, ...response.data]);
      setCurrentPage(response.current_page);
      setHasMore(response.hasMore);
      console.log("[ProductContext] ✅ More products loaded");
    } catch (err: any) {
      console.error("[ProductContext] ❌ Load More Error:", err);
      setError(err.response?.data?.message || "Failed to load more products");
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    await fetchProducts({ ...currentFilters, search: query });
  };

  // 🟢 CRUD Wrappers
  const addProduct = async (product: Partial<Product>, imageFile?: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = productToFormData(product, imageFile);
      const response = await createProductApi(formData);
      console.log("[ProductContext] ✅ Product created:", response.product);

      // Refresh the product list to get updated data from backend
      await fetchProducts(currentFilters);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Failed to create product";
      setError(errorMsg);
      console.error("[ProductContext] ❌ Create product error:", errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const editProduct = async (
    id: number,
    product: Partial<Product>,
    imageFile?: File,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const formData = productToFormData(product, imageFile);
      const response = await updateProductApi(id, formData);
      console.log("[ProductContext] ✅ Product updated:", response.product);

      // Update local state immediately for better UX
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? response.product : p)),
      );

      // Then refresh from backend to ensure consistency
      await fetchProducts(currentFilters);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Failed to update product";
      setError(errorMsg);
      console.error("[ProductContext] ❌ Update product error:", errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteProductApi(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      console.log("[ProductContext] ✅ Product deleted:", id);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Failed to delete product";
      setError(errorMsg);
      console.error("[ProductContext] ❌ Delete product error:", errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeMultipleProducts = async (ids: number[]) => {
    setLoading(true);
    setError(null);
    try {
      await deleteMultipleProductsApi(ids);
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      console.log("[ProductContext] ✅ Multiple products deleted:", ids.length);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Failed to delete multiple products";
      setError(errorMsg);
      console.error("[ProductContext] ❌ Delete multiple error:", errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const restockProduct = async (id: number, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await restockProductApi(id, quantity);
      // Update local state optimistically
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, stock_quantity: p.stock_quantity + quantity }
            : p,
        ),
      );
      console.log("[ProductContext] ✅ Product restocked:", id, "+", quantity);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Failed to restock product";
      setError(errorMsg);
      console.error("[ProductContext] ❌ Restock error:", errorMsg);
      // Refresh to get correct state from backend
      await fetchProducts(currentFilters);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deductProduct = async (
    id: number,
    quantity: number,
    reason?: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await deductProductApi(id, quantity, reason);
      // Update local state optimistically
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, stock_quantity: p.stock_quantity - quantity }
            : p,
        ),
      );
      console.log("[ProductContext] ✅ Product deducted:", id, "-", quantity);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Failed to deduct product";
      setError(errorMsg);
      console.error("[ProductContext] ❌ Deduct error:", errorMsg);
      // Refresh to get correct state from backend
      await fetchProducts(currentFilters);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getProductByBarcode = async (barcode: string) => {
    setLoading(true);
    setError(null);

    try {
      const product = await getProductByBarcodeApi(barcode);

      if (product) {
        // Add to state if not already present
        setProducts((prev) => {
          const exists = prev.find((p) => p.id === product.id);
          return exists ? prev : [...prev, product];
        });
        console.log("[ProductContext] ✅ Product found by barcode:", barcode);
      } else {
        console.log(
          "[ProductContext] ⚠️ No product found for barcode:",
          barcode,
        );
      }

      return product;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Failed to lookup product by barcode";
      setError(errorMsg);
      console.error("[ProductContext] ❌ Barcode lookup error:", errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        currentPage,
        totalPages,
        hasMore,
        fetchProducts,
        fetchSellProducts,
        loadMore,
        searchProducts,
        clearCache,
        addProduct,
        editProduct,
        removeProduct,
        removeMultipleProducts,
        restockProduct,
        deductProduct,
        getProductByBarcode,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
