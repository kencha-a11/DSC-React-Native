import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

export default function ScannerScreen({ height }: { height?: number }) {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [enabled, setEnabled] = useState(true);

  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-zinc-950">
        <Text className="text-3xl mb-4">📷</Text>
        <Text className="text-white font-bold text-lg mb-2 text-center">
          Camera Access
        </Text>
        <Text className="text-zinc-400 text-center mb-6">
          We need permission to scan barcodes and process your items.
        </Text>
        <TouchableOpacity
          className="bg-white px-10 py-4 rounded-2xl active:opacity-80"
          onPress={requestPermission}
        >
          <Text className="text-black font-bold text-center">
            Enable Camera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log("✅ Scanned:", data);
    setEnabled(false);
    setTimeout(() => setEnabled(true), 2000);
  };

  return (
    <View className="relative bg-black" style={{ height: height ?? "100%" }}>
      {isFocused && (
        <CameraView
          className="absolute inset-0"
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13"] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}

      {/* Overlay */}
      <View className="absolute inset-0 flex justify-center items-center bg-black/20">
        {/* Status Text */}
        <View className="absolute top-8 bg-black/50 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
          <Text className="text-white text-xs font-bold tracking-widest uppercase">
            {enabled ? "Scan" : "Processing..."}
          </Text>
        </View>

        {/* Center Circle */}
        <View className="w-16 h-16 rounded-full border-2 border-white/30 items-center justify-center">
          {/* Red/Green Box */}
          <TouchableOpacity
            onPress={() => setEnabled(!enabled)}
            className="w-4 h-4 rounded-sm items-center justify-center"
            style={{ backgroundColor: enabled ? "red" : "green" }}
          />
        </View>
      </View>
    </View>
  );
}
