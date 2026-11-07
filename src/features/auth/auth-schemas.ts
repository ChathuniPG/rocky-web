import { z } from "zod";

import type { TranslationKey } from "@/i18n/translate";

import { RESERVED_USERNAMES } from "./reserved-usernames";

/*
 * Client-side validation for the auth forms. The rules and normalisation mirror
 * the API's SignupDto and LoginDto (docs/openapi.json, FR-AUTH-02), so most
 * mistakes are caught before a request is sent; the API still validates
 * everything. Error messages are translation keys, so the schemas stay
 * language-neutral and the form translates them for display.
 */

/** A translation key used as a validation or server error message in the auth forms. */
export type AuthMessageKey = Extract<
  TranslationKey,
  `auth.validation.${string}` | `auth.errors.${string}`
>;

const message = (key: AuthMessageKey) => ({ error: key });

const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const DISPLAY_NAME_MAX_LENGTH = 50;

// Same as the API's checks: any Unicode letter, and an ASCII digit.
const CONTAINS_LETTER = /\p{L}/u;
const CONTAINS_DIGIT = /\d/;
const USERNAME_CHARACTERS = /^[a-z0-9_.]+$/;

// Trimmed and lowercased like the API, so "Alice@Example.com " is the same account.
// The format check runs on the normalised value (pipe), so stray spaces aren't an error.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, message("auth.validation.emailRequired"))
  .pipe(
    z
      .email(message("auth.validation.emailInvalid"))
      .max(EMAIL_MAX_LENGTH, message("auth.validation.emailTooLong")),
  );

/** Login (FR-AUTH-03): the API only checks the length, so neither does the form. */
export const loginSchema = z.object({
  email: emailSchema,
  // Never trimmed: spaces are valid password characters.
  password: z
    .string()
    .min(1, message("auth.validation.passwordRequired"))
    .max(PASSWORD_MAX_LENGTH, message("auth.validation.passwordTooLong")),
});

/** Sign-up (FR-AUTH-01, FR-AUTH-02). */
export const signupSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, message("auth.validation.passwordRequired"))
    .min(PASSWORD_MIN_LENGTH, message("auth.validation.passwordTooShort"))
    .max(PASSWORD_MAX_LENGTH, message("auth.validation.passwordTooLong"))
    .refine(
      (value) => CONTAINS_LETTER.test(value) && CONTAINS_DIGIT.test(value),
      message("auth.validation.passwordLetterAndNumber"),
    ),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, message("auth.validation.usernameRequired"))
    .min(USERNAME_MIN_LENGTH, message("auth.validation.usernameTooShort"))
    .max(USERNAME_MAX_LENGTH, message("auth.validation.usernameTooLong"))
    .regex(USERNAME_CHARACTERS, message("auth.validation.usernameCharacters"))
    .refine(
      (value) => !RESERVED_USERNAMES.includes(value),
      message("auth.validation.usernameReserved"),
    ),
  displayName: z
    .string()
    .trim()
    .min(1, message("auth.validation.displayNameRequired"))
    .max(DISPLAY_NAME_MAX_LENGTH, message("auth.validation.displayNameTooLong")),
});

/** What the login form holds while editing. */
export type LoginFormInput = z.input<typeof loginSchema>;
/** Normalised login data, ready for POST /auth/login. */
export type LoginFormValues = z.output<typeof loginSchema>;
/** What the sign-up form holds while editing. */
export type SignupFormInput = z.input<typeof signupSchema>;
/** Normalised sign-up data, ready for POST /auth/signup. */
export type SignupFormValues = z.output<typeof signupSchema>;
