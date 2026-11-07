import { describe, expect, it } from "vitest";

import { COMMENT_MAX_LENGTH, commentFormSchema } from "./comment-schema";

function errorOf(body: string): string | undefined {
  const result = commentFormSchema.safeParse({ body });
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("commentFormSchema", () => {
  it("trims the comment", () => {
    expect(commentFormSchema.parse({ body: "  Nice shot!  \n" })).toEqual({ body: "Nice shot!" });
  });

  it("rejects an empty or blank comment", () => {
    expect(errorOf("")).toBe("validation.commentRequired");
    expect(errorOf("   \n\t ")).toBe("validation.commentRequired");
  });

  it("accepts exactly 500 characters and rejects 501", () => {
    expect(errorOf("a".repeat(COMMENT_MAX_LENGTH))).toBeUndefined();
    expect(errorOf("a".repeat(COMMENT_MAX_LENGTH + 1))).toBe("validation.commentTooLong");
  });
});
