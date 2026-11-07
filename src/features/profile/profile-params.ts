import { profileHref } from "@/features/navigation/nav-items";

/*
 * The profile's tab lives in the URL (?tab=saved), so reload, Back and a shared
 * link keep it (FR-PROF-02, FR-PROF-03). Pure helpers, unit-tested.
 */

/** A tab of the profile page. */
export type ProfileTab = "posts" | "saved";

// The API's username pattern (GET /users/{username}); anything else can't exist.
const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

/** Whether a route parameter can be a username, so the API isn't asked about one that can't. */
export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

/**
 * The tab to show. Saved is the owner's alone (FR-PROF-03): on someone else's
 * profile, `?tab=saved` falls back to Posts. Unknown values mean Posts too.
 */
export function parseProfileTab(value: string | null, isOwnProfile: boolean): ProfileTab {
  return value === "saved" && isOwnProfile ? "saved" : "posts";
}

/** URL of a profile tab; Posts is the default and gets no parameter. */
export function profileTabHref(username: string, tab: ProfileTab): string {
  const base = profileHref(username);
  return tab === "saved" ? `${base}?tab=saved` : base;
}
