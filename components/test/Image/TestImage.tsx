import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TextInput, Button,
  ActivityIndicator, Alert, ScrollView, TouchableOpacity,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import api from '@/api/axios';
// Import a local fallback image (adjust the path as needed)
import FALLBACK_IMAGE from '@/assets/images/no-image.jpg';

// ======================== Types ========================

interface Product {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  status: "stock" | "low stock" | "out of stock";
  image: string | null;
  image_exists: boolean;
  category_id: number | null;
  category_ids: number[];
  created_at?: string;
  updated_at?: string;
}

interface ProductWithDisplay extends Product {
  displayImage: string | number;
}

// ======================== Configuration ========================

const DEV_URL = 'http://192.168.1.9:8000/api';
const PROD_URL = 'https://dsc-laravel.onrender.com/api';
const USE_DEV = true; // Toggle between dev and prod

// ======================== API Service (Using existing axios) ========================

// Transform raw API response to Product object
const transformProduct = (raw: any): Product | null => {
  if (!raw || typeof raw !== 'object') {
    console.error('Invalid raw product data:', raw);
    return null;
  }

  // Try multiple possible field name variations
  const id = raw.id ?? raw.product_id ?? raw.ID;
  if (!id) {
    console.warn('Product missing ID, skipping:', raw);
    return null;
  }

  return {
    id: Number(id),
    name: raw.name ?? raw.product_name ?? raw.title ?? 'Unknown Product',
    barcode: raw.barcode ?? raw.bar_code ?? null,
    price: typeof raw.price === 'string' ? parseFloat(raw.price) : (raw.price ?? 0),
    stock_quantity: raw.stock_quantity ?? raw.quantity ?? raw.stock ?? 0,
    low_stock_threshold: raw.low_stock_threshold ?? raw.threshold ?? 10,
    status: raw.status ?? raw.stock_status ?? 'out of stock',
    image: raw.image_url ?? raw.image ?? raw.url ?? null,
    image_exists: raw.image_exists ?? raw.has_image ?? false,
    category_id: raw.categories?.[0]?.id ?? raw.category_id ?? raw.categoryId ?? null,
    category_ids: raw.categories?.map((c: any) => c.id) ?? raw.category_ids ?? [],
    created_at: raw.created_at ?? raw.createdAt ?? undefined,
    updated_at: raw.updated_at ?? raw.updatedAt ?? undefined,
  };
};

// Fetch products from API using existing axios instance
const getProductsApi = async (filters?: {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
}): Promise<Product[]> => {
  try {
    const params = {
      page: filters?.page ?? 1,
      perPage: filters?.perPage ?? 10000,
      ...(filters?.search && { search: filters.search }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.sort && { sort: filters.sort }),
      _t: Date.now(),
    };

    console.log('📡 Fetching products with params:', params);

    const response = await api.get('/products', { params });

    console.log('📡 API Response status:', response.status);
    console.log('📡 API Response data keys:', Object.keys(response.data || {}));

    // Handle different response structures
    let productsData: any[] = [];
    if (response.data?.data && Array.isArray(response.data.data)) {
      productsData = response.data.data;
      console.log('📦 Found products in response.data.data');
    } else if (Array.isArray(response.data)) {
      productsData = response.data;
      console.log('📦 Response is array');
    } else if (response.data?.products && Array.isArray(response.data.products)) {
      productsData = response.data.products;
      console.log('📦 Found products in response.data.products');
    } else {
      console.error('❌ Unexpected API response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid response format from API');
    }

    console.log(`📦 Raw products count: ${productsData.length}`);

    if (productsData.length > 0) {
      console.log('🔍 Sample raw product (first):', JSON.stringify(productsData[0], null, 2));
      console.log('🔍 Sample raw product keys:', Object.keys(productsData[0]));
    }

    // Transform each product
    const transformed = productsData
      .map(transformProduct)
      .filter((product): product is Product => product !== null);

    console.log(`✅ Transformed products count: ${transformed.length}`);

    if (transformed.length === 0 && productsData.length > 0) {
      console.warn('⚠️ All products failed transformation. Check field mappings!');
    }

    if (transformed.length > 0) {
      console.log('🔍 Sample transformed product:', JSON.stringify(transformed[0], null, 2));
    }

    return transformed;
  } catch (error: any) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    throw error;
  }
};

// ======================== Component ========================

const ImageTest: React.FC = () => {
  const [products, setProducts] = useState<ProductWithDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [testImageLoading, setTestImageLoading] = useState(false);
  const [testImageError, setTestImageError] = useState(false);
  const [imageLoadStatus, setImageLoadStatus] = useState<Map<number, { success: boolean; error?: string }>>(new Map());
  const [apiDebug, setApiDebug] = useState<string>('');

  // Helper: add displayImage to each product (fallback if no image)
  const enrichWithDisplayImage = (products: Product[]): ProductWithDisplay[] => {
    return products.map((p: Product) => ({
      ...p,
      displayImage: p.image ?? FALLBACK_IMAGE,
    }));
  };

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setApiDebug('Fetching products...');

    try {
      const productsData = await getProductsApi({
        page: 1,
        perPage: 10000,
      });

      setApiDebug(`✅ Fetched ${productsData.length} products from API`);

      const enriched = enrichWithDisplayImage(productsData);
      setProducts(enriched);

      console.log(`✅ Loaded ${enriched.length} valid products`);

      if (enriched.length === 0) {
        setApiDebug(prev => prev + '\n⚠️ No valid products found after transformation');
      }
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.message ?? 'Failed to fetch products';
      setError(message);
      setApiDebug(`❌ Error: ${message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debug logging
  useEffect(() => {
    if (products.length > 0) {
      console.log('=== Product Image Debug ===');
      console.log(`Total valid products: ${products.length}`);
      const sample = products[0];
      console.log('Sample product:', {
        id: sample.id,
        name: sample.name,
        image: sample.image,
        displayImageType: typeof sample.displayImage,
      });
    }
  }, [products]);

  const handleDevUrl = () => setManualUrl(DEV_URL);
  const handleProdUrl = () => setManualUrl(PROD_URL);

  const copyImageUrl = async (imageUrl: string | null, productName: string) => {
    if (imageUrl) {
      await Clipboard.setStringAsync(imageUrl);
      Alert.alert('Copied!', `${productName} image URL:\n${imageUrl}`);
    } else {
      Alert.alert('No Image', `${productName} has no image URL.`);
    }
  };

  // Helper to get the appropriate Image source prop
  const getImageSource = (displayImage: string | number): ImageSourcePropType => {
    return typeof displayImage === 'number' ? displayImage : { uri: displayImage };
  };

  const handleImageLoad = (productId: number, source: string | number) => {
    const url = typeof source === 'string' ? source : 'local asset';
    console.log(`✅ Product ${productId} image loaded: ${url}`);
    setImageLoadStatus(prev => new Map(prev).set(productId, { success: true }));
  };

  const handleImageError = (productId: number, source: string | number, error: any) => {
    const errMsg = error.nativeEvent?.error || 'unknown error';
    const url = typeof source === 'string' ? source : 'local asset';
    console.error(`❌ Product ${productId} image failed: ${url} – ${errMsg}`);
    setImageLoadStatus(prev => new Map(prev).set(productId, { success: false, error: errMsg }));
  };

  const renderProductItem = ({ item }: { item: ProductWithDisplay }) => {
    // Safety check - if item is invalid, don't render
    if (!item || item.id == null) {
      console.warn('Attempted to render invalid product item:', item);
      return null;
    }

    const imageSource = getImageSource(item.displayImage);
    const loadStatus = imageLoadStatus.get(item.id);
    const isLocalAsset = typeof item.displayImage === 'number';

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => copyImageUrl(item.image, item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.productImage}
            onLoadStart={() => console.log(`🔄 Loading product ${item.id} image`)}
            onLoad={() => handleImageLoad(item.id, item.displayImage)}
            onError={(e) => handleImageError(item.id, item.displayImage, e)}
          />
          {loadStatus && !loadStatus.success && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorOverlayText}>!</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text>ID: {item.id}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Stock: {item.stock_quantity}</Text>
          <Text numberOfLines={2} style={styles.imageUrlText}>
            Raw URL: {item.image || 'null'}
          </Text>
          <Text>
            Display: {typeof item.displayImage === 'number'
              ? 'local asset (fallback)'
              : item.displayImage.substring(0, 60) + '...'}
          </Text>
          <Text>Image exists flag: {item.image_exists ? 'Yes' : 'No'}</Text>
          {loadStatus && (
            <Text style={loadStatus.success ? styles.successText : styles.errorText}>
              {loadStatus.success ? '✅ Loaded' : `❌ ${loadStatus.error}`}
            </Text>
          )}
          {isLocalAsset && !item.image && (
            <Text style={styles.fallbackHint}>⚠️ Using fallback image</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading products...</Text>
        {apiDebug ? <Text style={styles.debugText}>{apiDebug}</Text> : null}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.debugText}>{apiDebug}</Text>
        <TouchableOpacity onPress={fetchProducts} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Product Images – Self-Contained</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integration Stats</Text>
        <Text>Total products: {products.length}</Text>
        <Text>Has raw image URL: {products.filter(p => p.image).length}</Text>
        <Text>Using fallback (local asset): {products.filter(p => !p.image).length}</Text>
        <Text>Successfully loaded: {Array.from(imageLoadStatus.values()).filter(s => s.success).length}</Text>
        <TouchableOpacity style={styles.debugButton} onPress={fetchProducts}>
          <Text style={styles.debugButtonText}>Refresh from API</Text>
        </TouchableOpacity>
        {apiDebug ? <Text style={styles.debugText}>{apiDebug}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Any Image URL</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.envButton} onPress={handleDevUrl}>
            <Text>Dev API Base</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.envButton} onPress={handleProdUrl}>
            <Text>Prod API Base</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Paste image URL"
          value={manualUrl}
          onChangeText={setManualUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button title="Load Test Image" onPress={() => {
          if (!manualUrl.trim()) return Alert.alert('Error', 'Enter URL');
          setTestImageLoading(true);
          setTestImageError(false);
        }} />
        {manualUrl ? (
          <View style={styles.testImageContainer}>
            <Image
              source={{ uri: manualUrl }}
              style={styles.testImage}
              onLoadStart={() => setTestImageLoading(true)}
              onLoad={() => { setTestImageLoading(false); setTestImageError(false); }}
              onError={() => { setTestImageLoading(false); setTestImageError(true); }}
            />
            {testImageLoading && <ActivityIndicator style={styles.testSpinner} />}
            {testImageError && <Text style={styles.errorText}>Failed to load image from URL</Text>}
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Product List</Text>
      <Text style={styles.hint}>Tap any product → copy its original image URL</Text>
      {products.length === 0 ? (
        <View style={styles.center}>
          <Text>No products found</Text>
          <TouchableOpacity onPress={fetchProducts} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry Fetch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => {
            if (item?.id != null) {
              return item.id.toString();
            }
            console.warn('Using fallback key for item:', item);
            return `fallback-${index}-${Date.now()}`;
          }}
          renderItem={renderProductItem}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#333' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  envButton: { flex: 0.48, paddingVertical: 10, backgroundColor: '#e0e0e0', borderRadius: 5, alignItems: 'center' },
  debugButton: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#2196F3', borderRadius: 5, alignItems: 'center' },
  debugButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  debugText: { fontSize: 10, color: '#666', marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, marginBottom: 10, fontSize: 16 },
  testImageContainer: { marginTop: 15, alignItems: 'center' },
  testSpinner: { marginVertical: 10 },
  testImage: { width: 200, height: 200, resizeMode: 'contain', borderWidth: 1, borderColor: '#ddd', borderRadius: 4, marginTop: 5 },
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  imageContainer: { width: 80, height: 80, marginRight: 10, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  productImage: { width: 80, height: 80, resizeMode: 'cover', borderRadius: 4 },
  noImagePlaceholder: { width: 80, height: 80, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  noImageText: { color: '#888', fontSize: 12 },
  errorOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  errorOverlayText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  imageUrlText: { fontSize: 12, color: '#666', marginTop: 2 },
  hint: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 10 },
  listContainer: { paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', marginTop: 5, fontSize: 11 },
  successText: { color: 'green', marginTop: 5, fontSize: 11 },
  retryButton: { marginTop: 10, padding: 8, backgroundColor: '#007AFF', borderRadius: 5 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  fallbackHint: { color: '#ff9800', fontSize: 10, marginTop: 2 },
});

export default ImageTest;