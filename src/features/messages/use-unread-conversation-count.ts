"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import { conversationKeys } from "./conversation-query-keys";

const POLL_INTERVAL_MS = 30_000;

/**
 * The number of conversations with unread messages, for the navigation badge
 * (FR-MSG-06). Polls every 30 seconds, but only while the tab is visible, and
 * refetches whenever the window regains focus. Reading a thread updates it
 * immediately (see useMarkConversationRead).
 */
export function useUnreadConversationCount() {
  return useQuery({
    queryKey: conversationKeys.unreadCount(),
    queryFn: ({ signal }) => api.get("/conversations/unread-count", { signal }),
    refetchInterval: POLL_INTERVAL_MS,
    // TanStack's default, stated on purpose: a hidden tab stops polling.
    refetchIntervalInBackground: false,
    // The app-wide 30 s staleTime would otherwise skip the refetch on a quick return.
    refetchOnWindowFocus: "always",
  });
}
