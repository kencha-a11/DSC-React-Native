import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { getApi, refreshApiUrl } from "@/api/axios";
import { Platform } from "react-native";
import * as Clipboard from "expo-clipboard";

interface LogEntry {
  timestamp: number;
  method?: string;
  url?: string;
  status?: number;
  data?: any;
  error?: string;
  config?: any;
  fullError?: string;
}

// URL configurations
const URL_CONFIGS = {
  development: {
    android: "http://192.168.1.2:8000/api",
    ios: "http://192.168.1.2:8000/api",
    physical: "http://192.168.1.2:8000/api",
  },
  production: {
    main: "https://dsc-laravel.onrender.com/api",
  },
};

// Helper function to parse Laravel validation errors
const parseLaravelError = (errorData: any): string => {
  if (!errorData) return "Unknown error";
  if (typeof errorData === "string") return errorData;
  if (errorData.errors) {
    const errors = errorData.errors;
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey && errors[firstErrorKey].length > 0) {
      return `${firstErrorKey}: ${errors[firstErrorKey][0]}`;
    }
  }
  if (errorData.message) return errorData.message;
  if (errorData.debug) return errorData.debug; // Added to catch our debug messages
  return JSON.stringify(errorData);
};

const DebugScreen = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [currentEnv, setCurrentEnv] = useState<"development" | "production">(
    "production",
  );
  const [isReloading, setIsReloading] = useState(false);

  // Custom request states
  const [customEndpoint, setCustomEndpoint] = useState("/auth/check/pin");
  const [customMethod, setCustomMethod] = useState<
    "GET" | "POST" | "PUT" | "DELETE"
  >("POST");
  const [customBody, setCustomBody] = useState(`{
  "pin_code": "012347",
  "timezone": "Asia/Manila"
}`);
  const [jsonValid, setJsonValid] = useState(true);
  const [customRequestLoading, setCustomRequestLoading] = useState(false);

  useEffect(() => {
    initializeDebugger();
  }, []);

  const initializeDebugger = async () => {
    await loadLogs();
    await getApiInfo();
    await loadSavedEnv();
  };

  const loadSavedEnv = async () => {
    try {
      const savedEnv = await AsyncStorage.getItem("api_environment");
      if (savedEnv === "development" || savedEnv === "production") {
        setCurrentEnv(savedEnv);
      }
    } catch (error) {
      console.error("Failed to load env:", error);
    }
  };

  const loadLogs = async () => {
    try {
      const storedLogs = await AsyncStorage.getItem("debug_logs");
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        setLogs(parsedLogs);
        console.log(`📊 Loaded ${parsedLogs.length} logs from storage`);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
      setLogs([]);
    }
  };

  const getApiInfo = async () => {
    try {
      const api = await getApi();
      setApiBaseUrl(api.defaults.baseURL || "Not set");
    } catch (error) {
      setApiBaseUrl("Error loading API info");
    }
  };

  const clearLogs = async () => {
    try {
      await AsyncStorage.removeItem("debug_logs");
      setLogs([]);
      setExpandedLog(null);
      setTestResults([]); // Also clear test results
      Alert.alert("✅ Logs cleared", "All request logs have been cleared.");
    } catch (error) {
      console.error("Failed to clear logs:", error);
      Alert.alert("❌ Error", "Failed to clear logs");
    }
  };

  const copyToClipboard = async (
    text: string,
    message: string = "Copied to clipboard",
  ) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("📋 Copied!", message);
  };

  const copyLog = async (log: LogEntry) => {
    const logText = `
Timestamp: ${new Date(log.timestamp).toLocaleString()}
Method: ${log.method?.toUpperCase()}
URL: ${log.url}
Status: ${log.status || "ERROR"}
${log.error ? `Error: ${log.error}` : ""}
${log.data ? `Data: ${JSON.stringify(log.data, null, 2)}` : ""}
${log.config ? `Config: ${JSON.stringify(log.config, null, 2)}` : ""}
${log.fullError ? `Full Error: ${log.fullError}` : ""}
    `.trim();

    await copyToClipboard(logText, "Log copied to clipboard");
  };

  const copyDiagnosticResult = async (result: any) => {
    const resultText = `
${result.test}
Status: ${result.status}
${result.time ? `Time: ${result.time}` : ""}
${result.data ? `Data: ${JSON.stringify(result.data, null, 2)}` : ""}
${result.error ? `Error: ${result.error}` : ""}
${result.details ? `Details: ${JSON.stringify(result.details, null, 2)}` : ""}
${result.fullError ? `Full Error: ${result.fullError}` : ""}
${result.file ? `File: ${result.file}` : ""}
${result.line ? `Line: ${result.line}` : ""}
    `.trim();

    await copyToClipboard(resultText, "Diagnostic result copied");
  };

  const copyAllLogs = async () => {
    if (logs.length === 0) {
      Alert.alert("No logs", "There are no logs to copy");
      return;
    }

    const allLogsText = logs
      .map(
        (log, index) => `
--- LOG #${index + 1} ---
Timestamp: ${new Date(log.timestamp).toLocaleString()}
Method: ${log.method?.toUpperCase()}
URL: ${log.url}
Status: ${log.status || "ERROR"}
${log.error ? `Error: ${log.error}` : ""}
${log.fullError ? `Full Error: ${log.fullError}` : ""}
${log.data ? `Data: ${JSON.stringify(log.data, null, 2)}` : ""}
    `,
      )
      .join("\n");

    await copyToClipboard(
      allLogsText,
      `${logs.length} logs copied to clipboard`,
    );
  };

  const copyDiagnosticResults = async () => {
    if (testResults.length === 0) {
      Alert.alert("No results", "Run diagnostics first");
      return;
    }

    const allResultsText = testResults
      .map(
        (result, index) => `
--- RESULT #${index + 1}: ${result.test} ---
Status: ${result.status}
${result.time ? `Time: ${result.time}` : ""}
${result.data ? `Data: ${JSON.stringify(result.data, null, 2)}` : ""}
${result.error ? `Error: ${result.error}` : ""}
${result.details ? `Details: ${JSON.stringify(result.details, null, 2)}` : ""}
${result.fullError ? `Full Error: ${result.fullError}` : ""}
${result.file ? `File: ${result.file}` : ""}
${result.line ? `Line: ${result.line}` : ""}
    `,
      )
      .join("\n");

    await copyToClipboard(
      allResultsText,
      `${testResults.length} diagnostic results copied`,
    );
  };

  const getRecommendedUrl = () => {
    if (Platform.OS === "android") {
      return URL_CONFIGS.development.android;
    } else if (Platform.OS === "ios") {
      return URL_CONFIGS.development.ios;
    } else {
      return URL_CONFIGS.development.physical;
    }
  };

  const switchEnvironment = async (env: "development" | "production") => {
    setIsReloading(true);

    try {
      await AsyncStorage.setItem("api_environment", env);

      let newUrl = "";
      if (env === "production") {
        newUrl = URL_CONFIGS.production.main;
      } else {
        newUrl = getRecommendedUrl();
      }

      await AsyncStorage.setItem("custom_api_url", newUrl);

      try {
        await refreshApiUrl();
        setApiBaseUrl(newUrl);
        setCurrentEnv(env);

        Alert.alert(
          "✅ Environment Switched",
          `Now using ${env} mode\nURL: ${newUrl}\n\nSome changes may require app restart.`,
          [
            {
              text: "OK",
              onPress: () => {
                setIsReloading(false);
                runDiagnostics();
              },
            },
          ],
        );
      } catch (error) {
        Alert.alert(
          "⚠️ Manual Restart Required",
          `Switched to ${env} mode\nURL: ${newUrl}\n\nPlease close and restart the app manually for all changes to take effect.`,
          [
            {
              text: "OK",
              onPress: () => {
                setCurrentEnv(env);
                setApiBaseUrl(newUrl);
                setIsReloading(false);
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Failed to switch environment:", error);
      Alert.alert("❌ Error", "Failed to switch environment");
      setIsReloading(false);
    }
  };

  const validateJson = (text: string) => {
    try {
      if (text.trim()) {
        JSON.parse(text);
        setJsonValid(true);
      } else {
        setJsonValid(true);
      }
    } catch (e) {
      setJsonValid(false);
    }
  };

  const handleJsonChange = (text: string) => {
    setCustomBody(text);
    validateJson(text);
  };

  const sendCustomRequest = async () => {
    if (customMethod !== "GET" && customBody.trim()) {
      try {
        JSON.parse(customBody);
      } catch (e) {
        Alert.alert("❌ Invalid JSON", "Please check your JSON format");
        return;
      }
    }

    setCustomRequestLoading(true);

    try {
      const api = await getApi();
      const start = Date.now();

      let response;
      const url = customEndpoint.startsWith("/")
        ? customEndpoint
        : `/${customEndpoint}`;

      const config: any = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      switch (customMethod) {
        case "GET":
          response = await api.get(url, config);
          break;
        case "POST":
          response = await api.post(
            url,
            customBody.trim() ? JSON.parse(customBody) : {},
            config,
          );
          break;
        case "PUT":
          response = await api.put(
            url,
            customBody.trim() ? JSON.parse(customBody) : {},
            config,
          );
          break;
        case "DELETE":
          response = await api.delete(url, {
            ...config,
            data: customBody.trim() ? JSON.parse(customBody) : undefined,
          });
          break;
      }

      const time = Date.now() - start;

      Alert.alert(
        "✅ Request Successful",
        `Status: ${response?.status}\nTime: ${time}ms`,
      );

      const newResult = {
        test: `📤 ${customMethod} ${url}`,
        status: `✅ ${response?.status}`,
        time: `${time}ms`,
        data: response?.data,
      };

      setTestResults((prev) => [newResult, ...prev.slice(0, 9)]);

      const logEntry = {
        timestamp: Date.now(),
        method: customMethod,
        url: url,
        status: response?.status,
        data: response?.data,
      };

      const existingLogs = await AsyncStorage.getItem("debug_logs");
      const parsed = existingLogs ? JSON.parse(existingLogs) : [];
      parsed.unshift(logEntry);
      if (parsed.length > 20) parsed.pop();
      await AsyncStorage.setItem("debug_logs", JSON.stringify(parsed));
      await loadLogs();
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      const parsedError = parseLaravelError(errorData);

      Alert.alert(
        "❌ Request Failed",
        `${status ? `Status: ${status}\n` : ""}Error: ${parsedError}`,
      );

      const newResult = {
        test: `📤 ${customMethod} ${customEndpoint}`,
        status: status ? `❌ ${status}` : "❌ Failed",
        error: parsedError,
        details: errorData,
        fullError: error.message,
        file: errorData?.file,
        line: errorData?.line,
      };

      setTestResults((prev) => [newResult, ...prev.slice(0, 9)]);

      const logEntry = {
        timestamp: Date.now(),
        method: customMethod,
        url: customEndpoint,
        status: status,
        error: parsedError,
        data: errorData,
        fullError: error.message,
      };

      const existingLogs = await AsyncStorage.getItem("debug_logs");
      const parsed = existingLogs ? JSON.parse(existingLogs) : [];
      parsed.unshift(logEntry);
      if (parsed.length > 20) parsed.pop();
      await AsyncStorage.setItem("debug_logs", JSON.stringify(parsed));
      await loadLogs();
    } finally {
      setCustomRequestLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setTestResults([]);
    const results = [];

    const api = await getApi();

    try {
      results.push({
        test: "🔧 API Base URL",
        status: api.defaults.baseURL ? "✅ Configured" : "❌ Not set",
        data: api.defaults.baseURL || "MISSING",
      });

      results.push({
        test: "🌍 Current Environment",
        status:
          currentEnv === "production" ? "🚀 Production" : "🛠️ Development",
        data: {
          environment: currentEnv,
          platform: Platform.OS,
          recommendedUrl: getRecommendedUrl(),
          currentUrl: api.defaults.baseURL,
        },
      });

      try {
        const start = Date.now();
        const response = await api.get("/test");
        results.push({
          test: "📡 /test Endpoint",
          status: `✅ ${response.status}`,
          time: `${Date.now() - start}ms`,
          data: response.data,
        });
      } catch (error: any) {
        results.push({
          test: "📡 /test Endpoint",
          status: `❌ Failed`,
          error: error.message,
          details:
            error.response?.data || error.request?._response || error.message,
        });
      }

      try {
        const start = Date.now();
        const response = await api.post("/auth/check/pin", {
          pin_code: "012347",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        results.push({
          test: "🔐 Valid PIN Test (User 3)",
          status: `✅ ${response.status}`,
          time: `${Date.now() - start}ms`,
          data: response.data,
        });
      } catch (error: any) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        const parsedError = parseLaravelError(errorData);

        results.push({
          test: "🔐 Valid PIN Test (User 3)",
          status: status ? `❌ ${status}` : "❌ Network Error",
          error: parsedError,
          details: errorData,
          fullError: error.message,
          file: errorData?.file,
          line: errorData?.line,
        });
      }

      try {
        const start = Date.now();
        const response = await api.post("/auth/check/pin", {
          pin_code: "000000",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        results.push({
          test: "🔐 Invalid PIN Test",
          status: `⚠️ ${response.status} (should be 422)`,
          time: `${Date.now() - start}ms`,
          data: response.data,
        });
      } catch (error: any) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        const parsedError = parseLaravelError(errorData);

        results.push({
          test: "🔐 Invalid PIN Test",
          status:
            status === 422
              ? "✅ 422 Validation (Correct)"
              : `❌ ${status || "Network Error"}`,
          error: parsedError,
          details: errorData,
          expected: status === 422 ? "Correct behavior" : "Should return 422",
        });
      }

      const token = await SecureStore.getItemAsync("auth_token");
      results.push({
        test: "🔑 Auth Token",
        status: token ? "✅ Present" : "⭕ Not logged in",
        data: token ? `${token.substring(0, 15)}...` : null,
      });

      results.push({
        test: "📱 Platform",
        status: "✅ Info",
        data: {
          os: Platform.OS,
          version: Platform.Version,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          recommendedDevUrl: getRecommendedUrl(),
        },
      });

      setTestResults(results);

      const logEntry = {
        timestamp: Date.now(),
        method: "DIAGNOSTIC",
        url: "manual-test",
        status: 200,
        data: results,
      };

      const existingLogs = await AsyncStorage.getItem("debug_logs");
      const parsed = existingLogs ? JSON.parse(existingLogs) : [];
      parsed.unshift(logEntry);
      if (parsed.length > 20) parsed.pop();
      await AsyncStorage.setItem("debug_logs", JSON.stringify(parsed));
      await loadLogs();
    } catch (error) {
      console.error("Diagnostics failed:", error);
      results.push({
        test: "❌ Diagnostics Error",
        status: "Failed",
        error: String(error),
      });
      setTestResults(results);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isReloading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Switching environment...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Debug Console</Text>
        <Text style={styles.subtitle}>
          API Diagnostics & Environment Switcher
        </Text>
        <View style={styles.envBadge}>
          <Text style={styles.envText}>
            {currentEnv === "production" ? "🚀 PRODUCTION" : "🛠️ DEVELOPMENT"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Environment Switcher</Text>
        <View style={styles.envButtonContainer}>
          <TouchableOpacity
            style={[
              styles.envButton,
              styles.devButton,
              currentEnv === "development" && styles.activeEnvButton,
            ]}
            onPress={() => switchEnvironment("development")}
            disabled={loading}
          >
            <Text
              style={[
                styles.envButtonText,
                currentEnv === "development" && styles.activeEnvButtonText,
              ]}
            >
              🛠️ Development
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.envButton,
              styles.prodButton,
              currentEnv === "production" && styles.activeEnvButton,
            ]}
            onPress={() => switchEnvironment("production")}
            disabled={loading}
          >
            <Text
              style={[
                styles.envButtonText,
                currentEnv === "production" && styles.activeEnvButtonText,
              ]}
            >
              🚀 Production
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Current URL: {apiBaseUrl}</Text>
          <Text style={styles.infoText}>
            Platform: {Platform.OS} {Platform.Version}
          </Text>
          {currentEnv === "development" && (
            <Text style={styles.infoText}>
              Recommended: {getRecommendedUrl()}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Custom HTTP Request</Text>

        <View style={styles.methodContainer}>
          {["GET", "POST", "PUT", "DELETE"].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.methodButton,
                customMethod === method && styles.activeMethodButton,
                {
                  backgroundColor:
                    customMethod === method ? "#1a237e" : "#f0f0f0",
                },
              ]}
              onPress={() => setCustomMethod(method as any)}
            >
              <Text
                style={[
                  styles.methodButtonText,
                  customMethod === method && styles.activeMethodButtonText,
                ]}
              >
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Endpoint:</Text>
        <TextInput
          style={styles.input}
          value={customEndpoint}
          onChangeText={setCustomEndpoint}
          placeholder="/auth/check/pin"
          placeholderTextColor="#999"
        />

        {customMethod !== "GET" && (
          <>
            <View style={styles.jsonHeader}>
              <Text style={styles.inputLabel}>Request Body (JSON):</Text>
              {!jsonValid && (
                <Text style={styles.jsonInvalid}>❌ Invalid JSON</Text>
              )}
              {jsonValid && customBody.trim() && (
                <Text style={styles.jsonValid}>✅ Valid JSON</Text>
              )}
            </View>
            <TextInput
              style={[styles.jsonInput, !jsonValid && styles.jsonInputError]}
              value={customBody}
              onChangeText={handleJsonChange}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder='{"key": "value"}'
              placeholderTextColor="#666"
            />
          </>
        )}

        <TouchableOpacity
          style={[
            styles.sendButton,
            (customRequestLoading || (!jsonValid && customMethod !== "GET")) &&
              styles.sendButtonDisabled,
          ]}
          onPress={sendCustomRequest}
          disabled={
            customRequestLoading || (!jsonValid && customMethod !== "GET")
          }
        >
          {customRequestLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>📤 Send Request</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.diagnosticButton]}
          onPress={runDiagnostics}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🚀 Run Full Diagnostics</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.copyButton]}
          onPress={copyDiagnosticResults}
          disabled={loading || testResults.length === 0}
        >
          <Text style={styles.buttonText}>📋 Copy Results</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🗑️ Clear Logs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.copyAllButton]}
          onPress={copyAllLogs}
          disabled={loading || logs.length === 0}
        >
          <Text style={styles.buttonText}>📋 Copy All Logs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={initializeDebugger}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Diagnostic Results</Text>
          {testResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resultCard}
              onLongPress={() => copyDiagnosticResult(result)}
              delayLongPress={500}
            >
              <Text style={styles.resultTitle}>{result.test}</Text>
              <Text
                style={[
                  styles.resultStatus,
                  {
                    color: result.status.includes("✅")
                      ? "#00C851"
                      : result.status.includes("❌")
                        ? "#ff4444"
                        : "#ffbb33",
                  },
                ]}
              >
                {result.status}
              </Text>
              {result.time && (
                <Text style={styles.resultDetail}>⏱️ {result.time}</Text>
              )}
              {result.data && (
                <Text style={styles.resultData}>
                  {typeof result.data === "object"
                    ? JSON.stringify(result.data, null, 2)
                    : String(result.data)}
                </Text>
              )}
              {result.error && (
                <Text style={styles.resultError}>❌ {result.error}</Text>
              )}
              {result.details && (
                <Text style={styles.resultDetail}>
                  Details: {JSON.stringify(result.details, null, 2)}
                </Text>
              )}
              {result.fullError && (
                <Text style={styles.resultDetail}>
                  Full Error: {result.fullError}
                </Text>
              )}
              {result.file && (
                <Text style={styles.resultDetail}>File: {result.file}</Text>
              )}
              {result.line && (
                <Text style={styles.resultDetail}>Line: {result.line}</Text>
              )}
              <Text style={styles.copyHint}>Long press to copy</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          📜 Request History (Last {logs.length})
        </Text>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>
            No logs yet. Run diagnostics to generate logs.
          </Text>
        ) : (
          logs.map((log, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.logItem}
                onPress={() =>
                  setExpandedLog(expandedLog === index ? null : index)
                }
                onLongPress={() => copyLog(log)}
                delayLongPress={500}
              >
                <View style={styles.logHeader}>
                  <Text
                    style={[
                      styles.logStatus,
                      {
                        color:
                          log.status && log.status < 400
                            ? "#00C851"
                            : "#ff4444",
                      },
                    ]}
                  >
                    {log.method?.toUpperCase()} {log.url}
                  </Text>
                  <Text style={styles.logTime}>
                    {formatTime(log.timestamp)}
                  </Text>
                </View>
                <Text style={styles.logStatusText}>
                  Status: {log.status || "ERROR"}{" "}
                  {log.error ? `- ${log.error}` : ""}
                </Text>
                <Text style={styles.copyHint}>
                  Tap to expand • Long press to copy
                </Text>
              </TouchableOpacity>

              {expandedLog === index && (
                <View style={styles.expandedLog}>
                  <View style={styles.expandedHeader}>
                    <Text style={styles.expandedTitle}>Details</Text>
                    <TouchableOpacity
                      onPress={() => copyLog(log)}
                      style={styles.copySmallButton}
                    >
                      <Text style={styles.copySmallText}>📋 Copy</Text>
                    </TouchableOpacity>
                  </View>
                  {log.data && (
                    <View>
                      <Text style={styles.expandedLabel}>Response Data:</Text>
                      <Text style={styles.logData}>
                        {JSON.stringify(log.data, null, 2)}
                      </Text>
                    </View>
                  )}
                  {log.config && (
                    <View>
                      <Text style={styles.expandedLabel}>Config:</Text>
                      <Text style={styles.logData}>
                        {JSON.stringify(log.config, null, 2)}
                      </Text>
                    </View>
                  )}
                  {log.error && (
                    <View>
                      <Text style={styles.expandedLabel}>Error:</Text>
                      <Text style={styles.logDataError}>{log.error}</Text>
                    </View>
                  )}
                  {log.fullError && (
                    <View>
                      <Text style={styles.expandedLabel}>Full Error:</Text>
                      <Text style={styles.logDataError}>{log.fullError}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Debug v1.0 • {new Date().toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#1a237e",
    position: "relative",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  envBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  envText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  section: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  envButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    gap: 8,
  },
  envButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  devButton: {
    backgroundColor: "#e8f5e8",
    borderColor: "#2e7d32",
  },
  prodButton: {
    backgroundColor: "#ffebee",
    borderColor: "#c62828",
  },
  activeEnvButton: {
    backgroundColor: "#1a237e",
    borderColor: "#1a237e",
  },
  envButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  activeEnvButtonText: {
    color: "#fff",
  },
  infoBox: {
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#0d47a1",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  diagnosticButton: {
    backgroundColor: "#1a237e",
  },
  copyButton: {
    backgroundColor: "#00695c",
  },
  copyAllButton: {
    backgroundColor: "#0d47a1",
  },
  clearButton: {
    backgroundColor: "#b71c1c",
  },
  refreshButton: {
    backgroundColor: "#004d40",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1a237e",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  resultDetail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  resultData: {
    fontSize: 12,
    color: "#0d47a1",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  resultError: {
    fontSize: 12,
    color: "#ff4444",
    marginTop: 4,
  },
  copyHint: {
    fontSize: 10,
    color: "#999",
    marginTop: 6,
    fontStyle: "italic",
    textAlign: "right",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    padding: 20,
  },
  logItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  logStatus: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  logTime: {
    fontSize: 11,
    color: "#999",
  },
  logStatusText: {
    fontSize: 12,
    color: "#666",
  },
  expandedLog: {
    marginTop: 4,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
  },
  expandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  expandedTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  copySmallButton: {
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copySmallText: {
    color: "#00ff00",
    fontSize: 10,
  },
  expandedLabel: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 4,
    marginBottom: 2,
  },
  logData: {
    color: "#00ff00",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  logDataError: {
    color: "#ff6b6b",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  methodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  activeMethodButton: {
    borderColor: "#1a237e",
  },
  methodButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  activeMethodButtonText: {
    color: "#fff",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fafafa",
    marginBottom: 16,
    color: "#333",
  },
  jsonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  jsonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    backgroundColor: "#1e1e1e",
    color: "#00ff00",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    minHeight: 120,
    marginBottom: 16,
  },
  jsonInputError: {
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  jsonInvalid: {
    color: "#ff4444",
    fontSize: 12,
    fontWeight: "500",
  },
  jsonValid: {
    color: "#00C851",
    fontSize: 12,
    fontWeight: "500",
  },
  sendButton: {
    backgroundColor: "#1a237e",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#999",
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    color: "#999",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#1a237e",
  },
});

export default DebugScreen;
