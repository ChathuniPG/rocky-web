"use client";

import { CircleAlertIcon, Loader2Icon } from "lucide-react";

import { RelativeTime } from "@/components/relative-time";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";
import type { TranslationKey } from "@/i18n/translate";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  body: string;
  /** Sent by the viewer: right-aligned and purple. */
  isOwn: boolean;
  /** Read before the text by screen readers, e.g. "You" or the other user's name. */
  senderLabel: string;
  /** When the server stored it; absent for a message that hasn't been accepted yet. */
  createdAt?: string;
  /** For the viewer's messages that are on their way or failed. */
  status?: "pending" | "failed";
  errorKey?: TranslationKey;
  onRetry?: () => void;
  onDiscard?: () => void;
};

/**
 * One message (FR-MSG-02): the viewer's on the right in purple, the other
 * user's on the left. Plain text only; React escapes it and typed line breaks
 * are kept. A pending message is dimmed with "Sending…"; a failed one says why
 * and offers Retry and Discard (FR-MSG-03).
 */
export function MessageBubble({
  body,
  isOwn,
  senderLabel,
  createdAt,
  status,
  errorKey,
  onRetry,
  onDiscard,
}: MessageBubbleProps) {
  const t = useTranslations();

  return (
    <li
      className={cn(
        "flex max-w-[80%] flex-col gap-1",
        isOwn ? "items-end self-end" : "items-start self-start",
      )}
    >
      <p
        className={cn(
          "rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap",
          isOwn
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-secondary text-secondary-foreground",
          status === "pending" && "opacity-70",
          status === "failed" && "ring-2 ring-destructive ring-offset-2 ring-offset-background",
        )}
      >
        <span className="sr-only">{senderLabel}: </span>
        {body}
      </p>

      {status === "pending" ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2Icon
            aria-hidden="true"
            className="size-3 animate-spin motion-reduce:animate-none"
          />
          {t("messages.thread.sending")}
        </p>
      ) : status === "failed" ? (
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs">
          <p role="alert" className="flex items-center gap-1 text-destructive">
            <CircleAlertIcon aria-hidden="true" className="size-3.5" />
            {t("messages.thread.notSent")}
            {errorKey ? <span className="text-muted-foreground">{t(errorKey)}</span> : null}
          </p>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onRetry}>
            {t("messages.thread.retry")}
          </Button>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={onDiscard}
          >
            {t("messages.thread.discard")}
          </Button>
        </div>
      ) : createdAt ? (
        <RelativeTime dateTime={createdAt} className="px-1" />
      ) : null}
    </li>
  );
}
