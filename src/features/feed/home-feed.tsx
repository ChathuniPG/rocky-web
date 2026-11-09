"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CircleAlertIcon, HouseIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { InfiniteListFooter } from "@/components/infinite-list-footer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { shouldPrefetchNextPage } from "@/features/media/video-preload";
import { postKeys } from "@/features/posts/post-query-keys";
import { useFeedScrollSnap } from "@/hooks/use-feed-scroll-snap";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import { cn } from "@/lib/utils";

import { feedHeaderClasses, feedItemClasses } from "./feed-layout";
import { FeedPost } from "./feed-post";
import { FeedPostSkeleton } from "./feed-post-skeleton";
import { FeedStepControls } from "./feed-step-controls";
import { useFeedRefresh } from "./use-feed-refresh";
import { useFeedStepNavigation } from "./use-feed-step-navigation";
import { useFeedVideoWindow } from "./use-feed-video-window";

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
 * manual refresh that returns to the newest post. From 1024px, Previous/Next buttons (and the Up/Down keys)
 * step one post at a time instead of a scrollbar. Only videos near the screen
 * get a real player, and the next one is buffered ahead unless the viewer
 * saves data (NFR-PERF-03). A client
 * component because it reads the session-scoped feed in the browser (ADR-013)
 * and reacts to scrolling.
 */
export function HomeFeed() {
  const t = useTranslations();
  const feed = useFeedQuery();
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];
  // A background refetch (refresh button, tab focus) – not the first load or the next page.
  const isRefreshing = feed.isRefetching && !feed.isFetchingNextPage;
  useFeedScrollSnap(posts.length > 0);
  const listRef = useRef<HTMLUListElement>(null);
  const { visibleIndex, videoPropsFor, focusPropsFor } = useFeedVideoWindow(
    posts.map((post) => post.mediaType),
    listRef,
    feed.data,
  );

  // Fetch the next page a few posts early so its first videos can be buffered ahead (NFR-PERF-03);
  // the footer's sentinel stays as the fallback. A failed fetch waits for the footer's retry.
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = feed;
  const prefetch = shouldPrefetchNextPage(visibleIndex, posts.length);
  useEffect(() => {
    if (prefetch && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      void fetchNextPage({ cancelRefetch: false });
    }
  }, [prefetch, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const { goPrevious, goNext, goToFirst, ...stepState } = useFeedStepNavigation({
    listRef,
    visibleIndex,
    loadedCount: posts.length,
    hasNextPage,
    isFetchNextPageError,
    fetchNextPage,
  });
  // Back to the newest post once the refreshed feed is on screen; the visible-post tracking
  // re-attaches to the new list and the scroll moves the video window and look-ahead with it.
  const refresh = useFeedRefresh({
    data: feed.data,
    refetch: feed.refetch,
    onRefreshed: goToFirst,
  });

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
              onClick={refresh}
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
        <section aria-label={t("feed.label")} className="relative">
          {/* Tab moves into the next post and the browser scrolls it into view; Page Down and Space move one snap point, Up/Down step via useFeedStepNavigation. */}
          <ul ref={listRef}>
            {posts.map((post, index) => (
              <li key={post.id} className={feedItemClasses} {...focusPropsFor(index)}>
                <FeedPost post={post} eagerMedia={index === 0} {...videoPropsFor(index)} />
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
          <FeedStepControls {...stepState} onPrevious={goPrevious} onNext={goNext} />
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
