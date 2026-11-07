import { describe, expect, it } from "vitest";

import { CAPTION_MAX_LENGTH, captionSchema } from "./caption-schema";

describe("captionSchema", () => {
  it("allows an empty caption", () => {
    expect(captionSchema.parse("")).toBe("");
  });

  it("trims the caption", () => {
    expect(captionSchema.parse("  Sunset \n")).toBe("Sunset");
  });

  it("accepts exactly 2,200 characters and rejects 2,201", () => {
    expect(captionSchema.safeParse("a".repeat(CAPTION_MAX_LENGTH)).success).toBe(true);
    const result = captionSchema.safeParse("a".repeat(CAPTION_MAX_LENGTH + 1));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("validation.captionTooLong");
  });
});
