"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { api } from "@/lib/api/client";
import type { Conversation } from "@/lib/api/types";

import { conversationKeys } from "./conversation-query-keys";
import { findConversationInPages, withPendingReads, type ConversationPages } from "./message-cache";
import { pendingReadConversationIds } from "./use-mark-conversation-read";
import { useCachedUnreadConversationCount } from "./use-unread-conversation-count";

// The API's maximum page size; a direct load looks for the conversation in as few requests as possible.
const LOOKUP_PAGE_SIZE = 50;

const LIST_POLL_INTERVAL_MS = 15_000;

/**
 * Infinite query over GET /conversations, latest activity first (FR-MSG-01),
 * paged with the API's cursor (ADR-005). While the list is on screen it polls
 * every 15 seconds and on focus, so new messages update previews, times and
 * unread badges without a reload (FR-MSG-04, FR-MSG-05). The poll belongs to
 * this observer: it stops when the tab is hidden and when Next.js hides the
 * page (React Activity unsubscribes the query).
 *
 * A refetch of an infinite query reloads every loaded page, one request each,
 * starting again from the first. That is acceptable here: most inboxes fit on
 * the first page, so a poll is usually one request. A future optimisation is
 * to poll only the first page and merge it into the cache, since new activity
 * always moves a conversation to the top.
 */
export function useConversations() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: conversationKeys.list(),
    queryFn: async ({ pageParam, signal }) => {
      // Reads pending when the request starts or when it ends: either way the
      // server may have built the page before the read landed.
      const pendingAtStart = pendingReadConversationIds(queryClient);
      const page = await api.get("/conversations", { query: { cursor: pageParam }, signal });
      const pending = new Set([...pendingAtStart, ...pendingReadConversationIds(queryClient)]);
      return withPendingReads(page, pending);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: LIST_POLL_INTERVAL_MS,
    // TanStack's default, stated on purpose: a hidden tab stops polling.
    refetchIntervalInBackground: false,
    // The app-wide 30 s staleTime would otherwise skip the refetch on a quick return.
    refetchOnWindowFocus: "always",
  });

  useRefetchOnUnreadCountChange();
  return query;
}

/**
 * Refetches the list when the navigation badge's count changes (FR-MSG-06),
 * so the badge and the list can't disagree for long. `cancelRefetch: false`
 * lets a running fetch (such as loading an older page) finish instead.
 */
function useRefetchOnUnreadCountChange() {
  const queryClient = useQueryClient();
  const count = useCachedUnreadConversationCount();
  const previousCountRef = useRef(count);

  useEffect(() => {
    const previous = previousCountRef.current;
    previousCountRef.current = count;
    if (previous === undefined || count === undefined || previous === count) return;
    void queryClient.refetchQueries(
      { queryKey: conversationKeys.list(), exact: true, type: "active" },
      { cancelRefetch: false },
    );
  }, [count, queryClient]);
}

/** Pages through GET /conversations until the conversation turns up; null if it never does. */
async function lookUpConversation(
  conversationId: string,
  signal: AbortSignal,
): Promise<Conversation | null> {
  let cursor: string | undefined;
  do {
    const page = await api.get("/conversations", {
      query: { cursor, limit: LOOKUP_PAGE_SIZE },
      signal,
    });
    const match = page.items.find((conversation) => conversation.id === conversationId);
    if (match) return match;
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return null;
}

/**
 * The conversation behind a thread, for its header: the other participant.
 * The API has no endpoint for one conversation, so it comes from the cached
 * list, or from the Message button that opened it, and only on a direct load
 * from paging through the list. The other participant never changes, so the
 * answer is kept for the session.
 */
export function useConversationSummary(conversationId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: conversationKeys.summary(conversationId),
    queryFn: ({ signal }) => lookUpConversation(conversationId, signal),
    initialData: () => {
      const list = queryClient.getQueryData<ConversationPages>(conversationKeys.list());
      return list ? findConversationInPages(list, conversationId) : undefined;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled,
  });
}
