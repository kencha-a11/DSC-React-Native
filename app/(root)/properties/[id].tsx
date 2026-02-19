import { View, Text } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
// Hook to access dynamic route parameters (like IDs or slugs) and search queries from the current URL.

const Property = () => {
  const { id } = useLocalSearchParams();
  // Extracts the 'id' parameter from the current route path or search query.
  return (
    <View>
      <Text>Property {id}</Text>
    </View>
  );
};

export default Property;
