import type { TranslationKey } from "@/i18n/translate";
import { isApiError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

/** A failed upload or post creation, ready for the create-post dialog to show. */
export type CreatePostError = {
  /** Message to show (a translation key). */
  key: TranslationKey;
  /** The API's own messages, listed under a 400 so the user can see what was rejected. */
  details?: string[];
};

/**
 * Maps an error from POST /uploads (step "upload") or POST /posts (step
 * "create") to a message (FR-POST-02). The server's verdict wins over the
 * client-side checks, e.g. a renamed file whose contents aren't an image.
 */
export function mapCreatePostError(error: unknown, step: "upload" | "create"): CreatePostError {
  if (isApiError(error, 413)) return { key: "createPost.errors.tooLarge" };
  if (isApiError(error, 400)) {
    return {
      key: step === "upload" ? "createPost.errors.rejectedFile" : "createPost.errors.rejectedPost",
      details: error.messages,
    };
  }
  return { key: mapApiErrorToMessageKey(error) };
}
