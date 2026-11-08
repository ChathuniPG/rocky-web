"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { Conversation } from "@/lib/api/types";

import { conversationKeys } from "./conversation-query-keys";
import { findConversationInPages, type ConversationPages } from "./message-cache";

// The API's maximum page size; a direct load looks for the conversation in as few requests as possible.
const LOOKUP_PAGE_SIZE = 50;

/**
 * Infinite query over GET /conversations, latest activity first (FR-MSG-01),
 * paged with the API's cursor (ADR-005).
 */
export function useConversations() {
  return useInfiniteQuery({
    queryKey: conversationKeys.list(),
    queryFn: ({ pageParam, signal }) =>
      api.get("/conversations", { query: { cursor: pageParam }, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
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
