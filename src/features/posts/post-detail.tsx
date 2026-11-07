"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon, FileQuestionIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { z } from "zod";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { CommentForm } from "@/features/comments/comment-form";
import { CommentList } from "@/features/comments/comment-list";
import { BackButton } from "@/features/navigation/back-button";
import { useEscapeToGoBack, useGoBack } from "@/features/navigation/use-go-back";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import type { Post } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { PostActions } from "./post-actions";
import { PostAuthorHeader } from "./post-author-header";
import { findPostInCache, removePostFromCache } from "./post-cache";
import {
  postDetailGridClasses,
  postMediaPaneClasses,
  postPanelClasses,
} from "./post-detail-layout";
import { PostDetailSkeleton } from "./post-detail-skeleton";
import { POST_PAGE_MEDIA_SIZES, PostMedia } from "./post-media";
import { PostOwnerMenu } from "./post-owner-menu";
import { postKeys } from "./post-query-keys";

// Any 8-4-4-4-12 hex id. Anything else can't be a post, so the API isn't asked.
const postIdSchema = z.guid();

/**
 * The single-post page body (FR-POST-06, FR-POST-07, FR-FEED-06): the media
 * and, beside it from 1024px (below it on narrower screens), the author,
 * caption, actions and comments. A post already in the cache (e.g. opened
 * from the feed) shows at once while the fresh copy loads. The owner gets edit
 * and delete in the post's "…" menu (FR-POST-04, FR-POST-05). Back and Escape
 * leave the page (see useGoBack).
 */
export function PostDetail({ postId }: { postId: string }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const goBack = useGoBack();
  useEscapeToGoBack(goBack);
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

  if (isDeleted) return <PostDetailSkeleton />;

  const isNotFound =
    !isValidId || isApiError(postQuery.error, 404) || isApiError(postQuery.error, 400);
  if (isNotFound) return <PostNotFound />;

  if (postQuery.isPending) {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {t("postPage.loading")}
        </p>
        <PostDetailSkeleton />
      </div>
    );
  }

  if (postQuery.isError) {
    return (
      <PostMessage>
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
      </PostMessage>
    );
  }

  const post = postQuery.data;
  const isOwner = post.author.id === currentUser.id;
  const authorLinkId = `post-${post.id}-author`;

  return (
    <article aria-labelledby={authorLinkId} className={postDetailGridClasses}>
      <div className={cn(postMediaPaneClasses, "bg-black")}>
        <PostMedia post={post} sizes={POST_PAGE_MEDIA_SIZES} eager />
        <BackButton className="absolute top-4 left-4" />
      </div>

      <div className={postPanelClasses}>
        {/* Scrolls on its own from 1024px; focusable so keyboard users can scroll it too. */}
        <div
          role="region"
          aria-label={t("postPage.panelLabel")}
          tabIndex={0}
          className="space-y-4 p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
        >
          <PostAuthorHeader
            post={post}
            authorLinkId={authorLinkId}
            actions={isOwner ? <PostOwnerMenu post={post} onDeleted={handleDeleted} /> : null}
          />
          {post.caption ? (
            // Plain text only: React escapes it, and line breaks the author typed are kept.
            <p className="text-sm break-words whitespace-pre-line">{post.caption}</p>
          ) : null}
          <PostActions post={post} variant="inline" linkComments={false} />
          <Separator />
          <section aria-labelledby="comments-heading" className="space-y-2">
            <h2 id="comments-heading" className="text-lg font-semibold">
              {t("comments.heading")}
            </h2>
            <CommentList postId={post.id} />
          </section>
        </div>
        {/* Stays at the bottom of the panel, and of the screen when stacked. */}
        <div className="sticky bottom-0 border-t bg-card p-4">
          <CommentForm postId={post.id} />
        </div>
      </div>
    </article>
  );
}

/** Centres an error or not-found state in a readable column. */
function PostMessage({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl px-4 py-6 lg:px-6">{children}</div>;
}

function PostNotFound() {
  const t = useTranslations();
  return (
    <PostMessage>
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
    </PostMessage>
  );
}
