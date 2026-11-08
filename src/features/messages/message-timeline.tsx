"use client";

import { ArrowDownIcon, CircleAlertIcon, MessageCircleIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useFocusHandoff } from "@/hooks/use-focus-handoff";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useTranslations } from "@/i18n/i18n-provider";
import type { Message } from "@/lib/api/types";

import { MessageBubble } from "./message-bubble";
import {
  distanceFromBottom,
  isNearBottom,
  scrollTopKeepingBottomDistance,
} from "./scroll-position";
import type { OutgoingMessage } from "./use-send-message";

type MessageTimelineProps = {
  /** The history in reading order, oldest first. */
  messages: readonly Message[];
  /** The viewer's messages the API hasn't accepted yet, shown after the history. */
  outbox: readonly OutgoingMessage[];
  currentUserId: string;
  otherName: string;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  isLoadOlderError: boolean;
  loadOlder: () => void;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
};

/** The id of the newest message the predicate accepts. */
function lastIdWhere(messages: readonly Message[], predicate: (message: Message) => boolean) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message && predicate(message)) return message.id;
  }
  return null;
}

/** Scrolls an element to its end, smoothly or at once. */
function scrollElementToBottom(element: HTMLElement | null, smooth: boolean): void {
  element?.scrollTo({ top: element.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

/**
 * The scrolling message history of a thread (FR-MSG-02, FR-MSG-04).
 * - Opens at the newest message.
 * - Older messages load as the top nears (or with a button); the content in
 *   view stays where it was while they are added above it.
 * - New messages are followed only when the reader is already at the bottom,
 *   or sent them; otherwise a "New messages" pill appears.
 * - A hidden live region announces messages from the other user as they arrive.
 */
export function MessageTimeline({
  messages,
  outbox,
  currentUserId,
  otherName,
  hasOlder,
  isLoadingOlder,
  isLoadOlderError,
  loadOlder,
  onRetry,
  onDiscard,
}: MessageTimelineProps) {
  const t = useTranslations();
  const prefersReducedMotion = usePrefersReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  const newestId = messages.at(-1)?.id ?? null;
  const oldestId = messages[0]?.id ?? null;
  const newestIsOwn = messages.at(-1)?.senderId === currentUserId;
  const newestOutgoingId = outbox.at(-1)?.clientId ?? null;
  const newestOtherId = lastIdWhere(messages, (message) => message.senderId !== currentUserId);

  // Mirrored in refs for the scroll handler and layout effects, which must not wait for a render.
  const isAtBottomRef = useRef(true);
  const newestIdRef = useRef(newestId);
  const hasScrolledRef = useRef(false);
  // Distance from the bottom saved just before older messages are requested.
  const anchorRef = useRef<number | null>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  // The newest message the reader has seen at the bottom; later ones count as unseen.
  const [lastSeenId, setLastSeenId] = useState(newestId);
  // Only messages that arrive after the thread opened are announced.
  const [initialNewestOtherId] = useState(newestOtherId);

  // Read by the effects below, so a changed preference doesn't re-run them (and scroll).
  const reducedMotionRef = useRef(prefersReducedMotion);
  useLayoutEffect(() => {
    reducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  function scrollToBottom(smooth: boolean) {
    scrollElementToBottom(scrollRef.current, smooth && !reducedMotionRef.current);
  }

  // Older messages were added above: keep the same content in view.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    const saved = anchorRef.current;
    if (!element || saved === null) return;
    anchorRef.current = null;
    element.scrollTop = scrollTopKeepingBottomDistance(saved, element);
  }, [oldestId]);

  // A failed older page leaves nothing to restore.
  useLayoutEffect(() => {
    if (!isLoadingOlder) anchorRef.current = null;
  }, [isLoadingOlder]);

  // First render and newer messages: follow them if the reader is at the bottom or sent them.
  useLayoutEffect(() => {
    newestIdRef.current = newestId;
    const isFirst = !hasScrolledRef.current;
    hasScrolledRef.current = true;
    if (isFirst || isAtBottomRef.current || newestIsOwn) {
      scrollElementToBottom(scrollRef.current, !isFirst && !reducedMotionRef.current);
    }
  }, [newestId, newestIsOwn]);

  // The viewer just wrote something: always show it.
  useLayoutEffect(() => {
    if (newestOutgoingId) scrollElementToBottom(scrollRef.current, !reducedMotionRef.current);
  }, [newestOutgoingId]);

  function handleScroll() {
    const element = scrollRef.current;
    if (!element) return;
    const near = isNearBottom(element);
    // At the bottom, or just leaving it: everything up to now has been seen.
    if (near || isAtBottomRef.current) setLastSeenId(newestIdRef.current);
    isAtBottomRef.current = near;
    setIsAtBottom(near);
  }

  function requestOlder() {
    const element = scrollRef.current;
    if (element) anchorRef.current = distanceFromBottom(element);
    loadOlder();
  }

  const sentinelRef = useInView({
    onEnter: requestOlder,
    rootMargin: "200px 0px",
    enabled: hasOlder && !isLoadingOlder && !isLoadOlderError,
  });
  // When the oldest page arrives the button goes away; keep keyboard focus in the history.
  const loadOlderFocusHandoff = useFocusHandoff(hasOlder, scrollRef);

  const lastSeenIndex = lastSeenId
    ? messages.findIndex((message) => message.id === lastSeenId)
    : -1;
  const unseenCount =
    lastSeenId && lastSeenIndex === -1
      ? 0
      : messages.slice(lastSeenIndex + 1).filter((message) => message.senderId !== currentUserId)
          .length;
  const showPill = !isAtBottom && unseenCount > 0;
  const announcement =
    newestOtherId && newestOtherId !== initialNewestOtherId
      ? t("messages.thread.newMessageFrom", { name: otherName })
      : "";

  const isEmpty = messages.length === 0 && outbox.length === 0;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="region"
        aria-label={t("messages.thread.historyLabel")}
        // Focusable so keyboard users can scroll the history.
        tabIndex={0}
        className="h-full overflow-y-auto overscroll-contain px-1 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {hasOlder ? (
          <div className="flex flex-col items-center gap-2 pb-4">
            <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
            {isLoadOlderError ? (
              <p role="alert" className="flex items-center gap-2 text-sm">
                <CircleAlertIcon aria-hidden="true" className="size-4 text-destructive" />
                {t("list.pageError")}
              </p>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              loading={isLoadingOlder}
              onClick={requestOlder}
              {...loadOlderFocusHandoff}
            >
              {isLoadOlderError ? t("common.retry") : t("messages.thread.loadOlder")}
            </Button>
          </div>
        ) : null}

        {isEmpty ? (
          <EmptyState
            icon={MessageCircleIcon}
            title={t("messages.thread.emptyTitle")}
            description={t("messages.thread.emptyDescription")}
            className="border-none"
          />
        ) : (
          <ol className="flex flex-col gap-3">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <MessageBubble
                  key={message.id}
                  body={message.body}
                  isOwn={isOwn}
                  senderLabel={isOwn ? t("messages.thread.you") : otherName}
                  createdAt={message.createdAt}
                />
              );
            })}
            {outbox.map((entry) => (
              <MessageBubble
                key={entry.clientId}
                body={entry.body}
                isOwn
                senderLabel={t("messages.thread.you")}
                status={entry.status}
                errorKey={entry.errorKey}
                onRetry={() => onRetry(entry.clientId)}
                onDiscard={() => onDiscard(entry.clientId)}
              />
            ))}
          </ol>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {showPill ? (
        <Button
          size="sm"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md"
        >
          <ArrowDownIcon aria-hidden="true" />
          {t("messages.thread.newMessages")}
        </Button>
      ) : null}
    </div>
  );
}
