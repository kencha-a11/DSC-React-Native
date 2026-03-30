// components/inventory/components/FilterChip.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect, useRef } from "react";

const FilterChip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => {
  console.log("[FilterChip] render", {
    label,
    selected,
  });

  const prevProps = useRef({ label, selected });

  useEffect(() => {
    const changes: Record<string, { from: any; to: any }> = {};

    if (prevProps.current.label !== label) {
      changes.label = { from: prevProps.current.label, to: label };
    }

    if (prevProps.current.selected !== selected) {
      changes.selected = {
        from: prevProps.current.selected,
        to: selected,
      };
    }

    if (Object.keys(changes).length > 0) {
      console.log("[FilterChip] props changed", changes);
    }

    prevProps.current = { label, selected };
  }, [label, selected]);

  useEffect(() => {
    console.log("[FilterChip] mounted", { label });
    return () => {
      console.log("[FilterChip] unmounted", { label });
    };
  }, []);

  const handlePress = () => {
    console.log("[FilterChip] pressed", {
      label,
      selectedBeforePress: selected,
    });

    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.filterChip, selected && styles.filterChipSelected]}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Text
        key={label}
        style={[
          styles.filterChipText,
          selected && styles.filterChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default FilterChip;

const styles = StyleSheet.create({
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 6,
  },
  filterChipSelected: {
    backgroundColor: "#ED277C",
    borderColor: "#ED277C",
  },
  filterChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextSelected: {
    color: "#fff",
  },
});