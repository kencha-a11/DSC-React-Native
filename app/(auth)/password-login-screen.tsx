// src/screens/PasswordLoginScreen.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import { usePasswordLogin } from "@/hooks/usePasswordLogin";
import logo from "@/assets/logo/dsc-logo.png";

export default function PasswordLoginScreen() {
  const {
    password,
    setPassword,
    submitPassword,
    submitOnEnter,
    goBack,
    loading,
    error,
  } = usePasswordLogin();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image
            source={logo}
            resizeMode="contain"
            className="w-auto"
            style={{ aspectRatio: 1 }}
          />
        </View>

        {/* FORM */}
        <View style={styles.formContainer}>
          {/* INPUT */}
          <View style={styles.inputContainer}>
            <Text className="text-lg mx-2 mb-2 text-left">
              Enter your password
            </Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter Password"
              placeholderTextColor="#999"
              secureTextEntry
              className="w-full h-12 border border-gray-300 rounded-lg px-4 text-lg bg-white mb-4"
              editable={!loading}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submitOnEnter}
            />

            <Text className="text-lg text-pink-500 text-center mb-2">
              Forgot Password?
            </Text>

            {error && (
              <Text className="text-red-500 text-base text-center mt-2">
                {error}
              </Text>
            )}
          </View>

          {/* SUBMIT */}
          <View style={styles.submitContainer}>
            {/* Login Button */}
            <TouchableOpacity
              className={`py-3 rounded-lg items-center ${
                loading || !password ? "bg-gray-400" : "bg-pink-400"
              }`}
              onPress={submitPassword}
              disabled={loading || !password}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-xl font-bold">Login</Text>
              )}
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              className="py-3 items-center mt-4"
              onPress={goBack}
              disabled={loading}
            >
              <Text className="text-pink-400 text-lg">← Back to PIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  logoContainer: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  formContainer: {
    flex: 4,
    justifyContent: "space-between",
    marginBottom: 40,
    marginHorizontal: 16,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flex: 1.5,
  },
  submitContainer: {
    flex: 1,
  }
});

