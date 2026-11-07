/**
 * Usernames the API refuses at sign-up because they collide with routes or could
 * pass for an official account. Mirrors RESERVED_USERNAMES in rocky-api
 * (src/modules/users/users.constants.ts); the API stays the authority, this copy
 * only lets the form say so before submitting. Compared after lowercasing.
 */
export const RESERVED_USERNAMES: readonly string[] = [
  "admin",
  "api",
  "auth",
  "login",
  "logout",
  "me",
  "messages",
  "notifications",
  "posts",
  "search",
  "settings",
  "signup",
  "uploads",
];
