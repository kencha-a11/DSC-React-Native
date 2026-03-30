// components/common/SearchButton.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface SearchButtonProps extends Omit<
  TextInputProps,
  "style" | "onChangeText"
> {
  // Value handling
  value: string;
  onChangeText: (text: string) => void;

  // Event handlers
  onSearch?: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;

  // Styling
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  placeholder?: string;
  placeholderTextColor?: string;

  // Features
  autoFocus?: boolean;
  debounceMs?: number;
  showClearButton?: boolean;
  showSearchIcon?: boolean;
  disabled?: boolean;

  // Colors
  iconColor?: string;
  clearIconColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  focusBorderColor?: string;
  textColor?: string;
}

export default function Search({
  // Value handling
  value,
  onChangeText,

  // Event handlers
  onSearch,
  onClear,
  onFocus,
  onBlur,

  // Styling
  containerStyle,
  inputStyle,
  placeholder = "Search...",
  placeholderTextColor = "#999",

  // Features
  autoFocus = false,
  debounceMs = 300,
  showClearButton = true,
  showSearchIcon = true,
  disabled = false,

  // Colors
  iconColor = "#666",
  clearIconColor = "#999",
  backgroundColor = "#f5f5f5",
  borderColor = "transparent",
  focusBorderColor = "#ED277C",
  textColor = "#000",

  // Rest of TextInput props
  ...restProps
}: SearchButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<TextInput>(null);
  // Fix: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animatedScale = useRef(new Animated.Value(1)).current;

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Debounced search handler
  const handleDebouncedSearch = (text: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onSearch?.(text);
    }, debounceMs);
  };

  // Handle text change
  const handleChangeText = (text: string) => {
    setLocalValue(text);
    onChangeText(text);

    if (onSearch) {
      handleDebouncedSearch(text);
    }
  };

  // Handle clear button press
  const handleClear = () => {
    setLocalValue("");
    onChangeText("");
    onClear?.();

    // Trigger search with empty string if needed
    if (onSearch) {
      onSearch("");
    }

    // Focus the input after clearing
    inputRef.current?.focus();
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();

    // Animate on focus
    Animated.spring(animatedScale, {
      toValue: 1.02,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();

    // Animate on blur
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  // Handle submit (keyboard search button)
  const handleSubmitEditing = () => {
    if (onSearch) {
      onSearch(localValue);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor: isFocused ? focusBorderColor : borderColor,
          transform: [{ scale: animatedScale }],
          opacity: disabled ? 0.6 : 1,
        },
        containerStyle,
      ]}
    >
      {/* Search Icon */}
      {showSearchIcon && (
        <Ionicons
          name="search"
          size={20}
          color={iconColor}
          style={styles.searchIcon}
        />
      )}

      {/* Text Input */}
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: textColor }, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={localValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmitEditing}
        autoFocus={autoFocus}
        editable={!disabled}
        selectTextOnFocus={!disabled}
        returnKeyType="search"
        clearButtonMode="never"
        {...restProps}
      />

      {/* Clear Button */}
      {showClearButton && localValue.length > 0 && !disabled && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color={clearIconColor} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// Export searchPresets
export const searchPresets = {
  cart: {
    containerStyle: {
      borderRadius: 12,
      height: 50,
    },
    iconColor: "#ED277C",
    focusBorderColor: "#ED277C",
    backgroundColor: "#fff",
    borderColor: "#ddd",
  } as Partial<SearchButtonProps>,

  product: {
    containerStyle: {
      borderRadius: 8,
      height: 45,
    },
    iconColor: "#666",
    focusBorderColor: "#ED277C",
    backgroundColor: "#f8f8f8",
  } as Partial<SearchButtonProps>,

  minimal: {
    showSearchIcon: false,
    containerStyle: {
      borderRadius: 0,
      borderBottomWidth: 1,
      height: 44,
    },
    backgroundColor: "transparent",
    borderColor: "#ddd",
    focusBorderColor: "#ED277C",
  } as Partial<SearchButtonProps>,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
});
