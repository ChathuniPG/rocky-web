"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { isSessionExpiredError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import type { UnreadCount } from "@/lib/api/types";

import {
  decrementUnreadCount,
  isUnreadInPages,
  markAllReadInPages,
  markNotificationReadInPages,
  type NotificationPages,
} from "./notification-cache";
import { notificationKeys } from "./notification-query-keys";

/** The cached list and count before an optimistic update, for rolling back. */
type Snapshot = { list: NotificationPages | undefined; unreadCount: UnreadCount | undefined };

async function takeSnapshot(queryClient: QueryClient): Promise<Snapshot> {
  // An in-flight fetch (e.g. the badge's poll) would otherwise land after the
  // optimistic update and bring back the old state. A first load without data
  // has nothing to overwrite and keeps going.
  await queryClient.cancelQueries({
    queryKey: notificationKeys.all,
    predicate: (query) => query.state.data !== undefined,
  });
  return {
    list: queryClient.getQueryData<NotificationPages>(notificationKeys.list()),
    unreadCount: queryClient.getQueryData<UnreadCount>(notificationKeys.unreadCount()),
  };
}

function restoreSnapshot(queryClient: QueryClient, snapshot: Snapshot | undefined): void {
  if (!snapshot) return;
  queryClient.setQueryData(notificationKeys.list(), snapshot.list);
  queryClient.setQueryData(notificationKeys.unreadCount(), snapshot.unreadCount);
}

/** Brings the badge back in line with the server once an action is done. */
function refreshUnreadCount(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
}

/**
 * Marks one notification as read (FR-NOTF-03), optimistically: the item and
 * the badge change at once, and a failure restores both and shows a toast.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.patch("/notifications/{id}/read", { path: { id: notificationId } }),
    onMutate: async (notificationId) => {
      const snapshot = await takeSnapshot(queryClient);
      // Only an item the cache knows as unread lowers the count, so a double
      // click or an already-read item can't push it down twice.
      if (snapshot.list && isUnreadInPages(snapshot.list, notificationId)) {
        queryClient.setQueryData<NotificationPages>(notificationKeys.list(), (data) =>
          data ? markNotificationReadInPages(data, notificationId) : data,
        );
        queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount(), (data) =>
          data ? decrementUnreadCount(data) : data,
        );
      }
      return snapshot;
    },
    onError: (error, _notificationId, snapshot) => {
      restoreSnapshot(queryClient, snapshot);
      if (isSessionExpiredError(error)) return;
      toast.error(t("notifications.toast.markReadFailed"), {
        description: t(mapApiErrorToMessageKey(error)),
      });
    },
    onSettled: () => refreshUnreadCount(queryClient),
  });
}

/**
 * Marks every notification as read (FR-NOTF-03), optimistically, with a toast
 * for the result.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onMutate: async () => {
      const snapshot = await takeSnapshot(queryClient);
      queryClient.setQueryData<NotificationPages>(notificationKeys.list(), (data) =>
        data ? markAllReadInPages(data) : data,
      );
      queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount(), (data) =>
        data ? { count: 0 } : data,
      );
      return snapshot;
    },
    onSuccess: () => {
      toast.success(t("notifications.toast.markAllReadSuccess"));
    },
    onError: (error, _variables, snapshot) => {
      restoreSnapshot(queryClient, snapshot);
      if (isSessionExpiredError(error)) return;
      toast.error(t("notifications.toast.markAllReadFailed"), {
        description: t(mapApiErrorToMessageKey(error)),
      });
    },
    onSettled: () => refreshUnreadCount(queryClient),
  });
}
