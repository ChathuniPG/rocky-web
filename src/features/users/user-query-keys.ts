/*
 * TanStack Query keys for user data. Every query that holds users (search
 * pages, profiles) lives under ["users"], so one cache update (user-cache.ts)
 * reaches every copy of a user. Profiles and searches get their own segment so
 * a username can never collide with the search key.
 */

/** Which users a search covers (GET /users/search `filter`, FR-SRCH-03). */
export type UserSearchFilter = "all" | "following";

/** Query keys for users. */
export const userKeys = {
  /** Prefix of every query whose data is a user, a profile or pages of users. */
  all: ["users"] as const,
  /** A user's public profile (GET /users/{username}). */
  profile: (username: string) => ["users", "profile", username] as const,
  /** Prefix of every search query. */
  searches: () => ["users", "search"] as const,
  /** One search (GET /users/search), an infinite query. */
  search: (query: string, filter: UserSearchFilter) => ["users", "search", query, filter] as const,
};
