// app.config.js - Optimized for SDK 54 with smooth APK building
require("dotenv/config");

module.exports = {
  expo: {
    name: "DSC Inventory Mobile",
    slug: "dsc-inventory-mobile",
    version: "1.0.0",
    usesCleartextTraffic: true,

    android: {
      package: "com.aljon.dscinventorymobile",
      usesCleartextTraffic: true,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      // ✅ ADD THIS - Override splash screen background
      splash: {
        // backgroundColor: "#ffffff",
        // image: "./assets/logo/dsc-logo.png",
        resizeMode: "contain",
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.INTERNET", // ✅ Explicitly add internet permission
      ],
    },

    ios: {
      supportsTablet: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "Allow $(PRODUCT_NAME) to access your photos to add product images.",
        NSCameraUsageDescription:
          "Allow $(PRODUCT_NAME) to access your camera to take product photos.",
      },
    },

    web: {
      output: "single",
      favicon: "",
      bundler: "metro",
    },

    orientation: "portrait",
    icon: "./assets/logo/dsc-logo.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    // ✅ CRITICAL: Enable New Architecture (required for Reanimated & Worklets)
    newArchEnabled: true,

    extra: {
      API_URL: process.env.EXPO_PUBLIC_API_URL,
      eas: {
        projectId: "76da8553-9d09-4144-b5d2-2344e7b37468",
      },
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/logo/dsc-logo.png",
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          imageWidth: 200,
          dark: {
            image: "./assets/logo/dsc-logo.png",
            backgroundColor: "#000000",
          },
          enableFullScreenImage_legacy: true, // For older Android versions
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true,
        },
      ],
      // ✅ ADD THIS - Image Picker plugin
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow $(PRODUCT_NAME) to access your photos to add product images.",
          cameraPermission:
            "Allow $(PRODUCT_NAME) to access your camera to take product photos.",
        },
      ],
      "expo-font",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.0.21", // ✅ Correct for SDK 54
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
          },
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
