"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import { notificationKeys } from "./notification-query-keys";

/**
 * Infinite query over GET /notifications, newest first (FR-NOTF-02), paged
 * with the API's cursor (ADR-005).
 */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam, signal }) =>
      api.get("/notifications", { query: { cursor: pageParam }, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
