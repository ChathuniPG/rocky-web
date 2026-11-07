"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CircleAlertIcon, HouseIcon, RefreshCwIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { InfiniteListFooter } from "@/components/infinite-list-footer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { postKeys } from "@/features/posts/post-query-keys";
import { useFeedScrollSnap } from "@/hooks/use-feed-scroll-snap";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import { cn } from "@/lib/utils";

import { feedHeaderClasses, feedItemClasses } from "./feed-layout";
import { FeedPost } from "./feed-post";
import { FeedPostSkeleton } from "./feed-post-skeleton";

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
 * The Home feed (FR-FEED-01 to FR-FEED-10): one post per screen with vertical
 * snap scrolling, newest first, more loading as the user nears the end, and a
 * manual refresh. A client component because it reads the session-scoped feed
 * in the browser (ADR-013) and reacts to scrolling.
 */
export function HomeFeed() {
  const t = useTranslations();
  const feed = useFeedQuery();
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];
  // A background refetch (refresh button, tab focus) – not the first load or the next page.
  const isRefreshing = feed.isRefetching && !feed.isFetchingNextPage;
  useFeedScrollSnap(posts.length > 0);

  return (
    <>
      <div className={cn("sticky top-0 z-10 bg-background/85 backdrop-blur-sm", feedHeaderClasses)}>
        <PageHeader
          title={t("pages.home.title")}
          className="mx-auto mb-0 h-full max-w-4xl flex-nowrap px-4 lg:px-6"
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
      </div>

      {feed.isPending ? (
        <div aria-busy="true" className={feedItemClasses}>
          <p role="status" className="sr-only">
            {t("feed.loading")}
          </p>
          <FeedPostSkeleton />
        </div>
      ) : feed.isError ? (
        <FeedMessage>
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
        </FeedMessage>
      ) : posts.length === 0 ? (
        <FeedMessage>
          <EmptyState
            icon={HouseIcon}
            title={t("pages.home.emptyTitle")}
            description={t("pages.home.emptyDescription")}
          />
        </FeedMessage>
      ) : (
        <section aria-label={t("feed.label")}>
          {/* Tab moves into the next post and the browser scrolls it into view; Page Down and the arrow keys move one snap point. */}
          <ul>
            {posts.map((post, index) => (
              <li key={post.id} className={feedItemClasses}>
                <FeedPost post={post} eagerMedia={index === 0} />
              </li>
            ))}
          </ul>
          {/* A snap point of its own, so the "Load more" fallback and the end marker can be reached. */}
          <div className="snap-end px-4">
            <InfiniteListFooter
              hasNextPage={feed.hasNextPage}
              isFetchingNextPage={feed.isFetchingNextPage}
              isFetchNextPageError={feed.isFetchNextPageError}
              // cancelRefetch: false joins a fetch already running (e.g. a refresh) instead of aborting it.
              fetchNextPage={() => void feed.fetchNextPage({ cancelRefetch: false })}
              loadMoreLabel={t("feed.loadMore")}
              endLabel={t("feed.end")}
            />
          </div>
        </section>
      )}
    </>
  );
}

/** Centres an error or empty state in the space below the header. */
function FeedMessage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col justify-center px-4 py-6">
      {children}
    </div>
  );
}
