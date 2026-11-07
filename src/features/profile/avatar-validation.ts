import { MAX_IMAGE_BYTES } from "@/features/posts/media-validation";

/*
 * Client-side checks for avatar images (FR-PROF-04), mirroring POST /uploads
 * with purpose "avatar": JPEG, PNG or WebP up to 5 MB. They only spare the user
 * a doomed upload; the server detects the real type from the file contents.
 */

/** Largest avatar the API accepts (same limit as post images). */
export const MAX_AVATAR_BYTES = MAX_IMAGE_BYTES;

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Value for the file input's `accept` attribute. */
export const AVATAR_ACCEPT = [...AVATAR_TYPES, ".jpg", ".jpeg", ".png", ".webp"].join(",");

/** Why a file can't be an avatar. */
export type AvatarValidationError = "unsupportedType" | "empty" | "fileTooLarge";

/** Checks a picked file against the API's avatar type and size limits. */
export function validateAvatarFile(
  file: Pick<File, "type" | "size">,
): { ok: true } | { ok: false; error: AvatarValidationError } {
  if (!AVATAR_TYPES.includes(file.type.toLowerCase()))
    return { ok: false, error: "unsupportedType" };
  if (file.size === 0) return { ok: false, error: "empty" };
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, error: "fileTooLarge" };
  return { ok: true };
}
