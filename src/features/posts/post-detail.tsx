"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon, FileQuestionIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { EmptyState } from "@/components/empty-state";
import { PostCardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { CommentForm } from "@/features/comments/comment-form";
import { CommentList } from "@/features/comments/comment-list";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import type { Post } from "@/lib/api/types";

import { findPostInCache, removePostFromCache } from "./post-cache";
import { PostCard } from "./post-card";
import { PostOwnerMenu } from "./post-owner-menu";
import { postKeys } from "./post-query-keys";

// Any 8-4-4-4-12 hex id. Anything else can't be a post, so the API isn't asked.
const postIdSchema = z.guid();

/**
 * The single-post page body (FR-POST-06, FR-FEED-06): the post, its comment
 * box and its comments. A post already in the cache (e.g. opened from the
 * feed) shows at once while the fresh copy loads. The owner gets edit and
 * delete in the post's "…" menu (FR-POST-04, FR-POST-05).
 */
export function PostDetail({ postId }: { postId: string }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const isValidId = postIdSchema.safeParse(postId).success;
  // Set once the viewer deletes the post: stops the queries before the cache is
  // cleared, so the page doesn't refetch and flash "not found" while leaving.
  const [isDeleted, setIsDeleted] = useState(false);

  // Explicit types: TanStack would otherwise infer the data type from the placeholder function.
  const postQuery = useQuery<Post, Error, Post, ReturnType<typeof postKeys.detail>>({
    queryKey: postKeys.detail(postId),
    queryFn: ({ signal }) => api.get("/posts/{id}", { path: { id: postId }, signal }),
    enabled: isValidId && !isDeleted,
    placeholderData: () => findPostInCache(queryClient, postId),
  });

  function handleDeleted() {
    setIsDeleted(true);
    router.replace("/");
    removePostFromCache(queryClient, postId);
    queryClient.removeQueries({ queryKey: postKeys.comments(postId) });
  }

  if (isDeleted) return <PostCardSkeleton />;

  const isNotFound =
    !isValidId || isApiError(postQuery.error, 404) || isApiError(postQuery.error, 400);
  if (isNotFound) return <PostNotFound />;

  if (postQuery.isPending) {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {t("postPage.loading")}
        </p>
        <PostCardSkeleton />
      </div>
    );
  }

  if (postQuery.isError) {
    return (
      <EmptyState
        icon={CircleAlertIcon}
        title={t("postPage.errorTitle")}
        description={t(mapApiErrorToMessageKey(postQuery.error))}
        action={
          <Button loading={postQuery.isFetching} onClick={() => void postQuery.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  const post = postQuery.data;
  const isOwner = post.author.id === currentUser.id;

  return (
    <div className="space-y-6">
      <PostCard
        post={post}
        eagerMedia
        linkComments={false}
        headerActions={isOwner ? <PostOwnerMenu post={post} onDeleted={handleDeleted} /> : null}
      />
      <section aria-labelledby="comments-heading" className="space-y-4">
        <h2 id="comments-heading" className="text-lg font-semibold">
          {t("comments.heading")}
        </h2>
        <CommentForm postId={post.id} />
        <CommentList postId={post.id} />
      </section>
    </div>
  );
}

function PostNotFound() {
  const t = useTranslations();
  return (
    <EmptyState
      icon={FileQuestionIcon}
      title={t("postPage.notFoundTitle")}
      description={t("postPage.notFoundDescription")}
      action={
        <Button asChild>
          <Link href="/">{t("postPage.backHome")}</Link>
        </Button>
      }
    />
  );
}
