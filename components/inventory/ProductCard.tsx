// components/inventory/ProductCard.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/styles/inventory.styles";
import {
  STOCK_STATUS_COLORS,
  ACTION_BUTTONS,
} from "@/constants/inventory.constants";

// Action button component based on permissions
const ActionButton = ({
  icon,
  label,
  onPress,
  color = "#ED277C",
  disabled = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <Ionicons name={icon as any} size={20} color={disabled ? "#ccc" : color} />
    <Text
      style={[styles.actionButtonText, { color: disabled ? "#ccc" : color }]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

interface ProductCardProps {
  product: any;
  permissions: {
    restock_items?: boolean;
    edit_items?: boolean;
    deduct_items?: boolean;
    remove_items?: boolean;
  };
  onAction: (action: string, product: any) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (productId: number) => void;
}

export default function ProductCard({
  product,
  permissions,
  onAction,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
}: ProductCardProps) {
  const isLowStock = product.stock_quantity <= product.low_stock_threshold;
  const isOutOfStock = product.stock_quantity === 0;

  const getStockStatus = () => {
    if (isOutOfStock) return STOCK_STATUS_COLORS.out_of_stock;
    if (isLowStock) return STOCK_STATUS_COLORS.low_stock;
    return STOCK_STATUS_COLORS.in_stock;
  };

  const stockStatus = getStockStatus();

  // Get image source - use product image if available, otherwise Picsum placeholder
  const imageSource = product.image
    ? { uri: product.image }
    : { uri: "https://picsum.photos/seed/picsum/200/300" };

  return (
    <View style={styles.productCard}>
      <View style={styles.productRow}>
        {/* Selection Checkbox (when in selection mode) */}
        {isSelectionMode && onToggleSelection && (
          <TouchableOpacity
            style={styles.selectionCheckbox}
            onPress={() => onToggleSelection(product.id)}
          >
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={24}
              color={isSelected ? "#ED277C" : "#ccc"}
            />
          </TouchableOpacity>
        )}

        {/* Product Image */}
        <View style={styles.productImageContainer}>
          <Image source={imageSource} style={styles.productImage} />
        </View>

        {/* Product Content */}
        <View style={styles.productContent}>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productCategory}>
                {product.category_name || "Uncategorized"}
              </Text>
            </View>
            <View
              style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}
            >
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {stockStatus.label}
              </Text>
            </View>
          </View>

          <View style={styles.productDetails}>
            <Text style={styles.productPrice}>₱{product.price}</Text>
            <View style={styles.productMeta}>
              <Text style={styles.productStock}>
                {product.stock_quantity} pcs
              </Text>
              <Text style={styles.productSku}>#{product.barcode || "N/A"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons - Restock, Edit, Deduct, Remove */}
      <View style={styles.actionRow}>
        {permissions.restock_items && (
          <ActionButton
            icon={ACTION_BUTTONS.restock.icon}
            label={ACTION_BUTTONS.restock.label}
            onPress={() => onAction("restock", product)}
          />
        )}
        {permissions.edit_items && (
          <ActionButton
            icon={ACTION_BUTTONS.edit.icon}
            label={ACTION_BUTTONS.edit.label}
            onPress={() => onAction("edit", product)}
          />
        )}
        {permissions.deduct_items && (
          <ActionButton
            icon={ACTION_BUTTONS.deduct.icon}
            label={ACTION_BUTTONS.deduct.label}
            onPress={() => onAction("deduct", product)}
          />
        )}
        {permissions.remove_items && (
          <ActionButton
            icon={ACTION_BUTTONS.remove.icon}
            label={ACTION_BUTTONS.remove.label}
            onPress={() => onAction("remove", product)}
            color={ACTION_BUTTONS.remove.color}
          />
        )}
      </View>
    </View>
  );
}
