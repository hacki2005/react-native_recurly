interface ClerkErrorDetail {
  longMessage?: unknown;
  message?: unknown;
}

interface ClerkErrorLike {
  errors?: ClerkErrorDetail[];
  longMessage?: unknown;
  message?: unknown;
}

export function getAuthErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  const authError = error as ClerkErrorLike;
  const detail = authError.errors?.[0];
  const message =
    detail?.longMessage ??
    detail?.message ??
    authError.longMessage ??
    authError.message;

  return typeof message === "string" && message.trim() ? message : fallback;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}
