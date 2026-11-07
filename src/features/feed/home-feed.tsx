"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CircleAlertIcon, HouseIcon, RefreshCwIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { InfiniteListFooter } from "@/components/infinite-list-footer";
import { PageHeader } from "@/components/page-header";
import { PostCardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/features/posts/post-card";
import { postKeys } from "@/features/posts/post-query-keys";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import { cn } from "@/lib/utils";

const SKELETON_COUNT = 3;

/** Infinite query over GET /posts/feed, newest first (FR-FEED-01, ADR-005). */
function useFeedQuery() {
  return useInfiniteQuery({
    queryKey: postKeys.feed(),
    queryFn: ({ pageParam, signal }) =>
      api.get("/posts/feed", { query: { cursor: pageParam }, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * The Home feed (FR-FEED-01 to FR-FEED-08): posts newest first, more loading as
 * the user scrolls, and a manual refresh. A client component because it reads
 * the session-scoped feed in the browser (ADR-013) and reacts to scrolling.
 */
export function HomeFeed() {
  const t = useTranslations();
  const feed = useFeedQuery();
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];
  // A background refetch (refresh button, tab focus) – not the first load or the next page.
  const isRefreshing = feed.isRefetching && !feed.isFetchingNextPage;

  return (
    <>
      <PageHeader
        title={t("pages.home.title")}
        actions={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("feed.refresh")}
            disabled={feed.isPending}
            aria-busy={isRefreshing || undefined}
            onClick={() => void feed.refetch()}
          >
            <RefreshCwIcon aria-hidden="true" className={cn(isRefreshing && "animate-spin")} />
          </Button>
        }
      />

      {feed.isPending ? (
        <div aria-busy="true" className="space-y-4">
          <p role="status" className="sr-only">
            {t("feed.loading")}
          </p>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <PostCardSkeleton key={index} />
          ))}
        </div>
      ) : feed.isError ? (
        <EmptyState
          icon={CircleAlertIcon}
          title={t("feed.errorTitle")}
          description={t(mapApiErrorToMessageKey(feed.error))}
          action={
            <Button loading={feed.isFetching} onClick={() => void feed.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={HouseIcon}
          title={t("pages.home.emptyTitle")}
          description={t("pages.home.emptyDescription")}
        />
      ) : (
        <section aria-label={t("feed.label")}>
          <ul className="space-y-4">
            {posts.map((post, index) => (
              <li key={post.id}>
                <PostCard post={post} eagerMedia={index === 0} />
              </li>
            ))}
          </ul>
          <InfiniteListFooter
            hasNextPage={feed.hasNextPage}
            isFetchingNextPage={feed.isFetchingNextPage}
            isFetchNextPageError={feed.isFetchNextPageError}
            // cancelRefetch: false joins a fetch already running (e.g. a refresh) instead of aborting it.
            fetchNextPage={() => void feed.fetchNextPage({ cancelRefetch: false })}
            loadMoreLabel={t("feed.loadMore")}
            endLabel={t("feed.end")}
          />
        </section>
      )}
    </>
  );
}
