"use client";

import { BellIcon, CircleAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { InfiniteListFooter } from "@/components/infinite-list-footer";
import { ListRowSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

import { NotificationItem } from "./notification-item";
import { useNotifications } from "./use-notifications";

const SKELETON_ROWS = 6;

/**
 * The notifications list, newest first (FR-NOTF-02), with skeleton, error and
 * empty states (FR-UI-03, FR-UI-04). More pages load as the end nears.
 */
export function NotificationList() {
  const t = useTranslations();
  const query = useNotifications();
  const notifications = query.data?.pages.flatMap((page) => page.items) ?? [];

  if (query.isPending) {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {t("notifications.loading")}
        </p>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <ListRowSkeleton key={index} withTrailing className="px-3" />
        ))}
      </div>
    );
  }

  if (query.isError && !query.isFetchNextPageError) {
    return (
      <EmptyState
        icon={CircleAlertIcon}
        title={t("notifications.errorTitle")}
        description={t(mapApiErrorToMessageKey(query.error))}
        action={
          <Button loading={query.isFetching} onClick={() => void query.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={BellIcon}
        title={t("notifications.empty.title")}
        description={t("notifications.empty.description")}
      />
    );
  }

  return (
    <section aria-label={t("notifications.listLabel")}>
      <ul className="flex flex-col gap-1">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <NotificationItem notification={notification} />
          </li>
        ))}
      </ul>
      <InfiniteListFooter
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        isFetchNextPageError={query.isFetchNextPageError}
        fetchNextPage={() => void query.fetchNextPage({ cancelRefetch: false })}
        loadMoreLabel={t("notifications.loadMore")}
        endLabel={t("notifications.end")}
      />
    </section>
  );
}
