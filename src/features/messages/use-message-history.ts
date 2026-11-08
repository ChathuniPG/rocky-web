"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import { conversationKeys } from "./conversation-query-keys";
import { mergeNewMessages, newestMessageId, type MessagePages } from "./message-cache";

const POLL_INTERVAL_MS = 4_000;
// The API's maximum; a poll that comes back full asks again straight away.
const POLL_PAGE_SIZE = 50;
// Caps one poll's catch-up rounds (250 messages); the next interval continues.
const MAX_POLL_ROUNDS = 5;

/**
 * A thread's history (FR-MSG-02): GET /conversations/{id}/messages, newest
 * page first; the next page holds older messages. It is never refetched as a
 * whole: polling and sending merge new messages into it, and a full refetch
 * would throw those away and jump the scroll position.
 */
export function useMessageHistory(conversationId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: ({ pageParam, signal }) =>
      api.get("/conversations/{id}/messages", {
        path: { id: conversationId },
        query: { cursor: pageParam },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled,
  });
}

/**
 * Polls for new messages every 4 seconds while the thread is open and the tab
 * is visible (FR-MSG-04, ADR-008), using `after=<newest cached id>`, and merges
 * them into the history. It stops when the tab is hidden and when the page is
 * left (Next.js hides the page, which unsubscribes the query). Callers pause it
 * while a send or an older page is loading.
 *
 * Should a history page and a poll still overlap, the page can overwrite the
 * merged messages; the newest id then goes back, and the next poll fetches
 * them again, so nothing is lost.
 */
export function useMessagePolling(conversationId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const historyKey = conversationKeys.messages(conversationId);

  return useQuery({
    queryKey: conversationKeys.poll(conversationId),
    queryFn: async ({ signal }) => {
      let received = 0;
      for (let round = 0; round < MAX_POLL_ROUNDS; round += 1) {
        const history = queryClient.getQueryData<MessagePages>(historyKey);
        const after = history ? newestMessageId(history) : undefined;
        // An empty conversation has no id to poll after: read its newest page instead.
        const page = await api.get("/conversations/{id}/messages", {
          path: { id: conversationId },
          query: after ? { after, limit: POLL_PAGE_SIZE } : { limit: POLL_PAGE_SIZE },
          signal,
        });
        const oldestFirst = after ? page.items : [...page.items].reverse();
        queryClient.setQueryData<MessagePages>(historyKey, (data) =>
          data ? mergeNewMessages(data, oldestFirst) : data,
        );
        received += page.items.length;
        if (!after || page.items.length < POLL_PAGE_SIZE) break;
      }
      return { received };
    },
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
    // TanStack's default, stated on purpose: a hidden tab stops polling (ADR-008).
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    staleTime: 0,
    // The next interval is the retry.
    retry: false,
  });
}
