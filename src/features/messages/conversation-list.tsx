"use client";

import { CircleAlertIcon, MessagesSquareIcon, SearchIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { InfiniteListFooter } from "@/components/infinite-list-footer";
import { ListRowSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

import { ConversationRow } from "./conversation-row";
import { useConversations } from "./use-conversations";

const SKELETON_ROWS = 6;

/**
 * The conversation list, latest activity first (FR-MSG-01), with skeleton,
 * error and empty states (FR-UI-03, FR-UI-04). More pages load as the end nears.
 */
export function ConversationList() {
  const t = useTranslations();
  const query = useConversations();
  const conversations = query.data?.pages.flatMap((page) => page.items) ?? [];

  if (query.isPending) {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {t("messages.list.loading")}
        </p>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <ListRowSkeleton key={index} className="px-3" />
        ))}
      </div>
    );
  }

  if (query.isError && !query.isFetchNextPageError) {
    return (
      <EmptyState
        icon={CircleAlertIcon}
        title={t("messages.list.errorTitle")}
        description={t(mapApiErrorToMessageKey(query.error))}
        action={
          <Button loading={query.isFetching} onClick={() => void query.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessagesSquareIcon}
        title={t("messages.list.emptyTitle")}
        description={t("messages.list.emptyDescription")}
        action={
          <Button asChild>
            <Link href="/search">
              <SearchIcon aria-hidden="true" />
              {t("messages.list.findPeople")}
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <section aria-label={t("messages.list.label")}>
      <ul className="flex flex-col gap-1">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationRow conversation={conversation} />
          </li>
        ))}
      </ul>
      <InfiniteListFooter
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        isFetchNextPageError={query.isFetchNextPageError}
        fetchNextPage={() => void query.fetchNextPage({ cancelRefetch: false })}
        loadMoreLabel={t("messages.list.loadMore")}
      />
    </section>
  );
}
