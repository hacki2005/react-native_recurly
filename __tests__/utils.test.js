// Requires Jest; component tests in this directory also use jest-expo and
// @testing-library/react-native, as recommended by the Expo testing guide.
import {
  formatCurrency,
  formatStatusLabel,
  formatSubscriptionDateTime,
} from "../lib/utils";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("formatCurrency", () => {
  test.each([
    [12, undefined, "$12.00"],
    [0, undefined, "$0.00"],
    [1234567.89, "USD", "$1,234,567.89"],
    [-42.5, "USD", "-$42.50"],
    [1.234, "USD", "$1.23"],
    [1.236, "USD", "$1.24"],
    [12.5, "EUR", "€12.50"],
    [12.5, "GBP", "£12.50"],
    // The helper promises two decimals even for zero-decimal currencies.
    [1200, "JPY", "¥1,200.00"],
  ])("formats %s in %s as %s", (value, currency, expected) => {
    expect(formatCurrency(value, currency)).toBe(expected);
  });

  test.each(["", "US", "US$"])(
    "falls back to an ungrouped amount for malformed currency %j",
    (currency) => {
      expect(formatCurrency(1234.567, currency)).toBe("1234.57");
      expect(formatCurrency(-12.5, currency)).toBe("-12.50");
      expect(formatCurrency(0, currency)).toBe("0.00");
    },
  );

  test("still formats the amount when the Intl formatter is unavailable", () => {
    jest.spyOn(Intl, "NumberFormat").mockImplementation(() => {
      throw new TypeError("Intl.NumberFormat is unavailable");
    });

    expect(formatCurrency(1234.5)).toBe("1234.50");
  });
});

describe("formatSubscriptionDateTime", () => {
  test.each([
    ["2026-03-18", "03/18/2026"],
    ["2024-02-29", "02/29/2024"],
    ["2026-01-01T00:00:00", "01/01/2026"],
    ["2026-12-31T23:59:59", "12/31/2026"],
  ])("formats %s without a time", (value, expected) => {
    expect(formatSubscriptionDateTime(value)).toBe(expected);
  });

  test.each([undefined, "", " ", "not-a-date", "invalid-date-input"])(
    "returns a fallback for missing or invalid input %j",
    (value) => {
      expect(formatSubscriptionDateTime(value)).toBe("Not provided");
    },
  );

  test("formats an offset timestamp in the device's local calendar date", () => {
    const value = "2026-01-01T00:30:00+14:00";
    const localDate = new Date(value);
    const expected = [
      String(localDate.getMonth() + 1).padStart(2, "0"),
      String(localDate.getDate()).padStart(2, "0"),
      localDate.getFullYear(),
    ].join("/");

    expect(formatSubscriptionDateTime(value)).toBe(expected);
  });
});

describe("formatStatusLabel", () => {
  test.each([
    ["active", "Active"],
    ["paused", "Paused"],
    ["cancelled", "Cancelled"],
    ["a", "A"],
    ["Active", "Active"],
    ["pAUSED", "PAUSED"],
    ["past_due", "Past_due"],
    ["on hold", "On hold"],
    ["échéance", "Échéance"],
    [" active", " active"],
  ])("capitalizes only the first character of %j", (value, expected) => {
    expect(formatStatusLabel(value)).toBe(expected);
  });

  test.each([undefined, ""])("uses Unknown for %j", (value) => {
    expect(formatStatusLabel(value)).toBe("Unknown");
  });
});
