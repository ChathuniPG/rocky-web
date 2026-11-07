"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CircleAlertIcon, MessageCircleIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { InfiniteListFooter } from "@/components/infinite-list-footer";
import { ListRowSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { postKeys } from "@/features/posts/post-query-keys";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

import { CommentItem } from "./comment-item";

const SKELETON_COUNT = 3;

/** Infinite query over GET /posts/{id}/comments, newest first (ADR-005). */
function useCommentsQuery(postId: string) {
  return useInfiniteQuery({
    queryKey: postKeys.comments(postId),
    queryFn: ({ pageParam, signal }) =>
      api.get("/posts/{id}/comments", {
        path: { id: postId },
        query: { cursor: pageParam },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** A post's comments, newest first, loading more as the user scrolls (FR-FEED-06). */
export function CommentList({ postId }: { postId: string }) {
  const t = useTranslations();
  const comments = useCommentsQuery(postId);

  if (comments.isPending) {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {t("comments.loading")}
        </p>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <ListRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (comments.isError) {
    return (
      <EmptyState
        icon={CircleAlertIcon}
        title={t("comments.errorTitle")}
        description={t(mapApiErrorToMessageKey(comments.error))}
        action={
          <Button loading={comments.isFetching} onClick={() => void comments.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  const items = comments.data.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={MessageCircleIcon}
        title={t("comments.emptyTitle")}
        description={t("comments.emptyDescription")}
      />
    );
  }

  return (
    <>
      <ul className="divide-y">
        {items.map((comment) => (
          <li key={comment.id}>
            <CommentItem comment={comment} postId={postId} />
          </li>
        ))}
      </ul>
      <InfiniteListFooter
        hasNextPage={comments.hasNextPage}
        isFetchingNextPage={comments.isFetchingNextPage}
        isFetchNextPageError={comments.isFetchNextPageError}
        // Joins a fetch already running (e.g. a refetch on focus) instead of aborting it.
        fetchNextPage={() => void comments.fetchNextPage({ cancelRefetch: false })}
        loadMoreLabel={t("comments.loadMore")}
      />
    </>
  );
}
