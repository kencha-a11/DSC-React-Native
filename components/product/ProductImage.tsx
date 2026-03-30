// components/common/ProductImage.tsx
import React, { useState } from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProductImageProps {
  imageUrl?: string | null;
  productName: string;
  size?: number;
  style?: any;
}

export default function ProductImage({
  imageUrl,
  productName,
  size = 50,
  style,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  // Get initials from product name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // If no image URL or image failed to load, show initials placeholder
  if (!imageUrl || hasError) {
    return (
      <View
        style={[
          styles.placeholderContainer,
          { width: size, height: size },
          style,
        ]}
      >
        <Text style={[styles.placeholderText, { fontSize: size * 0.4 }]}>
          {getInitials(productName)}
        </Text>
      </View>
    );
  }

  // Try to load the actual image
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: size, height: size }]}
        onError={() => setHasError(true)}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    backgroundColor: "#ED277C20",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  placeholderText: {
    color: "#ED277C",
    fontWeight: "bold",
  },
});
