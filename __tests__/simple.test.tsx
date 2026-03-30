// __tests__/simple.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";

describe("Jest Setup", () => {
  test("basic test works", () => {
    expect(true).toBe(true);
  });

  test("renders correctly", () => {
    render(
      <View>
        <Text testID="hello-text">Hello Jest</Text>
      </View>,
    );
    // Use toBeTruthy() instead of toHaveTextContent
    expect(screen.getByTestId("hello-text")).toBeTruthy();
    // Or check the text content directly
    expect(screen.getByTestId("hello-text").props.children).toBe("Hello Jest");
  });
});
