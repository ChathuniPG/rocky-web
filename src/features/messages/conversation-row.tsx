"use client";

import Link from "next/link";

import { RelativeTime } from "@/components/relative-time";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { useTranslations } from "@/i18n/i18n-provider";
import type { Conversation } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { conversationHref } from "./conversation-query-keys";

/**
 * One conversation in the list (FR-MSG-01): the other participant, a preview
 * of the last message ("You: …" for your own), and when it was sent. Unread
 * conversations (FR-MSG-05) show an orange count badge, heavier text and a
 * hidden "{count} unread messages", so colour is never the only signal.
 */
export function ConversationRow({ conversation }: { conversation: Conversation }) {
  const t = useTranslations();
  const currentUser = useCurrentUser();
  const { otherUser, lastMessage, unreadCount } = conversation;
  const isUnread = unreadCount > 0;

  const preview = lastMessage
    ? lastMessage.senderId === currentUser.id
      ? t("messages.list.ownPreview", { body: lastMessage.body })
      : lastMessage.body
    : t("messages.list.noMessages");

  return (
    <Link
      href={conversationHref(conversation.id)}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 transition-colors outline-none",
        "hover:bg-accent active:bg-[color-mix(in_oklab,var(--accent),var(--foreground)_6%)]",
        "focus-visible:ring-3 focus-visible:ring-ring",
      )}
    >
      {/* The name follows as text; the avatar would only repeat it. */}
      <span aria-hidden="true" className="shrink-0">
        <UserAvatar name={otherUser.displayName} src={otherUser.avatarUrl} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("truncate text-sm", isUnread ? "font-bold" : "font-semibold")}>
            {otherUser.displayName}
          </span>
          <RelativeTime dateTime={conversation.lastMessageAt} className="ml-auto shrink-0" />
        </span>
        <span
          className={cn(
            "block truncate text-sm",
            isUnread ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {preview}
        </span>
      </span>

      {isUnread ? (
        <>
          <Badge variant="highlight" aria-hidden="true" className="shrink-0 tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
          <span className="sr-only">{t("messages.list.unread", { count: unreadCount })}</span>
        </>
      ) : null}
    </Link>
  );
}
