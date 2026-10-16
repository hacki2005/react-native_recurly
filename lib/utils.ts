import dayjs from "dayjs";

/**
 * Formats an amount in the currency's major units using en-US currency formatting
 * with exactly two decimal places. Currency defaults to USD; if formatting throws
 * (for example, for a malformed currency code), returns `value.toFixed(2)` without
 * a currency symbol or grouping.
 */
export const formatCurrency = (value: number, currency = "USD"): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
};

/**
 * Returns the Day.js-parsed date as MM/DD/YYYY, omitting the time.
 * Returns "Not provided" for missing, empty, or Day.js-invalid input.
 */
export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid() ? parsedDate.format("MM/DD/YYYY") : "Not provided";
};

/**
 * Uppercases the first character, preserving the rest of the status unchanged.
 * Returns "Unknown" for missing or empty input.
 */
export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};