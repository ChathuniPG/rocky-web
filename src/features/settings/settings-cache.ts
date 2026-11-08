import type { Locale } from "@/i18n/translate";
import type { ApiSchemas, User } from "@/lib/api/types";

/*
 * Optimistic updates of the signed-in user's settings (FR-SET-02, FR-SET-03).
 * Each change touches only its own field of the cached /auth/me user, so a
 * failed or finished save never undoes another setting changed in between.
 */

/** One settings change, saved with PATCH /users/me. */
export type SettingChange =
  { field: "notificationsEnabled"; value: boolean } | { field: "language"; value: Locale };

/** The PATCH /users/me body for a change. */
export function settingUpdateBody(change: SettingChange): ApiSchemas["UpdateProfileDto"] {
  return change.field === "language"
    ? { language: change.value }
    : { notificationsEnabled: change.value };
}

/** The user with the change applied. */
export function applySetting(user: User, change: SettingChange): User {
  if (user[change.field] === change.value) return user;
  return { ...user, [change.field]: change.value };
}

/**
 * Undoes a failed change: puts back `previous`, but only if the field still
 * holds the value this change set. A newer change to the same field wins.
 */
export function rollbackSetting(
  user: User,
  change: SettingChange,
  previous: User[SettingChange["field"]],
): User {
  if (user[change.field] !== change.value) return user;
  return { ...user, [change.field]: previous };
}

/**
 * Takes the changed field from the server's answer, leaving the other fields
 * alone. Skipped when a newer change to the same field is already showing, so
 * the switch doesn't flick back while that one is on its way.
 */
export function acceptSetting(user: User, change: SettingChange, saved: User): User {
  if (user[change.field] !== change.value || user[change.field] === saved[change.field]) {
    return user;
  }
  return { ...user, [change.field]: saved[change.field] };
}
