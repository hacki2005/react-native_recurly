import React from "react";
import { existsSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react-native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import appConfig from "../app.json";
import RootLayout from "../src/app/_layout";

jest.mock("../global.css", () => ({}));
jest.mock("expo-font", () => ({ useFonts: jest.fn() }));
jest.mock("expo-router", () => ({
  SplashScreen: { hideAsync: jest.fn() },
  Stack: jest.fn(() => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "navigation-stack" });
  }),
}));

// Distinct asset handles catch accidentally mapping two weights to one file.
// Virtual mocks keep font aliases independent of Jest's moduleNameMapper.
jest.mock("@/assets/fonts/PlusJakartaSans-Regular.ttf", () => 101, { virtual: true });
jest.mock("@/assets/fonts/PlusJakartaSans-Bold.ttf", () => 102, { virtual: true });
jest.mock("@/assets/fonts/PlusJakartaSans-Medium.ttf", () => 103, { virtual: true });
jest.mock("@/assets/fonts/PlusJakartaSans-SemiBold.ttf", () => 104, { virtual: true });
jest.mock("@/assets/fonts/PlusJakartaSans-ExtraBold.ttf", () => 105, { virtual: true });
jest.mock("@/assets/fonts/PlusJakartaSans-Light.ttf", () => 106, { virtual: true });

beforeEach(() => {
  jest.clearAllMocks();
  useFonts.mockReturnValue([false, null]);
  SplashScreen.hideAsync.mockResolvedValue(undefined);
});

describe("RootLayout", () => {
  test("renders nothing and keeps the splash screen while fonts are loading", async () => {
    const result = await render(<RootLayout />);

    expect(result.toJSON()).toBeNull();
    expect(Stack).not.toHaveBeenCalled();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  test("requests all six font weights with their matching bundled assets", async () => {
    await render(<RootLayout />);

    expect(useFonts).toHaveBeenCalledWith({
      "sans-regular": 101,
      "sans-bold": 102,
      "sans-medium": 103,
      "sans-semibold": 104,
      "sans-extrabold": 105,
      "sans-light": 106,
    });
  });

  test("shows the stack with hidden headers and hides the splash when already loaded", async () => {
    useFonts.mockReturnValue([true, null]);

    await render(<RootLayout />);

    expect(screen.getByTestId("navigation-stack")).toBeTruthy();
    expect(Stack.mock.calls.at(-1)[0].screenOptions).toEqual({ headerShown: false });
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    expect(SplashScreen.hideAsync).toHaveBeenCalledWith();
  });

  test("transitions from loading to ready and only hides the splash once", async () => {
    await render(<RootLayout />);

    expect(screen.queryByTestId("navigation-stack")).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    // An unrelated render while still loading must not dismiss the splash.
    await screen.rerender(<RootLayout />);
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    useFonts.mockReturnValue([true, null]);
    await screen.rerender(<RootLayout />);

    expect(screen.getByTestId("navigation-stack")).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);

    await screen.rerender(<RootLayout />);
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  test("the font plugin bundles all six existing Plus Jakarta Sans assets", () => {
    const fontPlugin = appConfig.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-font",
    );
    const fonts = fontPlugin?.[1]?.fonts;

    expect(fonts).toEqual(expect.arrayContaining([
      "./assets/fonts/PlusJakartaSans-Regular.ttf",
      "./assets/fonts/PlusJakartaSans-Bold.ttf",
      "./assets/fonts/PlusJakartaSans-Medium.ttf",
      "./assets/fonts/PlusJakartaSans-SemiBold.ttf",
      "./assets/fonts/PlusJakartaSans-ExtraBold.ttf",
      "./assets/fonts/PlusJakartaSans-Light.ttf",
    ]));
    expect(fonts).toHaveLength(6);
    for (const font of fonts) {
      expect(existsSync(path.resolve(__dirname, "..", font))).toBe(true);
    }
  });
});
