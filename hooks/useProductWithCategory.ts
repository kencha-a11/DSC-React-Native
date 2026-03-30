// hooks/useProductWithCategory.ts
import { useMemo } from "react";
import { useProducts } from "@/context/ProductContext";
import { useCategories } from "@/context/CategoryContext";
import { Product } from "@/services/productService";

export interface ProductWithCategory extends Product {
    category_name: string;
    categories: Array<{ id: number; name: string }>;
}

export const useProductWithCategory = (productId: number) => {
    const { products } = useProducts();
    const { getCategoryNameById } = useCategories();

    const product = useMemo(() =>
        products.find(p => p.id === productId),
        [products, productId]
    );

    const productWithCategory = useMemo((): ProductWithCategory | null => {
        if (!product) return null;

        // ✅ Derive category names LIVE from CategoryContext
        const categoryName = product.category_id
            ? getCategoryNameById(product.category_id)
            : "Uncategorized";

        const categories = product.category_ids?.map(id => ({
            id,
            name: getCategoryNameById(id),
        })) ?? [];

        return {
            ...product,
            category_name: categoryName,
            categories,
        };
    }, [product, getCategoryNameById]);

    return productWithCategory;
};