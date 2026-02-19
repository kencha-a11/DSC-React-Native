import { View, Text, TouchableOpacity, DimensionValue } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused, useNavigationBuilder } from "@react-navigation/native";
import { isInsideRect, scanZone } from "@/utils/barcodeScanZone";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";

import Svg, { Rect, Defs, Mask } from "react-native-svg";

import ProductTestDataBarcode from "../test/ProductTestDataBarcode";

// defined props type
interface BarcodeLayoutProps {
  onScanned?: (barcode: string) => void; // parent pass callback
}

interface ButtonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: DimensionValue;
}

const BarcodeLayout = ({
  onScanned, // functional component
}: BarcodeLayoutProps) => {
  const [permission, requestPermission] = useCameraPermissions() // permission control
  const [enabled, setEnabled] = useState(true)
  const [scanning, setScanning] = useState(false)
  const isFocused = useIsFocused() // screen visibility camera status

  useEffect(() => {
    // consistent asking permissions
    if (!permission) {
      requestPermission();
    }
  }, [permission]); // as dependency whenever changes happens

  const checkCameraPermission = () => {
    if (!permission) {
      // Still loading permission state
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "gray",
          }}
        >
          <Text>Checking camera permissions...</Text>
        </View>
      );
    }

    // Permission denied
    if (!permission.granted) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            paddingBottom: "40%",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            Camera Access Denied
          </Text>

          <Text
            style={{
              fontSize: 14,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            We need your permission to use the camera for scanning.
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#A0C4FF", // lighter blue shade
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 4,
              opacity: 0.9, // slightly transparent for dim effect
            }}
            onPress={requestPermission} // 2 trials only dont allow system wont ask permission
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              Enable Camera
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Permission granted → show camera
    return (
      isFocused && (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13"] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )
    );
  };

  const handleBarCodeScanned = ({ data, bounds }: any) => {
    if (!enabled) return;
    if (isInsideRect(bounds, scanZone)) {
      console.log("✅ Scanned inside rectangle:", data);
      setEnabled(false);
      setScanning(true)
      if (onScanned) {
        onScanned(data);
      }
      setTimeout(() => {setEnabled(true);setScanning(false)}, 1000);
    } else {
      console.log("Ignored scan outside rectangle");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {checkCameraPermission()}

      {/* Overlay */}
      <View style={{ position: "absolute", inset: 0 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <Mask id="mask">
              {/* Full screen filled (white = visible) */}
              <Rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Punch out scan zone (black = hidden) */}
              <Rect
                x={scanZone.x}
                y={scanZone.y}
                width={scanZone.width}
                height={scanZone.height}
                rx={24} // border radius
                ry={24}
                fill="black"
              />
            </Mask>
          </Defs>

          {/* Dimmed background with punched‑out scan zone */}
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#mask)"
          />

          {/* White border around scan zone */}
          <Rect
            x={scanZone.x}
            y={scanZone.y}
            width={scanZone.width}
            height={scanZone.height}
            rx={24}
            ry={24}
            stroke="white"
            strokeWidth={3}
            fill="transparent"
          />
        </Svg>
      </View>

      <View
        style={{
          position: "absolute",
          top: "10%",
          left: 0,
          right: 0,
          alignItems: "center", // center horizontally
        }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 25,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Scan Bar Code
          </Text>

          {/* state: waiting, scanning */}
          <Text
            style={{
              color: "white",
              fontSize: 14,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {scanning ? "Scanning..." : "Point your camera at a bar code"}
          </Text>
        </View>
      </View>

      <ButtonOperations />
    </View>
  );
};

export default BarcodeLayout;

const CancelScan = ({ width, height, borderRadius }: ButtonProps) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={{
        width: width ?? "46%", // default to 46% if not provided
        height: height ?? undefined, // optional height
        paddingVertical: 12,
        borderRadius: borderRadius ?? 12,
        backgroundColor: "red",
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={() => router.push("/(cashier)")}
    >
      <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
        Cancel Scan
      </Text>
    </TouchableOpacity>
  );
};

const SearchProducts = ({ width, height, borderRadius }: ButtonProps) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={{
        width: width ?? "46%",
        height: height ?? undefined,
        paddingVertical: 12,
        borderRadius: borderRadius ?? 12,
        backgroundColor: "darkviolet",
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={() => router.push("/(cashier)/search-product-screen")}
    >
      <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
        Search Products
      </Text>
    </TouchableOpacity>
  );
};

const ButtonOperations = () => {
  const height = 60;
  const borderRadius = 12;
  return (
    <View
      style={{
        position: "absolute",
        bottom: "10%",
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-evenly",
        paddingHorizontal: 20,
      }}
    >
      <CancelScan width="46%" height={height} borderRadius={borderRadius} />
      <SearchProducts width="46%" height={height} borderRadius={borderRadius} />
    </View>
  );
};
