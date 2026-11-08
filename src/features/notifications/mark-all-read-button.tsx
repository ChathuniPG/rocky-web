"use client";

import { CheckCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";

import { useMarkAllNotificationsRead } from "./use-mark-notifications-read";
import { useNotifications } from "./use-notifications";
import { useUnreadNotificationCount } from "./use-unread-notification-count";

/**
 * "Mark all as read" (FR-NOTF-03). Disabled while nothing is unread, either by
 * the badge's count or by the list on screen.
 */
export function MarkAllReadButton() {
  const t = useTranslations();
  const unreadCount = useUnreadNotificationCount();
  // Shares the list's cache entry, so this adds no request.
  const notifications = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  // The count is polled, so a notification can show up in the list before the
  // count catches up; either source is enough to enable the button.
  const hasUnread =
    (unreadCount.data?.count ?? 0) > 0 ||
    (notifications.data?.pages.some((page) => page.items.some((item) => !item.isRead)) ?? false);

  return (
    <Button
      variant="outline"
      size="sm"
      loading={markAllRead.isPending}
      disabled={!hasUnread}
      // It disables itself once everything is read; focus stays on it (WCAG 2.4.3).
      focusableWhenDisabled
      onClick={() => markAllRead.mutate()}
      // The label may wrap (long in Sinhala) instead of overflowing narrow screens (WCAG 1.4.10).
      className="h-auto min-h-8 min-w-0 shrink py-1 text-left whitespace-normal"
    >
      <CheckCheckIcon aria-hidden="true" />
      {t("notifications.markAllRead")}
    </Button>
  );
}
