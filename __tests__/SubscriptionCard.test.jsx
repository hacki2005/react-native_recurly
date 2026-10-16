import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import SubscriptionCard from "../components/SubscriptionCard";

const defaultProps = {
  name: "Example subscription",
  icon: { uri: "https://example.test/icon.png" },
  price: 12.5,
  billing: "Monthly",
  category: "  Design  ",
  plan: "  Teams Plan  ",
  renewalDate: "2026-03-18T09:00:00",
  paymentMethod: "  Visa ending in 1234  ",
  startDate: "2024-02-29T10:30:00",
  status: "active",
  color: "#f5c542",
  expanded: false,
};

async function renderCard(overrides = {}) {
  const props = { ...defaultProps, onPress: jest.fn(), ...overrides };
  await render(<SubscriptionCard {...props} />);
  return props;
}

describe("SubscriptionCard", () => {
  test("shows the summary without expanded details", async () => {
    await renderCard();

    expect(screen.getByText(defaultProps.name)).toBeTruthy();
    expect(screen.getByText("$12.50")).toBeTruthy();
    expect(screen.getByText("Monthly")).toBeTruthy();
    expect(screen.getByText("Design", { normalizer: (text) => text })).toBeTruthy();
    expect(screen.queryByText("Payment")).toBeNull();
    expect(screen.queryByText("Visa ending in 1234")).toBeNull();
    expect(screen.queryByText("Started:")).toBeNull();
    expect(screen.queryByText("Status:")).toBeNull();
  });

  test.each([
    ["  Design  ", "Teams", "2026-03-18", "Design"],
    [" \t ", "  Teams Plan  ", "2026-03-18", "Teams Plan"],
    [undefined, "  Pro  ", "2026-03-18", "Pro"],
    ["", "", "2026-03-18", "03/18/2026"],
    [" \t", " \n", "2026-03-18", "03/18/2026"],
    [undefined, undefined, "not-a-date", "Not provided"],
  ])(
    "chooses trimmed category, then plan, then renewal date (%j, %j, %j)",
    async (category, plan, renewalDate, expected) => {
      await renderCard({ category, plan, renewalDate });

      expect(screen.getByText(expected, { normalizer: (text) => text })).toBeTruthy();
      if (expected === "Design") {
        expect(screen.queryByText("Teams")).toBeNull();
        expect(screen.queryByText("03/18/2026")).toBeNull();
      }
    },
  );

  test("omits summary metadata when category, plan, and renewal date are absent", async () => {
    await renderCard({ category: undefined, plan: undefined, renewalDate: undefined });

    expect(screen.getByText(defaultProps.name)).toBeTruthy();
    expect(screen.queryByText("Not provided")).toBeNull();
    expect(screen.queryByText("Design")).toBeNull();
    expect(screen.queryByText("Teams Plan")).toBeNull();
  });

  test.each([
    ["active", "Active"],
    ["paused", "Paused"],
    ["cancelled", "Cancelled"],
  ])("shows trimmed details and the %s status when expanded", async (status, label) => {
    await renderCard({ expanded: true, status });

    for (const text of ["Payment", "Visa ending in 1234", "Category:", "Started:", "02/29/2024", "Status:", label]) {
      expect(screen.getByText(text, { normalizer: (value) => value })).toBeTruthy();
    }
    expect(screen.getAllByText("Design", { normalizer: (text) => text })).toHaveLength(2);
    expect(screen.queryByText("Teams Plan")).toBeNull();
  });

  test("uses the trimmed plan in both summary and expanded category when category is blank", async () => {
    await renderCard({ expanded: true, category: " \t " });

    expect(screen.getAllByText("Teams Plan", { normalizer: (text) => text })).toHaveLength(2);
  });

  test("renders missing optional details without misleading placeholders", async () => {
    await renderCard({
      expanded: true,
      category: undefined,
      plan: undefined,
      paymentMethod: undefined,
      startDate: undefined,
      status: undefined,
      renewalDate: undefined,
    });

    for (const label of ["Payment", "Category:", "Started:", "Status:"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("Unknown")).toBeNull();
    expect(screen.queryByText("Not provided")).toBeNull();
    expect(screen.queryByText("undefined")).toBeNull();
  });

  test("shows the date fallback for an invalid supplied start date", async () => {
    await renderCard({ expanded: true, startDate: "not-a-date" });

    expect(screen.getByText("Not provided")).toBeTruthy();
  });

  test.each([
    ["EUR", "€12.50"],
    ["invalid", "12.50"],
  ])("uses currency formatting for %s", async (currency, expected) => {
    await renderCard({ currency });

    expect(screen.getByText(expected)).toBeTruthy();
  });

  test("notifies the parent on press and waits for the expanded prop to change", async () => {
    const props = await renderCard();

    await fireEvent.press(screen.getByText(defaultProps.name));

    expect(props.onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Payment")).toBeNull();

    await screen.rerender(<SubscriptionCard {...props} expanded />);
    expect(screen.getByText("Payment")).toBeTruthy();

    await fireEvent.press(screen.getByText(defaultProps.name));
    expect(props.onPress).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Payment")).toBeTruthy();

    await screen.rerender(<SubscriptionCard {...props} expanded={false} />);
    expect(screen.queryByText("Payment")).toBeNull();
  });

  test("uses the custom background only while collapsed", async () => {
    const props = await renderCard();
    const background = () => StyleSheet.flatten(screen.root.props.style);

    expect(background()).toEqual({ backgroundColor: defaultProps.color });

    await screen.rerender(<SubscriptionCard {...props} expanded />);
    expect(background()?.backgroundColor).toBeUndefined();

    await screen.rerender(<SubscriptionCard {...props} expanded={false} />);
    expect(background()).toEqual({ backgroundColor: defaultProps.color });
  });

  test("does not add an inline background when no color is supplied", async () => {
    await renderCard({ color: undefined });

    expect(StyleSheet.flatten(screen.root.props.style)?.backgroundColor).toBeUndefined();
  });
});
