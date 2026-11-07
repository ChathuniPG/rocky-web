"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updatePostInCache } from "@/features/posts/post-cache";
import { postKeys } from "@/features/posts/post-query-keys";
import { withCommentCountChange } from "@/features/posts/post-state";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { isApiError, isSessionExpiredError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

import { prependComment, removeComment, type CommentPages } from "./comment-cache";

/**
 * Adds a comment to a post (FR-FEED-06). Not optimistic: the comment needs its
 * server id and timestamp. On success it goes to the top of the list and the
 * post's comment count rises in every cached copy of the post.
 */
export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (body: string) =>
      api.post("/posts/{id}/comments", { path: { id: postId }, body: { body } }),
    onSuccess: (comment) => {
      queryClient.setQueryData<CommentPages>(postKeys.comments(postId), (data) =>
        prependComment(data, comment),
      );
      updatePostInCache(queryClient, postId, (post) => withCommentCountChange(post, 1));
      toast.success(t("comments.added"));
    },
    onError: (error) => {
      if (isSessionExpiredError(error)) return;
      toast.error(t("comments.addFailed"), { description: t(mapApiErrorToMessageKey(error)) });
    },
  });
}

/**
 * Deletes one of the viewer's own comments (FR-FEED-06). A 404 means it is
 * already gone (e.g. deleted in another tab), so it is treated as success.
 */
export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  function removeFromCache(commentId: string) {
    queryClient.setQueryData<CommentPages>(postKeys.comments(postId), (data) =>
      removeComment(data, commentId),
    );
    updatePostInCache(queryClient, postId, (post) => withCommentCountChange(post, -1));
  }

  return useMutation({
    mutationFn: async (commentId: string) => {
      try {
        await api.delete("/comments/{id}", { path: { id: commentId } });
      } catch (error) {
        if (!isApiError(error, 404)) throw error;
      }
    },
    onSuccess: (_result, commentId) => {
      removeFromCache(commentId);
      toast.success(t("comments.deleted"));
    },
    onError: (error) => {
      if (isSessionExpiredError(error)) return;
      toast.error(t("comments.deleteFailed"), {
        description: t(mapApiErrorToMessageKey(error)),
      });
    },
  });
}
