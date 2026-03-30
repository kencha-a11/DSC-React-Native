// app/(manager)/account/[id]/edit.tsx
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useCallback, useEffect } from "react";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import Header from "@/components/layout/Header";
import FooterButton, {
  FooterButtonItem,
} from "@/components/layout/FooterButton";
import { useAccount } from "@/hooks/useAccount";
import { accountService } from "@/services/accountService";
import DscToast from "@/components/common/DscToast";

const STATUS_OPTIONS = ["Activated", "Deactivated"];
const ROLE_OPTIONS = ["cashier", "manager", "superadmin"];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Validation helpers
const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? ""
    : "Please enter a valid email address";

const validatePassword = (pwd: string) => {
  if (!pwd) return "";
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pwd)
    ? ""
    : "Password must be at least 6 characters with letters and numbers";
};

const validatePin = (pin: string) => {
  if (!pin) return "";
  const numeric = pin.replace(/[^0-9]/g, "");
  return numeric.length === 6 ? "" : "PIN must be exactly 6 digits";
};

export default function EditAccountScreen() {
  const params = useLocalSearchParams<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    status: string;
    role: string;
  }>();

  // Ensure ID is valid
  const accountId = params.id ? parseInt(params.id) : 0;

  if (!accountId || accountId === 0) {
    Alert.alert("Error", "Invalid account ID");
    router.back();
    return null;
  }

  const { updateAccount, loading: saving, error } = useAccount();
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    pinCode: "",
    status: "Activated",
    role: "cashier",
  });

  const [initialForm, setInitialForm] = useState(form);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    pin: "",
  });

  // Load data
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (params.firstName) {
          const loadedForm = {
            firstName: params.firstName,
            lastName: params.lastName || "",
            email: params.email || "",
            phoneNumber: params.phoneNumber || "",
            password: "",
            pinCode: "",
            status: params.status || "Activated",
            role: params.role || "cashier",
          };
          setForm(loadedForm);
          setInitialForm(loadedForm);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const data = await accountService.getAccount(accountId);
          if (!data) {
            Alert.alert("Error", "Account not found");
            router.back();
            return;
          }

          const loadedForm = {
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phoneNumber: data.phone_number,
            password: "",
            pinCode: "",
            status: capitalize(data.account_status),
            role: data.role,
          };
          setForm(loadedForm);
          setInitialForm(loadedForm);
        } catch (err) {
          console.error("Failed to load account:", err);
          Alert.alert("Error", "Failed to load account");
          router.back();
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [accountId, params.firstName]),
  );

  // Reset form to initial values
  const resetForm = () => {
    setForm(initialForm);
    setErrors({ email: "", password: "", pin: "" });
  };

  const updateField = (field: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Real-time validation
    if (field === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    } else if (field === "password") {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    } else if (field === "pinCode") {
      const numeric = value.replace(/[^0-9]/g, "");
      setForm((prev) => ({ ...prev, pinCode: numeric }));
      setErrors((prev) => ({ ...prev, pin: validatePin(numeric) }));
    }
  };

  // Check if form has changes
  const hasChanges =
    form.firstName !== initialForm.firstName ||
    form.lastName !== initialForm.lastName ||
    form.email !== initialForm.email ||
    form.phoneNumber !== initialForm.phoneNumber ||
    form.password !== initialForm.password ||
    form.pinCode !== initialForm.pinCode ||
    form.status !== initialForm.status ||
    form.role !== initialForm.role;

  const isValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.phoneNumber.trim() &&
    form.status &&
    form.role &&
    !errors.email &&
    (form.password.length === 0 || !errors.password) &&
    (form.pinCode.length === 0 || !errors.pin);

  const handleSave = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await updateAccount(accountId, form);
      if (success) {
        setToastVisible(true);
        // Navigate to profile after successful save
        setTimeout(() => {
          setToastVisible(false);
          router.replace({
            pathname: "/(manager)/account/[id]",
            params: {
              id: accountId.toString(),
              name: `${form.firstName} ${form.lastName}`,
              first_name: form.firstName,
              last_name: form.lastName,
              email: form.email,
              phone: form.phoneNumber,
              role: form.role,
              status: form.status,
            },
          });
        }, 1500); // Show toast for 1.5 seconds then navigate
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        "Discard Changes",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Stay", style: "cancel" },
          { text: "Discard", onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#ED277C" size="large" />
      </View>
    );
  }

  // Input fields configuration
  const textFields = [
    { label: "First name", field: "firstName", placeholder: "First name" },
    { label: "Last name", field: "lastName", placeholder: "Last name" },
    {
      label: "Email",
      field: "email",
      placeholder: "user@example.com",
      keyboardType: "email-address",
      autoCapitalize: "none",
      error: errors.email,
    },
    {
      label: "Phone number",
      field: "phoneNumber",
      placeholder: "Enter phone number",
      keyboardType: "phone-pad",
      maxLength: 11,
    },
    {
      label: "New Password (leave blank to keep current)",
      field: "password",
      placeholder: "Enter new password",
      secure: true,
      error: errors.password,
    },
    {
      label: "PIN Code (6 digits)",
      field: "pinCode",
      placeholder: "Enter 6-digit PIN",
      keyboardType: "numeric",
      maxLength: 6,
      error: errors.pin,
      hint: "Used for PIN login. Must be exactly 6 digits.",
    },
  ];

  const dropdowns = [
    {
      label: "Status",
      value: form.status,
      open: openDropdown === "status",
      options: STATUS_OPTIONS,
      onSelect: (v: string) => {
        updateField("status")(v);
        setOpenDropdown(null);
      },
      display: (v: string) => v,
    },
    {
      label: "Role",
      value: form.role,
      open: openDropdown === "role",
      options: ROLE_OPTIONS,
      onSelect: (v: string) => {
        updateField("role")(v);
        setOpenDropdown(null);
      },
      display: capitalize,
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Edit Account" onBackPress={handleCancel} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={() => setOpenDropdown(null)}
        scrollEventThrottle={16}
      >
        <View style={styles.idBadge}>
          <Text style={styles.idLabel}>Account ID</Text>
          <Text style={styles.idValue}>#{accountId}</Text>
        </View>

        {/* Unsaved changes indicator */}
        {hasChanges && (
          <View style={styles.unsavedBadge}>
            <Text style={styles.unsavedText}>You have unsaved changes</Text>
          </View>
        )}

        {/* Text Inputs */}
        {textFields.map(
          ({
            label,
            field,
            placeholder,
            keyboardType,
            autoCapitalize,
            maxLength,
            secure,
            error,
            hint,
          }) => (
            <View key={field} style={styles.inputWrapper}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={form[field as keyof typeof form]}
                onChangeText={updateField(field)}
                keyboardType={keyboardType as any}
                autoCapitalize={autoCapitalize as any}
                secureTextEntry={secure}
                maxLength={maxLength}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
            </View>
          ),
        )}

        {/* API Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Dropdowns */}
        {dropdowns.map(({ label, value, open, options, onSelect, display }) => (
          <View
            key={label}
            style={[
              styles.dropdownWrapper,
              open && styles.dropdownWrapperActive,
            ]}
          >
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setOpenDropdown(open ? null : label.toLowerCase())}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownText,
                  value && styles.dropdownTextSelected,
                ]}
              >
                {value ? display(value) : `Select ${label.toLowerCase()}`}
              </Text>
              <Ionicons
                name={open ? "chevron-up" : "chevron-down"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
            {open && (
              <View style={styles.dropdownOptionsContainer}>
                {options.map((opt, i) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownOption,
                      i === options.length - 1 && styles.dropdownOptionLast,
                    ]}
                    onPress={() => onSelect(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownOptionText}>
                      {display(opt)}
                    </Text>
                    {value === opt && (
                      <Ionicons name="checkmark" size={20} color="#ED277C" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <FooterButton>
        <FooterButtonItem
          title="Cancel"
          type="secondary"
          onPress={handleCancel}
        />
        <FooterButtonItem
          title="Save Changes"
          type="primary"
          onPress={handleSave}
          disabled={!isValid || !hasChanges || saving || isSubmitting}
        />
      </FooterButton>

      {/* Toast - placed outside ScrollView but inside container */}
      <DscToast
        visible={toastVisible}
        message="Account updated successfully!"
        type="success"
        onClose={() => {
          setToastVisible(false);
          router.replace({
            pathname: "/(manager)/account/[id]",
            params: {
              id: accountId.toString(),
              name: `${form.firstName} ${form.lastName}`,
              first_name: form.firstName,
              last_name: form.lastName,
              email: form.email,
              phone: form.phoneNumber,
              role: form.role,
              status: form.status,
            },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  idBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 10,
  },
  idLabel: { fontSize: 14, color: "#666" },
  idValue: { fontSize: 16, fontWeight: "600", color: "#ED277C" },
  unsavedBadge: {
    backgroundColor: "#FFF4E0",
    padding: 8,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
  },
  unsavedText: {
    fontSize: 12,
    color: "#FF9500",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 16, color: "#666", marginBottom: 8, fontWeight: "500" },
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
  hintText: { fontSize: 12, color: "#999", marginTop: 5, fontStyle: "italic" },

  dropdownWrapper: { marginBottom: 20, zIndex: 1 },
  dropdownWrapperActive: { zIndex: 999, elevation: 5 },
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
  dropdownText: { fontSize: 16, color: "#999" },
  dropdownTextSelected: { color: "#333" },
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
  dropdownOptionLast: { borderBottomWidth: 0 },
  dropdownOptionText: { fontSize: 16, color: "#333" },
});
