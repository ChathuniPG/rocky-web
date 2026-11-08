import { profileHref } from "@/features/navigation/nav-items";
import { postHref } from "@/features/posts/share-post";
import type { TranslationKey } from "@/i18n/translate";
import type { Notification, NotificationType } from "@/lib/api/types";

const messageKeys: Record<NotificationType, TranslationKey> = {
  LIKE: "notifications.item.like",
  COMMENT: "notifications.item.comment",
  FOLLOW: "notifications.item.follow",
};

/**
 * Where a notification leads (FR-NOTF-03): the post for a like or comment,
 * the actor's profile for a follow, or for any notification without a post.
 */
export function notificationHref(notification: Notification): string {
  if (notification.type !== "FOLLOW" && notification.post) {
    return postHref(notification.post.id);
  }
  return profileHref(notification.actor.username);
}

/** The translation key of a notification's sentence; its `{name}` token is the actor. */
export function notificationMessageKey(type: NotificationType): TranslationKey {
  return messageKeys[type];
}
