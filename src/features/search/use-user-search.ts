"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { userKeys, type UserSearchFilter } from "@/features/users/user-query-keys";
import { api } from "@/lib/api/client";

/**
 * Infinite query over GET /users/search (FR-SRCH-01, FR-SRCH-03). The API
 * orders by username and pages with a username key cursor (ADR-005). Disabled
 * until there is something to search for. While a new query loads, the
 * previous results stay on screen (marked as placeholder data) instead of
 * flashing a skeleton on every pause in typing.
 */
export function useUserSearch(query: string, filter: UserSearchFilter) {
  return useInfiniteQuery({
    queryKey: userKeys.search(query, filter),
    queryFn: ({ pageParam, signal }) =>
      api.get("/users/search", { query: { q: query, filter, cursor: pageParam }, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: query !== "",
    placeholderData: keepPreviousData,
  });
}
