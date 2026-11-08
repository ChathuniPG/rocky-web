"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useTranslations } from "@/i18n/i18n-provider";
import type { TranslationKey } from "@/i18n/translate";
import { api } from "@/lib/api/client";
import { isSessionExpiredError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

import { conversationKeys } from "./conversation-query-keys";
import {
  applyLastMessageToPages,
  mergeNewMessages,
  type ConversationPages,
  type MessagePages,
} from "./message-cache";

/** A message the API hasn't accepted yet: on its way, or failed and waiting for a retry. */
export type OutgoingMessage = {
  /** Local id until the API assigns the real one. */
  clientId: string;
  body: string;
  status: "pending" | "failed";
  /** Why it failed, as a translation key. */
  errorKey?: TranslationKey;
};

type SendVariables = { clientId: string; body: string };

// Only needs to be unique within the page; crypto.randomUUID would need a secure context.
let nextClientId = 0;

/**
 * Sends messages optimistically (FR-MSG-03). Each one appears at once as
 * "Sending…"; on success it is replaced by the server's message (in the
 * history and as the list's last message), on failure it stays as "Not sent"
 * with Retry and Discard. Sends share a scope, so they reach the API in the
 * order they were written.
 *
 * Outgoing messages are local state on purpose: they are not server data yet.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [outbox, setOutbox] = useState<OutgoingMessage[]>([]);

  const mutation = useMutation({
    scope: { id: `send-message:${conversationId}` },
    mutationFn: ({ body }: SendVariables) =>
      api.post("/conversations/{id}/messages", { path: { id: conversationId }, body: { body } }),
    onMutate: async () => {
      // A poll that is already running could return this message before the send
      // resolves; it would then show twice for a moment (once as "Sending…").
      await queryClient.cancelQueries({ queryKey: conversationKeys.poll(conversationId) });
    },
    onSuccess: (message, { clientId }) => {
      queryClient.setQueryData<MessagePages>(conversationKeys.messages(conversationId), (data) =>
        data ? mergeNewMessages(data, [message]) : data,
      );
      queryClient.setQueryData<ConversationPages>(conversationKeys.list(), (data) =>
        data ? applyLastMessageToPages(data, message) : data,
      );
      setOutbox((entries) => entries.filter((entry) => entry.clientId !== clientId));
    },
    onError: (error, { clientId }) => {
      const errorKey = mapApiErrorToMessageKey(error);
      setOutbox((entries) =>
        entries.map((entry) =>
          entry.clientId === clientId ? { ...entry, status: "failed", errorKey } : entry,
        ),
      );
      if (isSessionExpiredError(error)) return;
      toast.error(t("messages.thread.sendFailed"), { description: t(errorKey) });
    },
  });

  const { mutate } = mutation;

  const send = useCallback(
    (body: string) => {
      nextClientId += 1;
      const clientId = `outgoing-${nextClientId}`;
      setOutbox((entries) => [...entries, { clientId, body, status: "pending" }]);
      mutate({ clientId, body });
    },
    [mutate],
  );

  const retry = useCallback(
    (clientId: string) => {
      const entry = outbox.find((item) => item.clientId === clientId);
      if (!entry || entry.status !== "failed") return;
      // Moved to the end: it is now the newest thing the user sent.
      setOutbox((entries) => [
        ...entries.filter((item) => item.clientId !== clientId),
        { clientId, body: entry.body, status: "pending" },
      ]);
      mutate({ clientId, body: entry.body });
    },
    [mutate, outbox],
  );

  const discard = useCallback((clientId: string) => {
    setOutbox((entries) => entries.filter((entry) => entry.clientId !== clientId));
  }, []);

  return {
    outbox,
    send,
    retry,
    discard,
    /** True while any message is on its way; polling pauses meanwhile. */
    isSending: outbox.some((entry) => entry.status === "pending"),
  };
}
