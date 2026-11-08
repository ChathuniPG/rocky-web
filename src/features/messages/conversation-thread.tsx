"use client";

import { CircleAlertIcon, MessageCircleOffIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { EmptyState } from "@/components/empty-state";
import { ListRowSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { useEscapeToGoBack, useGoBack } from "@/features/navigation/use-go-back";
import { useTranslations } from "@/i18n/i18n-provider";
import { isApiError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import type { Message } from "@/lib/api/types";

import { chronologicalMessages } from "./message-cache";
import { MessageComposer } from "./message-composer";
import { MessageTimeline } from "./message-timeline";
import { ThreadHeader } from "./thread-header";
import { useConversationSummary } from "./use-conversations";
import { useMarkConversationRead } from "./use-mark-conversation-read";
import { useMessageHistory, useMessagePolling } from "./use-message-history";
import { useSendMessage } from "./use-send-message";

const conversationIdSchema = z.guid();
const SKELETON_ROWS = 4;

// Fills the viewport below the column layout's padding (py-6), so the history
// scrolls on its own and the composer stays at the bottom.
const threadLayoutClasses = "flex h-[calc(100dvh-3rem)] min-h-96 flex-col";

/**
 * A conversation thread (FR-MSG-02..05): header, history and composer. New
 * messages arrive by polling (ADR-008), which pauses while a message is
 * being sent or older messages are loading. The other user's messages are
 * marked as read while the thread is visible. Conversations the viewer has
 * no part in are reported by the API as 404 and shown as not found.
 */
export function ConversationThread({ conversationId }: { conversationId: string }) {
  const t = useTranslations();
  const currentUser = useCurrentUser();
  const goBack = useGoBack("/messages");
  useEscapeToGoBack(goBack);

  const isValidId = conversationIdSchema.safeParse(conversationId).success;
  const history = useMessageHistory(conversationId, isValidId);
  // Looked up only once the API has confirmed the viewer may see this conversation.
  const summary = useConversationSummary(conversationId, history.isSuccess);
  const sender = useSendMessage(conversationId);
  useMessagePolling(
    conversationId,
    history.isSuccess && !sender.isSending && !history.isFetchingNextPage,
  );

  const messages = useMemo(
    () => (history.data ? chronologicalMessages(history.data) : []),
    [history.data],
  );
  useMarkReadWhileVisible(conversationId, messages, currentUser.id);

  const isNotFound = !isValidId || isApiError(history.error, 404) || isApiError(history.error, 400);

  if (isNotFound) {
    return (
      <EmptyState
        icon={MessageCircleOffIcon}
        title={t("messages.thread.notFoundTitle")}
        description={t("messages.thread.notFoundDescription")}
        action={
          <Button asChild>
            <Link href="/messages">{t("messages.thread.backToMessages")}</Link>
          </Button>
        }
      />
    );
  }

  const conversation = summary.data;
  const otherName = conversation?.otherUser.displayName ?? t("pages.conversation.title");

  return (
    <div className={threadLayoutClasses}>
      <ThreadHeader conversation={summary.isError ? null : conversation} />

      {history.isPending ? (
        <div aria-busy="true" className="min-h-0 flex-1 py-4">
          <p role="status" className="sr-only">
            {t("messages.thread.loading")}
          </p>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <ListRowSkeleton key={index} />
          ))}
        </div>
      ) : history.isError && !history.isFetchNextPageError ? (
        <div className="min-h-0 flex-1 py-4">
          <EmptyState
            icon={CircleAlertIcon}
            title={t("messages.thread.errorTitle")}
            description={t(mapApiErrorToMessageKey(history.error))}
            action={
              <Button loading={history.isFetching} onClick={() => void history.refetch()}>
                {t("common.retry")}
              </Button>
            }
          />
        </div>
      ) : (
        <MessageTimeline
          messages={messages}
          outbox={sender.outbox}
          currentUserId={currentUser.id}
          otherName={otherName}
          hasOlder={history.hasNextPage}
          isLoadingOlder={history.isFetchingNextPage}
          isLoadOlderError={history.isFetchNextPageError}
          loadOlder={() => void history.fetchNextPage({ cancelRefetch: false })}
          onRetry={sender.retry}
          onDiscard={sender.discard}
        />
      )}

      <MessageComposer onSend={sender.send} />
    </div>
  );
}

/**
 * Marks the conversation as read when it opens with unread messages from the
 * other user, and again whenever new ones arrive (FR-MSG-05), but only while
 * the tab is visible; a hidden tab waits until it is shown again.
 */
function useMarkReadWhileVisible(
  conversationId: string,
  messages: readonly Message[],
  currentUserId: string,
) {
  const { mutate: markRead } = useMarkConversationRead(conversationId);
  // The newest unread message already reported, so re-renders and effect
  // re-runs (StrictMode, Activity) don't send the same request again.
  const markedUpToRef = useRef<string | null>(null);

  let newestUnreadId: string | null = null;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message && message.senderId !== currentUserId && message.readAt === null) {
      newestUnreadId = message.id;
      break;
    }
  }

  useEffect(() => {
    if (!newestUnreadId || markedUpToRef.current === newestUnreadId) return;
    const target = newestUnreadId;

    function markIfVisible(): boolean {
      if (document.visibilityState !== "visible") return false;
      markedUpToRef.current = target;
      markRead();
      return true;
    }

    if (markIfVisible()) return;
    const onVisibilityChange = () => {
      if (markIfVisible()) document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [newestUnreadId, markRead]);
}
