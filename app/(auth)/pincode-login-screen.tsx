import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import DscToast from "@/components/common/DscToast";
import logo from "@/assets/logo/dsc-logo.png";

export default function PinLoginScreen() {
  const router = useRouter();
  const { checkPin, error, loading, clearError } = useAuth();
  const [pinCode, setPinCode] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Show toast when error occurs
  useEffect(() => {
    if (error) {
      setToastMessage(error);
      setToastVisible(true);
      setPinCode("");
      const timer = setTimeout(() => {
        setToastVisible(false);
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleNumberPress = (num: string) => {
    if (pinCode.length < 6) {
      const newPin = pinCode + num;
      setPinCode(newPin);
      if (newPin.length === 6) {
        submitPin(newPin);
      }
    }
  };

  const submitPin = async (pin: string) => {
    try {
      const response = await checkPin(pin);
      if (response.requirePassword) {
        router.replace("/(auth)/password-login-screen");
      } else {
        const role = response.user?.role;
        if (role === "cashier") router.replace("/(cashier)/(tabs)");
        else if (role === "manager") router.replace("/(manager)/(tabs)");
        else if (role === "superadmin") router.replace("/(superadmin)");
        else router.replace("/(cashier)/(tabs)");
      }
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const handleDelete = () => {
    setPinCode(pinCode.slice(0, -1));
  };

  const handleClear = () => {
    setPinCode("");
  };

  const closeToast = () => {
    setToastVisible(false);
    clearError();
  };

  const isClearEraseHidden = pinCode.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.innerContainer}>
        <DscToast
          visible={toastVisible}
          message={toastMessage}
          type="error"
          onClose={closeToast}
          showCloseButton
        />

        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.pinContainer}>
          <Text style={styles.enterPinText}>Enter your PIN</Text>
          <View style={styles.pinDots}>
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  pinCode.length > index && styles.pinDotFilled,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.keypad}>
          {/* Row 1 */}
          <View style={styles.row}>
            {[1, 2, 3].map((num) => (
              <TouchableWithoutFeedback
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                disabled={loading}
              >
                <View style={styles.key}>
                  <Text style={styles.keyText}>{num}</Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            {[4, 5, 6].map((num) => (
              <TouchableWithoutFeedback
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                disabled={loading}
              >
                <View style={styles.key}>
                  <Text style={styles.keyText}>{num}</Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            {[7, 8, 9].map((num) => (
              <TouchableWithoutFeedback
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                disabled={loading}
              >
                <View style={styles.key}>
                  <Text style={styles.keyText}>{num}</Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </View>

          {/* Row 4 */}
          <View style={styles.row}>
            {/* Clear button - instantly invisible when no PIN */}
            <TouchableWithoutFeedback
              onPress={handleClear}
              disabled={loading || isClearEraseHidden}
            >
              <View style={[styles.key, isClearEraseHidden && styles.hidden]}>
                <FontAwesome name="close" size={24} color="black" />
              </View>
            </TouchableWithoutFeedback>

            {/* Zero button */}
            <TouchableWithoutFeedback
              onPress={() => handleNumberPress("0")}
              disabled={loading}
            >
              <View style={styles.key}>
                <Text style={styles.keyText}>0</Text>
              </View>
            </TouchableWithoutFeedback>

            {/* Erase button - instantly invisible when no PIN */}
            <TouchableWithoutFeedback
              onPress={handleDelete}
              disabled={loading || isClearEraseHidden}
            >
              <View style={[styles.key, isClearEraseHidden && styles.hidden]}>
                <Entypo name="erase" size={24} color="black" />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>

        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot your PIN?</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  logo: {
    width: 220,
    height: 220,
  },
  pinContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  enterPinText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  pinDots: {
    flexDirection: "row",
    gap: 15,
  },
  pinDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A3A3A3",
    backgroundColor: "transparent",
  },
  pinDotFilled: {
    backgroundColor: "#ED277C",
    borderColor: "#ED277C",
  },
  keypad: {
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 15,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderColor: "#E6E6E6",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: 24,
    fontWeight: "500",
  },
  hidden: {
    opacity: 0,
  },
  forgotButton: {
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 80,
  },
  forgotText: {
    fontSize: 16,
    color: "#ED277C",
  },
});