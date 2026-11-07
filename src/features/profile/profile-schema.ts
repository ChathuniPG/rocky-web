import { z } from "zod";

import type { TranslationKey } from "@/i18n/translate";
import type { ApiSchemas, Profile } from "@/lib/api/types";

/*
 * Validation for the Edit Profile form (FR-PROF-04), mirroring UpdateProfileDto:
 * a display name of 1–50 characters and a bio of at most 160, both trimmed.
 * Lengths are checked before trimming, on exactly what the counter shows;
 * "required" is checked after it, so spaces alone aren't a name. Messages are
 * translation keys; the form translates them.
 */

/** Longest display name (UpdateProfileDto.displayName maxLength). */
export const DISPLAY_NAME_MAX_LENGTH = 50;
/** Longest bio (UpdateProfileDto.bio maxLength). */
export const BIO_MAX_LENGTH = 160;

type ValidationKey = Extract<TranslationKey, `validation.${string}`>;
const message = (key: ValidationKey) => ({ error: key });

/** The Edit Profile form's text fields. */
export const profileFormSchema = z.object({
  displayName: z
    .string()
    .max(DISPLAY_NAME_MAX_LENGTH, message("validation.displayNameTooLong"))
    .trim()
    .min(1, message("validation.displayNameRequired")),
  bio: z.string().max(BIO_MAX_LENGTH, message("validation.bioTooLong")).trim(),
});

/** Values of the Edit Profile form (trimmed after validation). */
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/** What to do with the avatar when saving. */
export type AvatarChange =
  | { kind: "keep" }
  | { kind: "remove" }
  /** `path` is what POST /uploads (purpose avatar) returned. */
  | { kind: "replace"; path: string };

/** Body of PATCH /users/me. */
export type ProfileUpdate = ApiSchemas["UpdateProfileDto"];

/** The form's starting values for a profile; a missing bio is an empty field. */
export function profileFormDefaults(profile: Pick<Profile, "displayName" | "bio">) {
  return { displayName: profile.displayName, bio: profile.bio ?? "" };
}

/**
 * The PATCH body with only what changed, or `null` when nothing did (the API
 * rejects an empty update). An empty bio is sent as `null`, which clears it.
 */
export function buildProfileUpdate(
  current: Pick<Profile, "displayName" | "bio">,
  values: ProfileFormValues,
  avatar: AvatarChange,
): ProfileUpdate | null {
  const update: ProfileUpdate = {};
  if (values.displayName !== current.displayName) update.displayName = values.displayName;

  const bio = values.bio === "" ? null : values.bio;
  if (bio !== (current.bio ?? null)) update.bio = bio;

  if (avatar.kind === "remove") update.avatarPath = null;
  if (avatar.kind === "replace") update.avatarPath = avatar.path;

  return Object.keys(update).length > 0 ? update : null;
}
