import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

// 1. Define types for your Laravel Response
interface LaravelResponse {
  status?: string;
  message?: string;
  data?: {
    method: string;
    uri: string;
    ip: string;
    headers: Record<string, string[]>;
    query: Record<string, string>;
    body: any;
  };
  error?: string;
}

// 2. Define valid HTTP methods
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const HttpRequestTestAny: React.FC = () => {
  const [response, setResponse] = useState<LaravelResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Use your machine's Local IP (e.g., 192.168.x.x) if testing on a real device
//   const API_URL = "http://192.168.1.2:8000/api/mobile/test";
  const API_URL = "https://dsc-laravel.onrender.com/api/mobile/test";

  const testRequest = async (method: HttpMethod) => {
    setLoading(true);
    setResponse(null);

    try {
      const requestOptions: RequestInit = {
        method: method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      };

      // Add dummy body for write operations
      if (["POST", "PUT", "PATCH"].includes(method)) {
        requestOptions.body = JSON.stringify({
          app_name: "MobileTester",
          version: "1.0.0",
          platform: "TypeScript/ReactNative",
        });
      }

      const res = await fetch(API_URL, requestOptions);
      const data: LaravelResponse = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({ error: error.message || "An unknown error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>TSX HTTP Tester</Text>

      <View style={styles.buttonGrid}>
        {(["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]).map(
          (verb) => (
            <TouchableOpacity
              key={verb}
              style={[styles.button, styles[verb]]}
              onPress={() => testRequest(verb)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{verb}</Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.label}>Server Response (JSON):</Text>
        {loading ? (
          <ActivityIndicator color="#98c379" size="small" />
        ) : (
          <Text style={styles.responseText}>
            {response
              ? JSON.stringify(response, null, 2)
              : "No request sent yet."}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f2f5" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
    color: "#1a1a1a",
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    width: "31%",
    alignItems: "center",
    elevation: 2,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 13 },
  GET: { backgroundColor: "#3498db" },
  POST: { backgroundColor: "#2ecc71" },
  PUT: { backgroundColor: "#f1c40f" },
  PATCH: { backgroundColor: "#9b59b6" },
  DELETE: { backgroundColor: "#e74c3c" },
  resultBox: {
    marginTop: 20,
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 12,
    minHeight: 200,
  },
  label: {
    color: "#888",
    marginBottom: 10,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  responseText: { color: "#a6e22e", fontFamily: "monospace", fontSize: 12 },
});

export default HttpRequestTestAny;
