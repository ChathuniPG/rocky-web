import type { UserSearchFilter } from "@/features/users/user-query-keys";

/*
 * The search page keeps its state in the URL (?q=…&filter=following), so a
 * reload, Back and Forward and a shared link all restore it (FR-SRCH-01..03).
 * These helpers are pure so the parsing rules are unit-tested.
 */

/** Longest query GET /users/search accepts. */
export const SEARCH_QUERY_MAX_LENGTH = 50;

/** The search state read from the URL. */
export type SearchState = { query: string; filter: UserSearchFilter };

/** Minimal read access to URL search params (URLSearchParams and Next's ReadonlyURLSearchParams). */
type SearchParamsReader = { get: (name: string) => string | null };

/** Any filter other than "following" (missing, mistyped, edited by hand) means all users. */
export function parseSearchFilter(value: string | null): UserSearchFilter {
  return value === "following" ? "following" : "all";
}

/** Reads the query (as typed, not trimmed) and the filter from the URL. */
export function readSearchState(params: SearchParamsReader): SearchState {
  return {
    query: (params.get("q") ?? "").slice(0, SEARCH_QUERY_MAX_LENGTH),
    filter: parseSearchFilter(params.get("filter")),
  };
}

/** The query as sent to the API: trimmed, so spaces alone don't search. */
export function normalizeSearchQuery(query: string): string {
  return query.trim();
}

/**
 * Builds the search page URL. Defaults are left out, so the bare /search is the
 * initial state and the URL stays short.
 */
export function buildSearchHref({ query, filter }: SearchState): string {
  const params = new URLSearchParams();
  const trimmed = normalizeSearchQuery(query);
  if (trimmed !== "") params.set("q", trimmed);
  if (filter !== "all") params.set("filter", filter);
  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}
