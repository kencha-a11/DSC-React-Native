import logo from "@/assets/logo/dsc-logo.png";
import { usePasswordLogin } from "@/hooks/usePasswordLogin";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

  const inputRef = useRef<TextInput>(null);

  const handleForgotPassword = () => {
    console.log("Forgot password pressed");
    // Navigate to forgot password screen
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Middle Wrapper - Password Input */}
          <View style={styles.middleWrapper}>
            <Text style={styles.enterPasswordText}>Enter your Password</Text>
            <TextInput
              ref={inputRef}
              style={styles.passwordInput}
              secureTextEntry={true}
              placeholder="Insert"
              placeholderTextColor="#999"
              textAlign="center"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submitOnEnter}
              cursorColor="transparent" // removes cursor on newer RN
              // selectionColor="transparent" // for older versions
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* Bottom Wrapper - Login Button & Back to PIN */}
          <View style={styles.bottomWrapper}>
            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                (loading || !password) && styles.loginButtonDisabled,
              ]}
              onPress={submitPassword}
              disabled={loading || !password}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Back to PIN Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>← Back to PIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: "space-between", // pushes bottom wrapper down when keyboard hidden
  },
  header: {
    alignItems: "center",
  },
  logo: {
    width: 220,
    height: 220,
  },
  middleWrapper: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 30,
    gap: 20,
  },
  enterPasswordText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 12,
    paddingHorizontal: 10,
    fontSize: 18,
    backgroundColor: "#fff",
    color: "#000",
    textAlign: "center",
    fontWeight: "500",
  },
  forgotPasswordButton: {
    alignItems: "center",
    marginTop: 5,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: "#ED277C",
  },
  bottomWrapper: {
    gap: 15,
    marginBottom: 40,
  },
  loginButton: {
    height: 55,
    backgroundColor: "#ED277C",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: {
    backgroundColor: "#E6E6E6",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#ED277C",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 5,
  },
});