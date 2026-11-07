import type { TranslationKey } from "@/i18n/translate";
import { isApiError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

/** A failed avatar upload or profile update, ready for the Edit Profile dialog to show. */
export type EditProfileError = {
  key: TranslationKey;
  /** The API's own messages, listed under a 400 so the user can see what was rejected. */
  details?: string[];
};

/**
 * Maps an error from POST /uploads (step "upload") or PATCH /users/me (step
 * "save") to a message (FR-PROF-04). The server's verdict wins over the
 * client-side checks, e.g. a renamed file whose contents aren't an image.
 */
export function mapEditProfileError(error: unknown, step: "upload" | "save"): EditProfileError {
  if (isApiError(error, 413)) return { key: "profile.edit.errors.tooLarge" };
  if (isApiError(error, 400)) {
    return {
      key: step === "upload" ? "profile.edit.errors.rejectedFile" : "profile.edit.errors.rejected",
      details: error.messages,
    };
  }
  return { key: mapApiErrorToMessageKey(error) };
}
