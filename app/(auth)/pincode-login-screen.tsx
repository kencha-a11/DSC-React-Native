import React, { useRef } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import { usePinLogin } from "@/hooks/usePinLogin";
import logo from "@/assets/logo/dsc-logo.png";

export default function PinLoginScreen() {
  const { pinCode, setPinCode, error, loading } = usePinLogin();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    const newPin = pinCode.split("");
    newPin[index] = value;
    setPinCode(newPin.join("").slice(0, 6));

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      const newPin = pinCode.split("");

      if (pinCode[index]) {
        newPin[index] = "";
        setPinCode(newPin.join(""));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        newPin[index - 1] = "";
        setPinCode(newPin.join(""));
      }
    }
  };

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
          {/* LABEL */}
          <Text className="text-lg mb-2 text-left">
            Enter PIN code
          </Text>

          {/* PIN INPUTS */}
          <View className="flex-row justify-between mb-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  if (el) inputRefs.current[i] = el;
                }}
                value={pinCode[i] || ""}
                onChangeText={(val) => handleChange(val, i)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, i)
                }
                keyboardType="number-pad"
                secureTextEntry
                maxLength={1}
                autoFocus={i === 0}
                editable={!loading}
                className="
              w-14 h-14
              md:w-16 md:h-16
              border border-gray-300
              rounded-xl
              text-center
              text-2xl
              bg-white
            "
              />
            ))}
          </View>

          {/* FORGOT */}
          <Text className="text-lg text-pink-500 text-center">
            Forgot PIN code?
          </Text>

          {/* ERROR */}
          {error && (
            <Text className="text-red-500 text-base text-center">{error}</Text>
          )}
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
    justifyContent: "flex-start",
    marginBottom: 40,
    marginHorizontal: 16,
    paddingHorizontal: 16,
  },
});
