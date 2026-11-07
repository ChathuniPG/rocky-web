import type { TranslationKey } from "@/i18n/translate";

import { isApiError, isNetworkError } from "./errors";

/**
 * Translation key for a generic failed request, used in toasts and inline
 * error states (FR-UI-05). Features with error cases of their own (e.g. auth or
 * uploads) map those first and fall back to this.
 */
export function mapApiErrorToMessageKey(error: unknown): TranslationKey {
  if (isNetworkError(error)) return "errors.network";
  if (!isApiError(error)) return "errors.unknown";
  if (error.statusCode === 404) return "errors.notFound";
  if (error.statusCode === 429) return "errors.tooManyRequests";
  if (error.statusCode >= 500) return "errors.serviceUnavailable";
  return "errors.unknown";
}
