// jest.setup.js
import "@testing-library/jest-native/extend-expect";

// Mock React Navigation hooks
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    dispatch: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
    isFocused: () => true,
    addListener: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => {
    // Call the callback immediately to simulate the effect running
    if (typeof callback === "function") {
      callback();
    }
    // Return a cleanup function
    return () => {};
  }),
  useRoute: () => ({ params: {} }),
  NavigationContainer: ({ children }) => children,
}));

// Create a more robust BackHandler mock
const mockBackHandler = {
  addEventListener: jest.fn().mockImplementation((eventName, callback) => {
    // Store the callback for hardware back press events
    if (eventName === "hardwareBackPress") {
      mockBackHandler._callback = callback;
    }
    return { remove: jest.fn() };
  }),
  removeEventListener: jest.fn(),
  // Helper function for tests to trigger back press
  _callback: null,
  __triggerBackPress: function () {
    if (this._callback) {
      return this._callback();
    }
    return false;
  },
};

jest.mock(
  "react-native/Libraries/Utilities/BackHandler",
  () => mockBackHandler,
);

// Mock expo-constants
jest.mock("expo-constants", () => ({
  default: {
    manifest: {},
    executionEnvironment: "standalone",
    expoVersion: "52.0.0",
  },
}));

// Mock expo-router since it's used in the app
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    dismissAll: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    dismissAll: jest.fn(),
  }),
}));
