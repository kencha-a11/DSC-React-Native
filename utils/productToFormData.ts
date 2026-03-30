// utils/productToFormData.ts

/**
 * Converts a product payload into multipart/form-data for the API.
 *
 * ProductController validation (store):
 *   name                required|string|max:255|unique:products,name
 *   price               required|numeric|min:0
 *   stock_quantity      required|integer|min:0
 *   low_stock_threshold nullable|integer|min:0
 *   category_ids        nullable|array
 *   category_ids.*      exists:categories,id
 *   image               nullable|image|mimes:jpg,jpeg,png,gif|max:2048
 *   barcode             nullable|string|max:50|unique:products,barcode  // NEW
 *
 * ProductController validation (update):
 *   name                required|string|max:255
 *   price               required|numeric|min:0
 *   stock_quantity      required|integer|min:0
 *   low_stock_threshold nullable|integer|min:0
 *   category_ids        nullable|array
 *   category_ids.*      exists:categories,id
 *   image               nullable|image|mimes:jpg,jpeg,png,gif|max:2048
 *   remove_image        nullable|boolean
 *   barcode             nullable|string|max:50|unique:products,barcode,{id}  // NEW
 */

export interface ProductPayload {
    name?: string;
    price?: number | string;
    stock_quantity?: number | string;
    low_stock_threshold?: number | string;
    category_ids?: number[];
    remove_image?: boolean;
    barcode?: string | null; // NEW
    [key: string]: any;
}

export const productToFormData = (product: ProductPayload, imageFile?: any): FormData => {
    const form = new FormData();

    const fields = ['name', 'price', 'stock_quantity', 'low_stock_threshold'] as const;
    fields.forEach(field => {
        if (product[field] !== undefined) {
            form.append(field, String(product[field]).trim());
        }
    });

    product.category_ids?.forEach(id => form.append("category_ids[]", String(id)));

    // NEW: Add barcode if present
    if (product.barcode !== undefined && product.barcode !== null && product.barcode.trim() !== "") {
        form.append("barcode", product.barcode.trim());
    }

    if (product.remove_image !== undefined) {
        form.append("remove_image", product.remove_image ? "1" : "0");
    }

    if (imageFile) {
        const file = imageFile.uri
            ? { uri: imageFile.uri, type: imageFile.type ?? "image/jpeg", name: imageFile.name ?? "image.jpg" }
            : imageFile;
        form.append("image", file);
    }

    return form;
};