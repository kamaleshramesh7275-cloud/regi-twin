/**
 * authErrors.ts — Maps Firebase Auth error codes to clear, non-technical user messages.
 *
 * Design decisions:
 * - auth/wrong-password + auth/user-not-found map to the same message intentionally
 *   to prevent email enumeration attacks (confirming that an account exists).
 * - Raw error codes are logged separately to console/analytics so devs can debug
 *   without ever exposing them in the UI.
 * - Any unmapped code falls back to a single safe generic message.
 */

/** User-facing error message. Never includes raw Firebase codes or stack traces. */
export type AuthErrorMessage = string;

const ERROR_MAP: Record<string, AuthErrorMessage> = {
  // Sign-in errors — deliberately ambiguous for wrong-password to prevent enumeration
  "auth/wrong-password":
    "That email or password doesn't match an account.",
  "auth/user-not-found":
    "That email or password doesn't match an account.",
  "auth/invalid-credential":
    "That email or password doesn't match an account.",
  "auth/invalid-login-credentials":
    "That email or password doesn't match an account.",

  // Email / format errors
  "auth/invalid-email":
    "That doesn't look like a valid email address.",
  "auth/missing-email":
    "Please enter your email address.",

  // Registration errors
  "auth/email-already-in-use":
    "An account already exists with that email — try signing in instead.",
  "auth/weak-password":
    "Choose a password with at least 8 characters.",
  "auth/missing-password":
    "Please enter a password.",

  // Rate limiting / abuse prevention
  "auth/too-many-requests":
    "Too many attempts — please wait a few minutes before trying again.",

  // Network
  "auth/network-request-failed":
    "Couldn't reach the server — check your connection and try again.",

  // Token / session
  "auth/user-disabled":
    "This account has been disabled. Please contact support.",
  "auth/user-token-expired":
    "Your session has expired — please sign in again.",
  "auth/requires-recent-login":
    "For security, please sign in again to complete this action.",

  // Google/popup errors — these are usually user-initiated, don't show an error
  "auth/popup-closed-by-user": "",
  "auth/cancelled-popup-request": "",
  "auth/popup-blocked":
    "Your browser blocked the sign-in popup. Please allow popups for this site and try again.",

  // Password reset
  "auth/expired-action-code":
    "This reset link has expired. Request a new one.",
  "auth/invalid-action-code":
    "This reset link is invalid or has already been used.",

  // Config / internal (should never reach users in prod)
  "auth/invalid-api-key":
    "Firebase is not configured correctly. Contact the admin.",
  "auth/app-not-authorized":
    "This app is not authorised to use Firebase Authentication.",
  "auth/operation-not-allowed":
    "This sign-in method is not enabled. Contact the admin.",
};

const GENERIC_FALLBACK: AuthErrorMessage =
  "Something went wrong — please try again.";

/**
 * Maps a Firebase Auth error to a user-friendly message.
 * Returns an empty string for errors that should be silently ignored (e.g. popup closed).
 * Never returns raw Firebase error codes or stack traces.
 */
export function mapAuthError(error: unknown): AuthErrorMessage {
  if (!error || typeof error !== "object") return GENERIC_FALLBACK;

  const code = (error as any)?.code as string | undefined;
  const message = (error as any)?.message as string | undefined;

  // Log raw details for devs/debugging — never shown to user
  logAuthError(code, message, error);

  if (!code) return GENERIC_FALLBACK;

  const mapped = ERROR_MAP[code];
  // `mapped === ""` means the error is user-initiated and should be silently ignored
  if (mapped !== undefined) return mapped;

  // Check for invalid-api-key in message as a fallback (config issue)
  if (message?.includes("dummy-api-key") || message?.includes("invalid-api-key")) {
    return ERROR_MAP["auth/invalid-api-key"];
  }

  return GENERIC_FALLBACK;
}

/**
 * Returns true if the error is a user-initiated action that should be silently ignored.
 */
export function isIgnorableAuthError(error: unknown): boolean {
  const code = (error as any)?.code as string | undefined;
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}

/**
 * Logs the raw Firebase error details for debugging.
 * This is the ONLY place where raw error codes/messages appear — in the console, not the UI.
 */
export function logAuthError(
  code: string | undefined,
  message: string | undefined,
  rawError?: unknown
): void {
  if (import.meta.env.DEV) {
    console.group("[Auth Error]");
    console.warn("Code:", code);
    console.warn("Message:", message);
    if (rawError) console.debug("Raw:", rawError);
    console.groupEnd();
  } else {
    // In production, log a minimal trace. Wire to Sentry/Datadog/etc here if available.
    console.warn(`[Auth] code=${code}`);
  }
}

/**
 * Validates an email string client-side before hitting Firebase.
 * Returns an error message or empty string if valid.
 */
export function validateEmail(email: string): string {
  if (!email.trim()) return "Please enter your email address.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return "That doesn't look like a valid email address.";
  return "";
}

/**
 * Validates a password string client-side before hitting Firebase.
 * Returns an error message or empty string if valid.
 */
export function validatePassword(password: string, isRegister = true): string {
  if (!password) return "Please enter a password.";
  if (isRegister && password.length < 8)
    return "Choose a password with at least 8 characters.";
  return "";
}

/**
 * Password strength for UI indicator (0–3).
 * 0 = too short, 1 = weak, 2 = moderate, 3 = strong
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length < 8) return 0;
  let score = 1;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}
