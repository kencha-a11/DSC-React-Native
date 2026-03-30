// contexts/CategoryContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCategoriesApi, getCategoryByIdApi, getCategoryProductsApi, createCategoryApi, updateCategoryApi, deleteCategoryApi, deleteMultipleCategoriesApi, Category } from "@/services/categoryService";
import { useAuth } from "./AuthContext";

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchCategoryById: (id: number) => Promise<Category | null>;
  fetchCategoryProducts: (id: number, page?: number, perPage?: number) => Promise<any>;
  getCategoryById: (id: number) => Category | undefined;
  getCategoryNameById: (id: number) => string;
  addCategory: (name: string, productIds?: number[]) => Promise<Category>;
  updateCategory: (id: number, name: string, productIds?: number[]) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  deleteMultipleCategories: (ids: number[]) => Promise<{ deleted_count: number }>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, loading: authLoading } = useAuth();


  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await getCategoriesApi();
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to fetch categories");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCategoryById = useCallback((id: number) => {
    return getCategoryByIdApi(id);
  }, []);

  const fetchCategoryProducts = useCallback((id: number, page = 1, perPage = 20) => {
    return getCategoryProductsApi(id, page, perPage);
  }, []);

  const getCategoryById = useCallback((id: number) => {
    const found = categories.find(c => c.id === id);
    return found;
  }, [categories]);

  const getCategoryNameById = useCallback((id: number) => {
    const found = categories.find(c => c.id === id)?.category_name ?? "Unknown";
    return found;
  }, [categories]);

  const addCategory = useCallback(async (name: string, productIds?: number[]) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createCategoryApi(name, productIds);
      await fetchCategories();
      return created;
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to create category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (id: number, name: string, productIds?: number[]) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateCategoryApi(id, name, productIds);
      await fetchCategories();
      return updated;
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to update category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteCategoryApi(id);
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to delete category");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  const deleteMultipleCategories = useCallback(async (ids: number[]) => {
    if (!ids.length) return { deleted_count: 0 };
    setLoading(true);
    setError(null);
    try {
      const result = await deleteMultipleCategoriesApi(ids);
      await fetchCategories();
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to delete categories");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

  // Log when categories change
  useEffect(() => {
  }, [categories]);

  const value = {
    categories,
    loading,
    error,
    fetchCategories,
    fetchCategoryById,
    fetchCategoryProducts,
    getCategoryById,
    getCategoryNameById,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteMultipleCategories,
  };

  if (authLoading) return null;

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
};

export const useCategories = () => {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategories must be used within CategoryProvider");
  return ctx;
};