import { describe, expect, it } from "vitest";

import {
  BIO_MAX_LENGTH,
  buildProfileUpdate,
  DISPLAY_NAME_MAX_LENGTH,
  profileFormDefaults,
  profileFormSchema,
} from "./profile-schema";

const current = { displayName: "Alice", bio: "Coffee" };

describe("profileFormSchema", () => {
  it("trims both fields", () => {
    expect(profileFormSchema.parse({ displayName: "  Ada ", bio: " hi " })).toEqual({
      displayName: "Ada",
      bio: "hi",
    });
  });

  it("requires a display name that isn't only spaces", () => {
    const result = profileFormSchema.safeParse({ displayName: "   ", bio: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("validation.displayNameRequired");
  });

  it("enforces the length limits on what the user typed", () => {
    const longName = profileFormSchema.safeParse({
      displayName: "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1),
      bio: "",
    });
    expect(longName.error?.issues[0]?.message).toBe("validation.displayNameTooLong");

    const longBio = profileFormSchema.safeParse({
      displayName: "Ada",
      bio: "b".repeat(BIO_MAX_LENGTH + 1),
    });
    expect(longBio.error?.issues[0]?.message).toBe("validation.bioTooLong");

    const atLimits = profileFormSchema.safeParse({
      displayName: "a".repeat(DISPLAY_NAME_MAX_LENGTH),
      bio: "b".repeat(BIO_MAX_LENGTH),
    });
    expect(atLimits.success).toBe(true);
  });

  it("allows an empty bio", () => {
    expect(profileFormSchema.safeParse({ displayName: "Ada", bio: "" }).success).toBe(true);
  });
});

describe("profileFormDefaults", () => {
  it("turns a missing bio into an empty field", () => {
    expect(profileFormDefaults({ displayName: "Ada", bio: null })).toEqual({
      displayName: "Ada",
      bio: "",
    });
  });
});

describe("buildProfileUpdate", () => {
  it("returns null when nothing changed", () => {
    expect(buildProfileUpdate(current, current, { kind: "keep" })).toBeNull();
    const noBio = { displayName: "Ada", bio: null };
    expect(buildProfileUpdate(noBio, { displayName: "Ada", bio: "" }, { kind: "keep" })).toBeNull();
  });

  it("sends only the changed fields", () => {
    const values = { displayName: "Ada", bio: "Coffee" };
    expect(buildProfileUpdate(current, values, { kind: "keep" })).toEqual({ displayName: "Ada" });
  });

  it("clears the bio with null", () => {
    const values = { displayName: "Alice", bio: "" };
    expect(buildProfileUpdate(current, values, { kind: "keep" })).toEqual({ bio: null });
  });

  it("replaces or removes the avatar", () => {
    expect(
      buildProfileUpdate(current, current, { kind: "replace", path: "avatars/u/1.png" }),
    ).toEqual({ avatarPath: "avatars/u/1.png" });
    expect(buildProfileUpdate(current, current, { kind: "remove" })).toEqual({ avatarPath: null });
  });
});
