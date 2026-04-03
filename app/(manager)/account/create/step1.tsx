// app/(manager)/account/create/step1.tsx
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { router } from "expo-router";
import Header from "@/components/layout/Header";
import FooterButton, {
  FooterButtonItem,
} from "@/components/layout/FooterButton";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/context/AuthContext"; // Import auth hook

// Define types
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  pinCode?: string;
  status: string;
  role: string;
}

export default function CreateFirstScreen() {
  const { user } = useAuth(); // Get current user
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [pinCode, setPinCode] = useState("");

  // Dropdown values
  const [status, setStatus] = useState<string>("");
  const [role, setRole] = useState<string>("");

  // Dropdown open states
  const [statusOpen, setStatusOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  // Status options (same for everyone)
  const statusOptions = ["Activated", "Deactivated"];

  // Dynamic role options based on logged‑in user's role
  const getRoleOptions = (): string[] => {
    const userRole = user?.role?.toLowerCase().replace(/\s/g, "");
    if (userRole === "superadmin") {
      return ["cashier", "manager"]; // Superadmin can create cashier and manager
    }
    if (userRole === "manager") {
      return ["cashier"]; // Manager can only create cashier
    }
    // If cashier or other (should not reach here), return empty array
    return [];
  };

  const roleOptions = getRoleOptions();

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pinError, setPinError] = useState("");

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const capitalize = (text: string) =>
    text
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");

  const validateEmail = (text: string) => {
    setEmail(text);
    setEmailError(
      text.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ? "Please enter a valid email address"
        : ""
    );
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    setPasswordError(
      text.length > 0 && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(text)
        ? "Password must be at least 6 characters with letters and numbers"
        : ""
    );
  };

  const validatePin = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setPinCode(numericText);
    if (numericText.length > 0 && numericText.length !== 6) {
      setPinError("PIN must be exactly 6 digits");
    } else {
      setPinError("");
    }
  };

  // Form validation includes that a role must be selected from the allowed list
  const isFormComplete =
    !!(
      firstName.trim() &&
      lastName.trim() &&
      email.trim() &&
      phoneNumber.trim() &&
      password.trim() &&
      status &&
      role
    ) &&
    !emailError &&
    !passwordError &&
    (pinCode.length === 0 || !pinError);

  const handleNext = () => {
    const accountData: FormData = {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      pinCode: pinCode || undefined,
      status: status || "",
      role: role || "",
    };
    router.push({
      pathname: "/(manager)/account/create/step2" as any,
      params: { data: JSON.stringify(accountData) },
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "50%"],
  });

  const toggleStatus = () => {
    setRoleOpen(false);
    setStatusOpen(!statusOpen);
  };

  const toggleRole = () => {
    setStatusOpen(false);
    setRoleOpen(!roleOpen);
  };

  const selectStatus = (option: string) => {
    setStatus(option);
    setStatusOpen(false);
  };

  const selectRole = (option: string) => {
    setRole(option);
    setRoleOpen(false);
  };

  // If the user has no permission to create any account (e.g., cashier), show a message
  if (roleOptions.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="create account" onBackPress={() => router.back()} />
        <View style={styles.noPermissionContainer}>
          <Ionicons name="lock-closed" size={60} color="#ccc" />
          <Text style={styles.noPermissionText}>
            You don't have permission to create new accounts.
          </Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="create account" onBackPress={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={() => {
          setStatusOpen(false);
          setRoleOpen(false);
        }}
        scrollEventThrottle={16}
      >
        {/* Progress */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepText}>STEP 1 OF 2</Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
        </View>

        {/* First name */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            placeholder="Given name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={(text) => setFirstName(capitalize(text))}
          />
        </View>

        {/* Last name */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Last name</Text>
          <TextInput
            style={styles.input}
            placeholder="Surname"
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={(text) => setLastName(capitalize(text))}
          />
        </View>

        {/* Email */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="user@example.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={validateEmail}
          />
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
        </View>

        {/* Phone */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={11}
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Min. 6 chars with letters & numbers"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={validatePassword}
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </View>

        {/* PIN Code */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>PIN Code (optional - 6 digits)</Text>
          <TextInput
            style={[styles.input, pinError ? styles.inputError : null]}
            placeholder="Enter 6-digit PIN"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={pinCode}
            onChangeText={validatePin}
            maxLength={6}
          />
          {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
          <Text style={styles.hintText}>
            Used for PIN login. Leave blank to auto-generate.
          </Text>
        </View>

        {/* Status dropdown */}
        <View
          style={[
            styles.dropdownWrapper,
            statusOpen && styles.dropdownWrapperActive,
          ]}
        >
          <Text style={styles.label}>Status</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={toggleStatus}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dropdownText,
                status ? styles.dropdownTextSelected : null,
              ]}
            >
              {status || "Select status"}
            </Text>
            <Ionicons
              name={statusOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>

          {statusOpen && (
            <View style={styles.dropdownOptionsContainer}>
              {statusOptions.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    index === statusOptions.length - 1 &&
                      styles.dropdownOptionLast,
                  ]}
                  onPress={() => selectStatus(option)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                  {status === option && (
                    <Ionicons name="checkmark" size={20} color="#ED277C" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Role dropdown - only shows allowed roles */}
        <View
          style={[
            styles.dropdownWrapper,
            roleOpen && styles.dropdownWrapperActive,
          ]}
        >
          <Text style={styles.label}>Role</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={toggleRole}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dropdownText,
                role ? styles.dropdownTextSelected : null,
              ]}
            >
              {role
                ? role.charAt(0).toUpperCase() + role.slice(1)
                : "Select role"}
            </Text>
            <Ionicons
              name={roleOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>

          {roleOpen && (
            <View style={styles.dropdownOptionsContainer}>
              {roleOptions.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    index === roleOptions.length - 1 &&
                      styles.dropdownOptionLast,
                  ]}
                  onPress={() => selectRole(option)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownOptionText}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                  {role === option && (
                    <Ionicons name="checkmark" size={20} color="#ED277C" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <FooterButton>
        <FooterButtonItem
          title="Next"
          type="primary"
          onPress={handleNext}
          disabled={!isFormComplete}
          style={{ backgroundColor: isFormComplete ? "#ED277C" : "#ccc" }}
        />
      </FooterButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 150 },
  stepContainer: { marginBottom: 30, alignItems: "center", marginTop: 20 },
  stepText: {
    fontSize: 14,
    color: "#ED277C",
    fontWeight: "600",
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    width: "100%",
    overflow: "hidden",
  },
  progressFill: { height: 4, backgroundColor: "#ED277C", borderRadius: 2 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  inputWrapper: { marginBottom: 20 },
  label: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  inputError: { borderColor: "#FF3B30" },
  errorText: { color: "#FF3B30", fontSize: 14, marginTop: 5 },
  hintText: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    fontStyle: "italic",
  },
  dropdownWrapper: {
    marginBottom: 20,
    zIndex: 1,
  },
  dropdownWrapperActive: {
    zIndex: 999,
    elevation: 5,
  },
  dropdown: {
    height: 55,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#999",
  },
  dropdownTextSelected: {
    color: "#333",
  },
  dropdownOptionsContainer: {
    marginTop: 5,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#333",
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noPermissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  goBackButton: {
    backgroundColor: "#ED277C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});