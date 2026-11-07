import { describe, expect, it } from "vitest";

import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, validateMediaFile } from "./media-validation";

describe("validateMediaFile", () => {
  it.each([
    ["image/jpeg", "IMAGE"],
    ["image/png", "IMAGE"],
    ["image/webp", "IMAGE"],
    ["video/mp4", "VIDEO"],
    ["video/webm", "VIDEO"],
  ])("accepts %s as %s", (type, mediaType) => {
    expect(validateMediaFile({ type, size: 1_000 })).toEqual({ ok: true, mediaType });
  });

  it("ignores the case of the MIME type", () => {
    expect(validateMediaFile({ type: "IMAGE/PNG", size: 1 })).toEqual({
      ok: true,
      mediaType: "IMAGE",
    });
  });

  it.each(["image/gif", "image/heic", "video/quicktime", "application/pdf", ""])(
    "rejects %j as an unsupported type",
    (type) => {
      expect(validateMediaFile({ type, size: 1_000 })).toEqual({
        ok: false,
        error: "unsupportedType",
      });
    },
  );

  it("rejects an empty file", () => {
    expect(validateMediaFile({ type: "image/png", size: 0 })).toEqual({
      ok: false,
      error: "empty",
    });
  });

  it("accepts an image of exactly 5 MB and rejects one byte more", () => {
    expect(validateMediaFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES }).ok).toBe(true);
    expect(validateMediaFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 })).toEqual({
      ok: false,
      error: "imageTooLarge",
      maxBytes: MAX_IMAGE_BYTES,
    });
  });

  it("allows videos up to 25 MB, beyond the image limit", () => {
    expect(validateMediaFile({ type: "video/mp4", size: MAX_IMAGE_BYTES + 1 }).ok).toBe(true);
    expect(validateMediaFile({ type: "video/mp4", size: MAX_VIDEO_BYTES }).ok).toBe(true);
    expect(validateMediaFile({ type: "video/webm", size: MAX_VIDEO_BYTES + 1 })).toEqual({
      ok: false,
      error: "videoTooLarge",
      maxBytes: MAX_VIDEO_BYTES,
    });
  });
});
