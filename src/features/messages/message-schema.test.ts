import { describe, expect, it } from "vitest";

import { canSendMessage, MESSAGE_MAX_LENGTH, messageFormSchema } from "./message-schema";

describe("messageFormSchema", () => {
  it("trims the message", () => {
    expect(messageFormSchema.parse({ body: "  hello \n" })).toEqual({ body: "hello" });
  });

  it("rejects blank messages", () => {
    const result = messageFormSchema.safeParse({ body: "  \n " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("validation.messageRequired");
  });

  it("accepts exactly the maximum and rejects one more", () => {
    expect(messageFormSchema.safeParse({ body: "a".repeat(MESSAGE_MAX_LENGTH) }).success).toBe(
      true,
    );
    const result = messageFormSchema.safeParse({ body: "a".repeat(MESSAGE_MAX_LENGTH + 1) });
    expect(result.error?.issues[0]?.message).toBe("validation.messageTooLong");
  });
});

describe("canSendMessage", () => {
  it("needs some non-blank text within the limit", () => {
    expect(canSendMessage("")).toBe(false);
    expect(canSendMessage("   ")).toBe(false);
    expect(canSendMessage("hi")).toBe(true);
    expect(canSendMessage("a".repeat(MESSAGE_MAX_LENGTH + 1))).toBe(false);
  });
});
