import React from "react";
import { render, screen } from "@testing-library/react-native";
import UpcomingSubscriptionCard from "../components/UpcomingSubscriptionCard";

const subscription = {
  id: "example",
  name: "Example subscription",
  icon: { uri: "https://example.test/icon.png" },
  price: 5.99,
  daysLeft: 2,
};

describe("UpcomingSubscriptionCard", () => {
  test("shows the supplied name and default USD price", async () => {
    await render(<UpcomingSubscriptionCard {...subscription} />);

    expect(screen.getByText(subscription.name)).toBeTruthy();
    expect(screen.getByText("$5.99")).toBeTruthy();
  });

  test.each([
    [2, "2 days Left"],
    [10, "10 days Left"],
    [1, "Last day"],
    [0, "Last day"],
    [-1, "Last day"],
  ])("shows the correct countdown for %s days remaining", async (daysLeft, expected) => {
    await render(<UpcomingSubscriptionCard {...subscription} daysLeft={daysLeft} />);

    expect(screen.getByText(expected)).toBeTruthy();
    if (daysLeft <= 1) {
      expect(screen.queryByText(/days Left/)).toBeNull();
    } else {
      expect(screen.queryByText("Last day")).toBeNull();
    }
  });

  test.each([
    [12, "EUR", "€12.00"],
    [0, "USD", "$0.00"],
    [5.99, "invalid", "5.99"],
  ])("formats a price of %s in %s", async (price, currency, expected) => {
    await render(<UpcomingSubscriptionCard {...subscription} price={price} currency={currency} />);

    expect(screen.getByText(expected)).toBeTruthy();
  });
});
