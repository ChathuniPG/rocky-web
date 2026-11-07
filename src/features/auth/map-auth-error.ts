import { isApiError, isNetworkError } from "@/lib/api/errors";

import type { AuthMessageKey } from "./auth-schemas";

/** A form field that a server error can be attached to. */
export type AuthErrorField = "email" | "username";

/** A failed login or sign-up, translated into something the form can show. */
export type AuthFormError = {
  /** Message to show (a translation key). */
  key: AuthMessageKey;
  /** Set when the error belongs to one field; otherwise it is shown above the form. */
  field?: AuthErrorField;
  /** The API's own messages, listed under a 400 so the user can see what was rejected. */
  details?: string[];
};

/**
 * Picks the field a 409 Conflict is about. The API answers "Username is already
 * taken" or "The email address is already in use"; anything else stays a
 * form-level message.
 */
function conflictError(messages: string[]): AuthFormError {
  const text = messages.join(" ").toLowerCase();
  if (text.includes("username")) return { key: "auth.errors.usernameTaken", field: "username" };
  if (text.includes("email")) return { key: "auth.errors.emailTaken", field: "email" };
  return { key: "auth.errors.conflict" };
}

/** Maps an error from POST /auth/login or /auth/signup to a user-facing message (FR-AUTH-04). */
export function mapAuthError(error: unknown): AuthFormError {
  if (isNetworkError(error)) return { key: "auth.errors.network" };
  if (!isApiError(error)) return { key: "auth.errors.unknown" };

  switch (error.statusCode) {
    case 400:
      return { key: "auth.errors.validation", details: error.messages };
    case 401:
      return { key: "auth.errors.invalidCredentials" };
    case 403:
      return { key: "auth.errors.accountDisabled" };
    case 409:
      return conflictError(error.messages);
    case 429:
      return { key: "auth.errors.tooManyAttempts" };
    default:
      return error.statusCode >= 500
        ? { key: "auth.errors.serviceUnavailable" }
        : { key: "auth.errors.unknown" };
  }
}
