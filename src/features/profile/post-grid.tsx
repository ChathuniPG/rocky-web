"use client";

import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { CircleAlertIcon, HeartIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { InfiniteListFooter } from "@/components/infinite-list-footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostThumbnail } from "@/features/posts/post-thumbnail";
import { postHref } from "@/features/posts/share-post";
import { useLocale, useTranslations } from "@/i18n/i18n-provider";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import type { Post, PostPage } from "@/lib/api/types";
import { formatCount } from "@/lib/format/count";

/** The content column is at most 672px wide (max-w-2xl), so a third of it stays under 230px. */
const TILE_SIZES = "(min-width: 768px) 230px, 33vw";
const SKELETON_TILES = 6;
// Two rows fit above the fold on tall screens (e.g. 1440px high), so their
// images load eagerly; one of them is usually the Largest Contentful Paint.
const EAGER_TILES = 6;

const gridClasses = "grid grid-cols-3 gap-1 sm:gap-2";

type PostGridProps = {
  /** An infinite query over posts, e.g. a user's posts or the saved list. */
  query: UseInfiniteQueryResult<InfiniteData<PostPage>, Error>;
  /** Accessible name of the grid, e.g. "Posts". */
  label: string;
  /** Shown when the list is empty (FR-UI-04). */
  emptyState: ReactNode;
};

/**
 * A grid of 9:16 post thumbnails (FR-PROF-02, FR-PROF-03) with loading, empty
 * and error states, loading more as its end nears the viewport.
 */
export function PostGrid({ query, label, emptyState }: PostGridProps) {
  const t = useTranslations();
  const posts = query.data?.pages.flatMap((page) => page.items) ?? [];

  if (query.isPending) {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {t("profile.grid.loading")}
        </p>
        <PostGridSkeleton />
      </div>
    );
  }

  if (query.isError && !query.isFetchNextPageError) {
    return (
      <EmptyState
        icon={CircleAlertIcon}
        title={t("profile.grid.errorTitle")}
        description={t(mapApiErrorToMessageKey(query.error))}
        action={
          <Button loading={query.isFetching} onClick={() => void query.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  if (posts.length === 0) return emptyState;

  return (
    <section aria-label={label}>
      <ul className={gridClasses}>
        {posts.map((post, index) => (
          <li key={post.id}>
            <PostGridTile post={post} eager={index < EAGER_TILES} />
          </li>
        ))}
      </ul>
      <InfiniteListFooter
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        isFetchNextPageError={query.isFetchNextPageError}
        fetchNextPage={() => void query.fetchNextPage({ cancelRefetch: false })}
        loadMoreLabel={t("profile.grid.loadMore")}
      />
    </section>
  );
}

/**
 * One thumbnail linking to the post page. A video shows a still frame (never
 * autoplays, FR-PROF-02) with a play badge.
 * The link's accessible name says what it is, who posted it and its likes; the
 * visible like count is decorative to avoid reading it twice.
 */
function PostGridTile({ post, eager }: { post: Post; eager: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const isVideo = post.mediaType === "VIDEO";
  const name = post.author.displayName;

  return (
    <Link
      href={postHref(post.id)}
      aria-label={t(isVideo ? "profile.grid.videoTile" : "profile.grid.imageTile", {
        name,
        count: post.likeCount,
      })}
      className="group/tile relative block aspect-9/16 overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <PostThumbnail
        mediaUrl={post.mediaUrl}
        mediaType={post.mediaType}
        sizes={TILE_SIZES}
        eager={eager}
      />
      {/* Hover and press feedback on top of the media. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-black/0 transition-colors group-hover/tile:bg-black/15 group-active/tile:bg-black/25"
      />
      {isVideo ? (
        <PlayIcon
          aria-hidden="true"
          className="absolute top-2 right-2 size-4 fill-white text-white drop-shadow-[0_0_2px_rgb(0_0_0/0.9)]"
        />
      ) : null}
      {/* White text with a dark halo stays readable over any media (design.md 7.2). */}
      <span
        aria-hidden="true"
        className="absolute bottom-1.5 left-2 flex items-center gap-1 text-xs font-semibold text-white tabular-nums media-text-halo"
      >
        <HeartIcon className="size-3.5 fill-white drop-shadow-[0_0_2px_rgb(0_0_0/0.9)]" />
        {formatCount(post.likeCount, locale)}
      </span>
    </Link>
  );
}

/** Placeholder tiles shaped like the grid (FR-UI-03). */
export function PostGridSkeleton() {
  return (
    <div aria-hidden="true" className={gridClasses}>
      {Array.from({ length: SKELETON_TILES }, (_, index) => (
        <Skeleton key={index} className="aspect-9/16 rounded-md" />
      ))}
    </div>
  );
}
