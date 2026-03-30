// contexts/ProductContext.tsx (with enhanced logging)
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getProductsApi, Product, ProductFilters, createProductApi, updateProductApi, deleteProductApi, deleteMultipleProductsApi, restockProductApi, deductProductApi, getProductByBarcodeApi } from "@/services/productService";
import { productToFormData } from "@/utils/productToFormData";
import { useAuth } from "./AuthContext";
import FALLBACK_IMAGE from "@/assets/images/no-image.jpg";

export interface ProductWithDisplay extends Product {
  displayImage: string | number;
}

interface ProductContextType {
  products: ProductWithDisplay[];
  loading: boolean;
  error: string | null;
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Partial<Product>, imageFile?: any) => Promise<Product>;
  editProduct: (id: number, product: Partial<Product>, imageFile?: any) => Promise<Product>;
  removeProduct: (id: number) => Promise<void>;
  removeMultipleProducts: (ids: number[]) => Promise<void>;
  restockProduct: (id: number, quantity: number) => Promise<Product>;
  deductProduct: (id: number, quantity: number, reason?: string) => Promise<Product>;
  getProductByBarcode: (barcode: string) => Promise<Product | null>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const toDisplay = (p: Product): ProductWithDisplay => ({
  ...p,
  displayImage: p.image ?? FALLBACK_IMAGE,
});
const toDisplayList = (products: Product[]) => products.map(toDisplay);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<ProductWithDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, loading: authLoading } = useAuth();


  // Fetch all products
  const fetchProducts = useCallback(async (filters: ProductFilters = {}) => {
    const requestId = Math.random().toString(36).substring(2, 10);
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    try {
      // 🔥 Remove cache-busting timestamp - use proper cache headers or query params instead
      const page = await getProductsApi({
        ...filters,
        page: 1,
        perPage: 10000,
      });
      const duration = Date.now() - startTime;


      const freshList = toDisplayList(page.data);

      // Log specific products
      const product77 = freshList.find(p => p.id === 77);
      if (product77) {
      } else {
      }
      const product61 = freshList.find(p => p.id === 61);
      if (product61) {
      } else {
      }

      setProducts(freshList);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to fetch products");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshProducts = useCallback(() => {
    return fetchProducts({});
  }, [fetchProducts]);

  // Mutations (logs remain unchanged)
  const addProduct = useCallback(async (product: Partial<Product>, imageFile?: any) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    setLoading(true);
    try {
      const created = await createProductApi(productToFormData(product, imageFile));
      await refreshProducts();
      return created;
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to create product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshProducts]);

  const editProduct = useCallback(async (id: number, product: Partial<Product>, imageFile?: any) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    setLoading(true);
    try {
      const updated = await updateProductApi(id, productToFormData(product, imageFile));
      await refreshProducts();
      return updated;
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to update product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshProducts]);

  const removeProduct = useCallback(async (id: number) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    setLoading(true);
    try {
      await deleteProductApi(id);
      await refreshProducts();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to delete product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshProducts]);

  const removeMultipleProducts = useCallback(async (ids: number[]) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    if (!ids.length) return;
    setLoading(true);
    try {
      await deleteMultipleProductsApi(ids);
      await refreshProducts();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to delete products");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshProducts]);

  const restockProduct = useCallback(async (id: number, quantity: number) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    setLoading(true);
    try {
      const { product } = await restockProductApi(id, quantity);
      await refreshProducts();
      return product;
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to restock product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshProducts]);

  const deductProduct = useCallback(async (id: number, quantity: number, reason?: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    setLoading(true);
    try {
      const { product } = await deductProductApi(id, quantity, reason);
      await refreshProducts();
      return product;
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to deduct product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshProducts]);

  const getProductByBarcode = useCallback((barcode: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    return getProductByBarcodeApi(barcode);
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts({});
    }
  }, [isAuthenticated, fetchProducts]);

  // Log when products change
  useEffect(() => {
    if (products.length > 0) {
      const product77 = products.find(p => p.id === 77);
      if (product77) {
      }
      const product61 = products.find(p => p.id === 61);
      if (product61) {
      }
    }
  }, [products]);

  const value = {
    products,
    loading,
    error,
    fetchProducts,
    refreshProducts,
    addProduct,
    editProduct,
    removeProduct,
    removeMultipleProducts,
    restockProduct,
    deductProduct,
    getProductByBarcode,
  };

  if (authLoading) return null;

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within ProductProvider");
  return ctx;
};