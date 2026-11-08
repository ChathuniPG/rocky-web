"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { UnreadConversationsCount } from "@/lib/api/types";

import { conversationKeys } from "./conversation-query-keys";
import {
  decrementUnreadConversationCount,
  isConversationUnreadInPages,
  markConversationReadInPages,
  type ConversationPages,
} from "./message-cache";

/**
 * Marks the other participant's messages as read (FR-MSG-05) and clears the
 * conversation's unread badge in the cached list and the navigation count
 * (FR-MSG-06) straight away. It runs on its own, not on a click, so a failure
 * shows no toast: the list and the count just reload and show the real state.
 *
 * The thread also calls it when polling brings in new messages from the other
 * user, so the refresh once it settles keeps the navigation badge current,
 * including unread messages in other conversations.
 */
export function useMarkConversationRead(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.patch("/conversations/{id}/read", { path: { id: conversationId } }),
    onMutate: async () => {
      // An in-flight badge poll would otherwise land after the optimistic
      // update and bring back the old count. A first load has nothing to
      // overwrite and keeps going.
      await queryClient.cancelQueries({
        queryKey: conversationKeys.unreadCount(),
        exact: true,
        predicate: (query) => query.state.data !== undefined,
      });
      const list = queryClient.getQueryData<ConversationPages>(conversationKeys.list());
      // Only a conversation the cache knows as unread lowers the count, so a
      // repeated read can't push it down twice. Without the list (a direct
      // link), the refresh in onSettled corrects the count.
      if (list && isConversationUnreadInPages(list, conversationId)) {
        queryClient.setQueryData<UnreadConversationsCount>(
          conversationKeys.unreadCount(),
          (data) => (data ? decrementUnreadConversationCount(data) : data),
        );
        queryClient.setQueryData<ConversationPages>(conversationKeys.list(), (data) =>
          data ? markConversationReadInPages(data, conversationId) : data,
        );
      }
    },
    onError: () => queryClient.invalidateQueries({ queryKey: conversationKeys.list() }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: conversationKeys.unreadCount(), exact: true }),
  });
}
