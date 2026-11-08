"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import { conversationKeys } from "./conversation-query-keys";

const POLL_INTERVAL_MS = 30_000;

const unreadConversationCountQuery = queryOptions({
  queryKey: conversationKeys.unreadCount(),
  queryFn: ({ signal }) => api.get("/conversations/unread-count", { signal }),
});

/**
 * The number of conversations with unread messages, for the navigation badge
 * (FR-MSG-06). Polls every 30 seconds, but only while the tab is visible, and
 * refetches whenever the window regains focus. Reading a thread updates it
 * immediately (see useMarkConversationRead).
 */
export function useUnreadConversationCount() {
  return useQuery({
    ...unreadConversationCountQuery,
    refetchInterval: POLL_INTERVAL_MS,
    // TanStack's default, stated on purpose: a hidden tab stops polling.
    refetchIntervalInBackground: false,
    // The app-wide 30 s staleTime would otherwise skip the refetch on a quick return.
    refetchOnWindowFocus: "always",
  });
}

/**
 * The badge's current count, read from the cache without fetching or polling
 * of its own: each observer with a `refetchInterval` runs its own timer, so a
 * second polling observer would double the requests. Undefined until the
 * sidebar has loaded it.
 */
export function useCachedUnreadConversationCount(): number | undefined {
  return useQuery({ ...unreadConversationCountQuery, enabled: false }).data?.count;
}
