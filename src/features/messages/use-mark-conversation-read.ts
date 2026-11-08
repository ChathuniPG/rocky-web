"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import { conversationKeys } from "./conversation-query-keys";
import { markConversationReadInPages, type ConversationPages } from "./message-cache";

/**
 * Marks the other participant's messages as read (FR-MSG-05) and clears the
 * conversation's unread badge in the cached list straight away. It runs on its
 * own, not on a click, so a failure shows no toast: the list just reloads and
 * shows the real count.
 */
export function useMarkConversationRead(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.patch("/conversations/{id}/read", { path: { id: conversationId } }),
    onMutate: () => {
      queryClient.setQueryData<ConversationPages>(conversationKeys.list(), (data) =>
        data ? markConversationReadInPages(data, conversationId) : data,
      );
    },
    onError: () => queryClient.invalidateQueries({ queryKey: conversationKeys.list() }),
  });
}
