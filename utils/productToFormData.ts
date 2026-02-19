// src/services/productServices.ts
import { Product } from "@/services/productServices"; // adjust import if Product is defined elsewhere

/**
 * Convert a Product object into FormData for API submission.
 * Useful when uploading images or handling multipart/form-data requests.
 *
 * @param product - Partial product data (only fields you want to send)
 * @param imageFile - Optional image file to upload
 * @returns FormData object ready for API call
 */
export const productToFormData = (
    product: Partial<Product>,
    imageFile?: File
): FormData => {
    const formData = new FormData();

    if (product.name) formData.append("name", product.name);
    if (product.price) formData.append("price", product.price);
    if (product.stock_quantity !== undefined) {
        formData.append("stock_quantity", product.stock_quantity.toString());
    }
    if (product.low_stock_threshold !== undefined) {
        formData.append("low_stock_threshold", product.low_stock_threshold.toString());
    }
    if (product.barcode) formData.append("barcode", product.barcode);

    // Handle categories
    if (product.categories && Array.isArray(product.categories)) {
        product.categories.forEach((cat: { id: number }, index: number) => {
            formData.append(`category_ids[${index}]`, cat.id.toString());
        });
    }

    // Handle image
    if (imageFile) {
        formData.append("image_path", imageFile);
    }

    return formData;
};
