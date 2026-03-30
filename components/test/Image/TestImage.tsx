import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useProducts, ProductWithDisplay } from '@/context/ProductContext';

const DEV_URL = 'http://192.168.1.8:8000/api';
const PROD_URL = 'https://dsc-laravel.onrender.com/api';

const ImageTest: React.FC = () => {
  const { products, loading, error, refreshProducts } = useProducts();
  const [manualUrl, setManualUrl] = useState('');
  const [testImageError, setTestImageError] = useState(false);
  const [testImageLoading, setTestImageLoading] = useState(false);

  // Predefined URL handlers for manual input
  const handleDevUrl = () => setManualUrl(DEV_URL);
  const handleProdUrl = () => setManualUrl(PROD_URL);

  // Copy image URL to clipboard
  const copyImageUrl = async (imageUrl: string | null, productName: string) => {
    if (imageUrl) {
      await Clipboard.setStringAsync(imageUrl);
      Alert.alert('Copied!', `${productName} image URL copied to clipboard:\n${imageUrl}`);
    } else {
      Alert.alert('No Image', `${productName} has no image URL.`);
    }
  };

  // Render each product item
  const renderProductItem = ({ item }: { item: ProductWithDisplay }) => {
    const imageUrl = item.image;
    const imageExists = item.image_exists;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => copyImageUrl(imageUrl, item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              onError={(e) =>
                console.log(`Failed to load image for product ${item.id}:`, e.nativeEvent.error)
              }
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text>ID: {item.id}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Stock: {item.stock_quantity}</Text>
          <Text numberOfLines={2} style={styles.imageUrlText}>
            Image URL: {imageUrl || 'null'}
          </Text>
          <Text>Image exists: {imageExists ? 'Yes' : 'No'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading products...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={refreshProducts} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Product Images Test</Text>

      {/* Manual URL Test Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Custom Image URL</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.envButton} onPress={handleDevUrl}>
            <Text style={styles.envButtonText}>Development URL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.envButton} onPress={handleProdUrl}>
            <Text style={styles.envButtonText}>Production URL</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter image URL"
          value={manualUrl}
          onChangeText={setManualUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button title="Load Image" onPress={() => {
          if (!manualUrl.trim()) {
            Alert.alert('Error', 'Please enter a URL');
            return;
          }
          setTestImageLoading(true);
          setTestImageError(false);
          setTimeout(() => setTestImageLoading(false), 5000);
        }} />
        {manualUrl ? (
          <View style={styles.testImageContainer}>
            <Text style={styles.testImageUrl}>URL: {manualUrl}</Text>
            {testImageLoading && <ActivityIndicator style={styles.testSpinner} />}
            <Image
              source={{ uri: manualUrl }}
              style={styles.testImage}
              onLoadStart={() => setTestImageLoading(true)}
              onLoadEnd={() => setTestImageLoading(false)}
              onError={(e) => {
                setTestImageLoading(false);
                setTestImageError(true);
                console.log('Manual image load error:', e.nativeEvent.error);
              }}
            />
            {testImageError && (
              <Text style={styles.errorText}>Failed to load image from URL</Text>
            )}
          </View>
        ) : null}
      </View>

      {/* Product List */}
      <Text style={styles.sectionTitle}>Product Images ({products.length})</Text>
      <Text style={styles.hint}>Tap any product to copy its image URL</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductItem}
        scrollEnabled={false}
        contentContainerStyle={styles.listContainer}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  envButton: {
    flex: 0.48,
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
  },
  envButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  testImageContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  testImageUrl: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  testSpinner: {
    marginVertical: 10,
  },
  testImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginTop: 5,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    width: 80,
    height: 80,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
    borderRadius: 4,
  },
  noImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  noImageText: {
    color: '#888',
    fontSize: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  imageUrlText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
  },
  retryButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ImageTest;