import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "./auth-schemas";
import { RESERVED_USERNAMES } from "./reserved-usernames";

const VALID_SIGNUP = {
  email: "alice@example.com",
  password: "secret123",
  username: "alice",
  displayName: "Alice",
};

/** The first error message per field, as react-hook-form shows it. */
function firstErrors(result: ReturnType<typeof signupSchema.safeParse>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    const field = String(issue.path[0]);
    errors[field] ??= issue.message;
  }
  return errors;
}

describe("signupSchema", () => {
  it("accepts valid input", () => {
    expect(signupSchema.safeParse(VALID_SIGNUP).success).toBe(true);
  });

  it("normalises like the API: trims, lowercases email and username, keeps the password", () => {
    const result = signupSchema.parse({
      email: "  Alice@Example.COM ",
      password: " Secret123 ",
      username: " Alice.B_1 ",
      displayName: "  Alice B  ",
    });
    expect(result).toEqual({
      email: "alice@example.com",
      password: " Secret123 ",
      username: "alice.b_1",
      displayName: "Alice B",
    });
  });

  it.each([
    ["", "auth.validation.emailRequired"],
    ["   ", "auth.validation.emailRequired"],
    ["not-an-email", "auth.validation.emailInvalid"],
    [`${"a".repeat(250)}@example.com`, "auth.validation.emailTooLong"],
  ])("rejects the email %j with %s", (email, expected) => {
    expect(firstErrors(signupSchema.safeParse({ ...VALID_SIGNUP, email })).email).toBe(expected);
  });

  it.each([
    ["", "auth.validation.passwordRequired"],
    ["abc1", "auth.validation.passwordTooShort"],
    ["abcdefgh", "auth.validation.passwordLetterAndNumber"],
    ["12345678", "auth.validation.passwordLetterAndNumber"],
    [`a1${"x".repeat(127)}`, "auth.validation.passwordTooLong"],
  ])("rejects the password %j with %s", (password, expected) => {
    expect(firstErrors(signupSchema.safeParse({ ...VALID_SIGNUP, password })).password).toBe(
      expected,
    );
  });

  it("accepts a password with a non-Latin letter and a number", () => {
    expect(signupSchema.safeParse({ ...VALID_SIGNUP, password: "ශ්‍රී1234567" }).success).toBe(
      true,
    );
  });

  it.each([
    ["", "auth.validation.usernameRequired"],
    ["ab", "auth.validation.usernameTooShort"],
    [" ab ", "auth.validation.usernameTooShort"],
    ["a".repeat(31), "auth.validation.usernameTooLong"],
    ["alice!", "auth.validation.usernameCharacters"],
    ["ali ce", "auth.validation.usernameCharacters"],
  ])("rejects the username %j with %s", (username, expected) => {
    expect(firstErrors(signupSchema.safeParse({ ...VALID_SIGNUP, username })).username).toBe(
      expected,
    );
  });

  it("accepts usernames at the length limits", () => {
    expect(signupSchema.safeParse({ ...VALID_SIGNUP, username: "abc" }).success).toBe(true);
    expect(signupSchema.safeParse({ ...VALID_SIGNUP, username: "a".repeat(30) }).success).toBe(
      true,
    );
  });

  it.each(RESERVED_USERNAMES.filter((name) => name.length >= 3))(
    "rejects the reserved username %s",
    (username) => {
      expect(firstErrors(signupSchema.safeParse({ ...VALID_SIGNUP, username })).username).toBe(
        "auth.validation.usernameReserved",
      );
    },
  );

  it("rejects a reserved username in any case and with spaces", () => {
    expect(
      firstErrors(signupSchema.safeParse({ ...VALID_SIGNUP, username: " Settings " })).username,
    ).toBe("auth.validation.usernameReserved");
  });

  it("allows a username that only contains a reserved word", () => {
    expect(signupSchema.safeParse({ ...VALID_SIGNUP, username: "admin_alice" }).success).toBe(true);
  });

  it.each([
    ["", "auth.validation.displayNameRequired"],
    ["   ", "auth.validation.displayNameRequired"],
    ["a".repeat(51), "auth.validation.displayNameTooLong"],
  ])("rejects the display name %j with %s", (displayName, expected) => {
    expect(firstErrors(signupSchema.safeParse({ ...VALID_SIGNUP, displayName })).displayName).toBe(
      expected,
    );
  });
});

describe("loginSchema", () => {
  it("normalises the email and keeps the password as typed", () => {
    expect(loginSchema.parse({ email: " Alice@Example.com", password: " pw " })).toEqual({
      email: "alice@example.com",
      password: " pw ",
    });
  });

  it("does not apply sign-up password rules", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true);
  });

  it("requires both fields", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining(["auth.validation.emailRequired", "auth.validation.passwordRequired"]),
    );
  });
});
