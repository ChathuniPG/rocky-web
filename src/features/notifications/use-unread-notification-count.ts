"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import { notificationKeys } from "./notification-query-keys";

const POLL_INTERVAL_MS = 30_000;

/**
 * The unread notification count for the navigation badge (FR-NOTF-04). Polls
 * every 30 seconds, but only while the tab is visible, and refetches whenever
 * the window regains focus. Mark-read actions update it immediately.
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => api.get("/notifications/unread-count", { signal }),
    refetchInterval: POLL_INTERVAL_MS,
    // TanStack's default, stated on purpose: a hidden tab stops polling.
    refetchIntervalInBackground: false,
    // The app-wide 30 s staleTime would otherwise skip the refetch on a quick return.
    refetchOnWindowFocus: "always",
  });
}
