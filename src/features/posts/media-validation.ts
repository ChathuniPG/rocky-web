import type { MediaType } from "@/lib/api/types";

/*
 * Client-side checks for post media (FR-POST-02), mirroring POST /uploads with
 * purpose "post": JPEG, PNG or WebP up to 5 MB; MP4 or WebM up to 25 MB. They
 * only spare the user a doomed upload. The server stays the authority
 * (NFR-SEC-07): it detects the real type from the file contents, while the
 * browser's `file.type` comes from the file name.
 */

const MEGABYTE = 1024 * 1024;

/** Largest image the API accepts for a post. */
export const MAX_IMAGE_BYTES = 5 * MEGABYTE;
/** Largest video the API accepts for a post. */
export const MAX_VIDEO_BYTES = 25 * MEGABYTE;

const ALLOWED_TYPES: Readonly<Record<string, MediaType>> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "video/mp4": "VIDEO",
  "video/webm": "VIDEO",
};

/** Value for the file input's `accept` attribute: the MIME types plus their extensions. */
export const MEDIA_ACCEPT = [
  ...Object.keys(ALLOWED_TYPES),
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".mp4",
  ".webm",
].join(",");

/** Why a file can't be posted. */
export type MediaValidationError = "empty" | "unsupportedType" | "imageTooLarge" | "videoTooLarge";

/** Result of {@link validateMediaFile}. */
export type MediaValidationResult =
  | { ok: true; mediaType: MediaType }
  | { ok: false; error: MediaValidationError; maxBytes?: number };

/** Checks a picked or dropped file against the API's type and size limits. */
export function validateMediaFile(file: Pick<File, "type" | "size">): MediaValidationResult {
  const mediaType = ALLOWED_TYPES[file.type.toLowerCase()];
  if (!mediaType) return { ok: false, error: "unsupportedType" };
  if (file.size === 0) return { ok: false, error: "empty" };

  if (mediaType === "IMAGE" && file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "imageTooLarge", maxBytes: MAX_IMAGE_BYTES };
  }
  if (mediaType === "VIDEO" && file.size > MAX_VIDEO_BYTES) {
    return { ok: false, error: "videoTooLarge", maxBytes: MAX_VIDEO_BYTES };
  }
  return { ok: true, mediaType };
}
