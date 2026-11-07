import { describe, expect, it } from "vitest";

import { MAX_AVATAR_BYTES, validateAvatarFile } from "./avatar-validation";

describe("validateAvatarFile", () => {
  it("accepts JPEG, PNG and WebP up to 5 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "IMAGE/PNG"]) {
      expect(validateAvatarFile({ type, size: 1000 })).toEqual({ ok: true });
    }
    expect(validateAvatarFile({ type: "image/png", size: MAX_AVATAR_BYTES })).toEqual({ ok: true });
  });

  it("rejects other types, including videos and GIFs", () => {
    for (const type of ["video/mp4", "image/gif", "application/pdf", ""]) {
      expect(validateAvatarFile({ type, size: 1000 })).toEqual({
        ok: false,
        error: "unsupportedType",
      });
    }
  });

  it("rejects empty and oversized files", () => {
    expect(validateAvatarFile({ type: "image/png", size: 0 })).toEqual({
      ok: false,
      error: "empty",
    });
    expect(validateAvatarFile({ type: "image/png", size: MAX_AVATAR_BYTES + 1 })).toEqual({
      ok: false,
      error: "fileTooLarge",
    });
  });
});
