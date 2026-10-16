import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { HOME_SUBSCRIPTIONS, UPCOMING_SUBSCRIPTIONS } from "../constants/data";
import HomeScreen from "../src/app/(tabs)/index";

jest.mock("../global.css", () => ({}));
jest.mock("expo-router", () => ({ Link: () => null }));

// Exercise the real list and cards while isolating native insets and styling.
jest.mock("nativewind", () => ({ styled: (Component) => Component }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: require("react-native").View,
}));
jest.mock("../constants/images", () => ({
  __esModule: true,
  default: { avatar: 1 },
}));
jest.mock("../constants/icons", () => ({ icons: { add: 2 } }));
jest.mock("../constants/data", () => ({
  HOME_USER: { name: "Test User" },
  HOME_BALANCE: { amount: 1234.5, nextRenewalDate: "2026-03-18T09:00:00" },
  HOME_SUBSCRIPTIONS: [
    {
      id: "first-subscription",
      name: "First subscription",
      icon: 3,
      price: 12.5,
      billing: "Monthly",
      paymentMethod: "Visa ending in 1234",
      category: "Design",
      status: "active",
      startDate: "2025-01-02",
    },
    {
      id: "second-subscription",
      name: "Second subscription",
      icon: 4,
      price: 30,
      currency: "EUR",
      billing: "Yearly",
      paymentMethod: "Mastercard ending in 5678",
      plan: "Pro",
      status: "paused",
      startDate: "2025-06-07",
    },
  ],
  UPCOMING_SUBSCRIPTIONS: [
    { id: "upcoming-first", name: "First renewal", icon: 5, price: 5.99, daysLeft: 2 },
    { id: "upcoming-second", name: "Second renewal", icon: 6, price: 10, daysLeft: 1 },
  ],
}));

const initialSubscriptions = [...HOME_SUBSCRIPTIONS];
const initialUpcoming = [...UPCOMING_SUBSCRIPTIONS];

afterEach(async () => {
  await cleanup();
  HOME_SUBSCRIPTIONS.splice(0, HOME_SUBSCRIPTIONS.length, ...initialSubscriptions);
  UPCOMING_SUBSCRIPTIONS.splice(0, UPCOMING_SUBSCRIPTIONS.length, ...initialUpcoming);
});

describe("HomeScreen", () => {
  test("renders the user, formatted balance, renewal date, and both lists", async () => {
    await render(<HomeScreen />);

    for (const text of [
      "Test User", "Balance", "$1,234.50", "03/18", "Upcoming", "All subscription",
      "First renewal", "$5.99", "2 days Left", "Second renewal", "$10.00", "Last day",
      "First subscription", "$12.50", "Monthly", "Second subscription", "€30.00", "Yearly",
    ]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    expect(screen.getAllByText("View all")).toHaveLength(2);
    expect(screen.queryByText("Payment")).toBeNull();
    expect(screen.queryByText("No subscription yet")).toBeNull();
    expect(screen.queryByText("No upcoming subscription renewals yet.")).toBeNull();
  });

  test("expands and collapses the same subscription on successive presses", async () => {
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByText("First subscription"));
    expect(screen.getByText("Visa ending in 1234")).toBeTruthy();
    expect(screen.getByText("01/02/2025")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.queryByText("Mastercard ending in 5678")).toBeNull();

    await fireEvent.press(screen.getByText("First subscription"));
    expect(screen.queryByText("Visa ending in 1234")).toBeNull();
    expect(screen.queryByText("Payment")).toBeNull();
    expect(screen.getByText("First subscription")).toBeTruthy();
    expect(screen.getByText("Second subscription")).toBeTruthy();
  });

  test("keeps at most one card expanded when switching between subscriptions", async () => {
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByText("First subscription"));
    await fireEvent.press(screen.getByText("Second subscription"));

    expect(screen.queryByText("Visa ending in 1234")).toBeNull();
    expect(screen.getByText("Mastercard ending in 5678")).toBeTruthy();
    expect(screen.getByText("Paused")).toBeTruthy();
    expect(screen.getAllByText("Payment")).toHaveLength(1);

    await fireEvent.press(screen.getByText("First subscription"));
    expect(screen.getByText("Visa ending in 1234")).toBeTruthy();
    expect(screen.queryByText("Mastercard ending in 5678")).toBeNull();
    expect(screen.getAllByText("Payment")).toHaveLength(1);

    await fireEvent.press(screen.getByText("First subscription"));
    expect(screen.queryByText("Payment")).toBeNull();
  });

  test.each([
    [true, false],
    [false, true],
    [true, true],
  ])("shows independent empty states (subscriptions empty: %s, upcoming empty: %s)", async (emptySubscriptions, emptyUpcoming) => {
    if (emptySubscriptions) HOME_SUBSCRIPTIONS.splice(0);
    if (emptyUpcoming) UPCOMING_SUBSCRIPTIONS.splice(0);

    await render(<HomeScreen />);

    expect(Boolean(screen.queryByText("No subscription yet"))).toBe(emptySubscriptions);
    expect(Boolean(screen.queryByText("No upcoming subscription renewals yet."))).toBe(emptyUpcoming);
    expect(Boolean(screen.queryByText("First subscription"))).toBe(!emptySubscriptions);
    expect(Boolean(screen.queryByText("First renewal"))).toBe(!emptyUpcoming);
    expect(screen.getByText("Test User")).toBeTruthy();
    expect(screen.getByText("$1,234.50")).toBeTruthy();
    expect(screen.getByText("Upcoming")).toBeTruthy();
    expect(screen.getByText("All subscription")).toBeTruthy();
  });
});
