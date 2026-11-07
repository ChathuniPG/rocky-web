import { describe, expect, it } from "vitest";

import { isValidUsername, parseProfileTab, profileTabHref } from "./profile-params";

describe("isValidUsername", () => {
  it("accepts the API's username pattern", () => {
    expect(isValidUsername("alice")).toBe(true);
    expect(isValidUsername("a.b_c9")).toBe(true);
  });

  it("rejects what can't be a username", () => {
    expect(isValidUsername("al")).toBe(false);
    expect(isValidUsername("Alice")).toBe(false);
    expect(isValidUsername("a".repeat(31))).toBe(false);
    expect(isValidUsername("al ice")).toBe(false);
    expect(isValidUsername("")).toBe(false);
  });
});

describe("parseProfileTab", () => {
  it("shows Saved only on your own profile", () => {
    expect(parseProfileTab("saved", true)).toBe("saved");
    expect(parseProfileTab("saved", false)).toBe("posts");
  });

  it("defaults to Posts", () => {
    expect(parseProfileTab(null, true)).toBe("posts");
    expect(parseProfileTab("likes", true)).toBe("posts");
  });
});

describe("profileTabHref", () => {
  it("adds the parameter only for Saved", () => {
    expect(profileTabHref("alice", "posts")).toBe("/u/alice");
    expect(profileTabHref("alice", "saved")).toBe("/u/alice?tab=saved");
  });
});
