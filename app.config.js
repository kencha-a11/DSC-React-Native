// app.config.js - Simplified version for SDK 52
require("dotenv/config");

module.exports = {
  expo: {
    name: "DSC Inventory Mobile",
    slug: "dsc-inventory-mobile",
    version: "1.0.0",

    android: {
      package: "com.aljon.dscinventorymobile",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
      ],
    },

    ios: {
      supportsTablet: true,
    },

    web: {
      output: "single",
      favicon: "",
      bundler: "metro",
    },

    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
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
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
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
      "expo-font",
      "expo-secure-store",
      "expo-barcode-scanner",
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "1.9.25",
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },
  },
};
