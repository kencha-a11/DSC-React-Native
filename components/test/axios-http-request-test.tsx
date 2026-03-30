import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { api } from "@/api/axios";

interface TestResponse {
  message: string;
  status?: number;
  data?: any;
}

const AxiosHttpRequestTest = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);

  const testLaravelEndpoint = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    setRequestDetails(null);

    // Log axios configuration
    console.log("========== AXIOS TEST STARTED ==========");
    console.log("Axios default baseURL:", api.defaults.baseURL);
    console.log("Axios default headers:", api.defaults.headers);
    console.log("Axios validateStatus:", api.defaults.validateStatus);
    console.log("Axios timeout:", api.defaults.timeout);

    try {
      // Record request details
      const requestConfig = {
        url: "/test",
        baseURL: api.defaults.baseURL,
        method: "GET",
        headers: api.defaults.headers,
        fullUrl: api.defaults.baseURL + "/test",
        timestamp: new Date().toISOString(),
      };
      setRequestDetails(requestConfig);
      console.log("Request details:", requestConfig);

      console.log("Sending GET request to /test at:", new Date().toISOString());

      // Make the actual request
      const response = await api.get("/test");

      console.log("✅ Response received at:", new Date().toISOString());
      console.log("Response status:", response.status);
      console.log("Response status text:", response.statusText);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);

      setTestResult({
        message: response.data?.message || "No message in response",
        status: response.status,
        data: response.data,
      });
    } catch (err: any) {
      console.error("❌ Error caught:", new Date().toISOString());
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);

      // Axios specific error details
      if (err.response) {
        // The request was made and the server responded with a status code outside 2xx
        console.error("Response error - Server responded with error:", {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers,
        });

        setError(
          `Server error (${err.response.status}): ${err.response.data?.message || err.message}`,
        );
        setTestResult({
          message: err.response.data?.message || "Error response from server",
          status: err.response.status,
          data: err.response.data,
        });
      } else if (err.request) {
        // The request was made but no response received
        console.error("Request error - No response received:", {
          request: err.request,
          _response: err.request._response,
        });

        setError("No response from server. Check network connection.");
      } else {
        // Something happened in setting up the request
        console.error("Setup error:", err.message);
        setError(`Request setup failed: ${err.message}`);
      }

      // Log full error configuration
      if (err.config) {
        console.error("Error config:", {
          url: err.config.url,
          baseURL: err.config.baseURL,
          method: err.config.method,
          headers: err.config.headers,
        });
      }
    } finally {
      setLoading(false);
      console.log("========== AXIOS TEST ENDED ==========");
    }
  };

  const testInvalidPin = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    setRequestDetails(null);

    console.log("========== INVALID PIN TEST STARTED ==========");

    try {
      const payload = {
        pin_code: "000000",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      console.log("Sending invalid PIN request:", {
        url: "/auth/check/pin",
        payload: { ...payload, pin_code: "***" },
      });

      const response = await api.post("/auth/check/pin", payload);

      console.log("Response received - Status:", response.status);
      console.log("Response data:", response.data);

      // Since validateStatus allows 422, we'll check for it here
      if (response.status === 422) {
        const errorMsg =
          response.data?.errors?.pin_code?.[0] ||
          response.data?.message ||
          "Invalid PIN";
        setTestResult({
          message: `422 Validation: ${errorMsg}`,
          status: response.status,
          data: response.data,
        });
      } else {
        setTestResult({
          message: "Unexpected success response",
          status: response.status,
          data: response.data,
        });
      }
    } catch (err: any) {
      console.error("Error caught:", err.message);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      console.log("========== INVALID PIN TEST ENDED ==========");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Axios HTTP Request Test</Text>
        <Text style={styles.subtitle}>Testing Laravel Backend Connection</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={testLaravelEndpoint}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test /test Endpoint</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.invalidButton]}
            onPress={testInvalidPin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Invalid PIN</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Testing connection...</Text>
          </View>
        )}

        {requestDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📤 Request Details:</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>URL: {requestDetails.fullUrl}</Text>
              <Text style={styles.codeText}>
                Method: {requestDetails.method}
              </Text>
              <Text style={styles.codeText}>
                BaseURL: {requestDetails.baseURL}
              </Text>
              <Text style={styles.codeText}>
                Timestamp: {requestDetails.timestamp}
              </Text>
            </View>
          </View>
        )}

        {testResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Response:</Text>
            <View style={[styles.codeBlock, styles.successBlock]}>
              <Text style={styles.codeText}>Status: {testResult.status}</Text>
              <Text style={styles.codeText}>Message: {testResult.message}</Text>
              {testResult.data && (
                <>
                  <Text style={styles.codeText}>Full Response:</Text>
                  <Text style={styles.codeText}>
                    {JSON.stringify(testResult.data, null, 2)}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        {error && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❌ Error:</Text>
            <View style={[styles.codeBlock, styles.errorBlock]}>
              <Text style={[styles.codeText, styles.errorText]}>{error}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Axios Configuration:</Text>
          <Text style={styles.infoText}>
            Base URL: {api.defaults.baseURL || "Not set"}
          </Text>
          <Text style={styles.infoText}>
            Timeout: {api.defaults.timeout || "Default"}ms
          </Text>
          <Text style={styles.infoText}>
            Validate Status:{" "}
            {api.defaults.validateStatus?.toString() || "Default"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  testButton: {
    backgroundColor: "#0066cc",
  },
  invalidButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  codeBlock: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  successBlock: {
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  errorBlock: {
    borderLeftWidth: 4,
    borderLeftColor: "#dc3545",
  },
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    color: "#00ff00",
    marginBottom: 4,
  },
  errorText: {
    color: "#ff6b6b",
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 4,
  },
});

export default AxiosHttpRequestTest;
