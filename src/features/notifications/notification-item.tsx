"use client";

import Link from "next/link";

import { RelativeTime } from "@/components/relative-time";
import { UserAvatar } from "@/components/user-avatar";
import { PostThumbnail } from "@/features/posts/post-thumbnail";
import { useTranslations } from "@/i18n/i18n-provider";
import { RichText } from "@/i18n/rich-text";
import type { Notification } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { notificationHref, notificationMessageKey } from "./notification-content";
import { useMarkNotificationRead } from "./use-mark-notifications-read";

const THUMBNAIL_SIZES = "48px";

/**
 * One notification (FR-NOTF-02): the actor, a sentence for its type, the time
 * and, for likes and comments, a thumbnail of the post. The whole row is a
 * link to the post or profile; following it marks the notification as read
 * (FR-NOTF-03). The mutation lives in the query client, so leaving the page
 * doesn't cancel it. Unread rows differ by a tint, a dot, heavier text and a
 * hidden "Unread" label, so colour is never the only signal (WCAG 1.4.1).
 */
export function NotificationItem({ notification }: { notification: Notification }) {
  const t = useTranslations();
  const markRead = useMarkNotificationRead();
  const { actor, post, comment, isRead } = notification;

  return (
    <Link
      href={notificationHref(notification)}
      onClick={() => {
        if (!isRead) markRead.mutate(notification.id);
      }}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 transition-colors outline-none",
        "hover:bg-accent active:bg-[color-mix(in_oklab,var(--accent),var(--foreground)_6%)]",
        "focus-visible:ring-3 focus-visible:ring-ring",
        !isRead && "bg-secondary/60",
      )}
    >
      {/* The sentence names the actor; the avatar would only repeat it. */}
      <span aria-hidden="true" className="shrink-0">
        <UserAvatar name={actor.displayName} src={actor.avatarUrl} />
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm break-words", !isRead && "font-medium")}>
          {isRead ? null : <span className="sr-only">{t("notifications.unread")}: </span>}
          <RichText
            template={t(notificationMessageKey(notification.type))}
            values={{ name: <strong className="font-semibold">{actor.displayName}</strong> }}
          />
        </span>
        {comment ? (
          // Plain text: React escapes it. Clamped so a long comment can't stretch the row.
          <span className="mt-0.5 line-clamp-2 block text-sm break-words text-muted-foreground">
            “{comment.body}”
          </span>
        ) : null}
        <RelativeTime dateTime={notification.createdAt} className="mt-0.5 block" />
      </span>

      {isRead ? null : (
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-highlight" />
      )}

      {post && notification.type !== "FOLLOW" ? (
        <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
          <PostThumbnail
            mediaUrl={post.mediaUrl}
            mediaType={post.mediaType}
            sizes={THUMBNAIL_SIZES}
          />
        </span>
      ) : null}
    </Link>
  );
}
