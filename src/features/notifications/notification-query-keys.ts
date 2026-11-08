/*
 * TanStack Query keys for notifications. Everything lives under
 * ["notifications"], so a mark-read action can cancel or refresh the list and
 * the unread count together.
 */

/** Query keys for notifications. */
export const notificationKeys = {
  /** Prefix of every notification query. */
  all: ["notifications"] as const,
  /** The notifications list (GET /notifications), an infinite query. */
  list: () => ["notifications", "list"] as const,
  /** The unread count behind the navigation badge (GET /notifications/unread-count). */
  unreadCount: () => ["notifications", "unread-count"] as const,
};
