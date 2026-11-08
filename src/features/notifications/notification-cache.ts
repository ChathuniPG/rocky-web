import type { InfiniteData } from "@tanstack/react-query";

import type { NotificationPage, UnreadCount } from "@/lib/api/types";

/*
 * Pure updates of cached notification data for optimistic mark-read actions
 * (FR-NOTF-03). Each returns the same reference when nothing changes, so
 * TanStack Query doesn't re-render components for a no-op.
 */

/** The cached data of the infinite notifications list. */
export type NotificationPages = InfiniteData<NotificationPage, unknown>;

/** Marks one notification as read in every page that holds it. */
export function markNotificationReadInPages(
  data: NotificationPages,
  notificationId: string,
): NotificationPages {
  let changed = false;
  const pages = data.pages.map((page) => {
    if (!page.items.some((item) => item.id === notificationId && !item.isRead)) return page;
    changed = true;
    return {
      ...page,
      items: page.items.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    };
  });
  return changed ? { ...data, pages } : data;
}

/** Marks every cached notification as read. */
export function markAllReadInPages(data: NotificationPages): NotificationPages {
  let changed = false;
  const pages = data.pages.map((page) => {
    if (page.items.every((item) => item.isRead)) return page;
    changed = true;
    return { ...page, items: page.items.map((item) => ({ ...item, isRead: true })) };
  });
  return changed ? { ...data, pages } : data;
}

/** Whether the cached list holds the notification and it is still unread. */
export function isUnreadInPages(data: NotificationPages, notificationId: string): boolean {
  return data.pages.some((page) =>
    page.items.some((item) => item.id === notificationId && !item.isRead),
  );
}

/** Lowers the unread count by `amount`, never below zero. */
export function decrementUnreadCount(data: UnreadCount, amount = 1): UnreadCount {
  const count = Math.max(0, data.count - amount);
  return count === data.count ? data : { count };
}
