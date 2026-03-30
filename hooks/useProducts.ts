import { getProductsApi, Product, ProductFilters } from '@/services/productService'
import { useCallback, useEffect, useState } from 'react'

export function useProducts(initialFilters: ProductFilters = {}) {
    const [products, setProducts] = useState<Product[]>([])
    const [filters, setFilters] = useState<ProductFilters>(initialFilters)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getProductsApi({ ...filters, page })
                setProducts((prev) => page === 1 ? data.data : [...prev, ...data.data])
                setHasMore(data.hasMore)
            } catch (err) {
                setError(err as Error)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [filters, page])

    const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
        setPage(1) // Always start back at page 1 for new searches
    }, [])

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage((prev) => prev + 1)
        }
    }

    const refresh = () => {
        setPage(1)
        setProducts([])
    }

    return { products, loading, error, hasMore, loadMore, refresh, setFilters: updateFilters }
}