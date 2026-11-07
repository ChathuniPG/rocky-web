"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { isSessionExpiredError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import type { Post } from "@/lib/api/types";

import { updatePostInCache } from "./post-cache";
import { withLiked, withSaved } from "./post-state";
import { postKeys } from "./post-query-keys";
import { copyPostLink } from "./share-post";

/*
 * Like and save are optimistic (FR-FEED-03, FR-FEED-04): the cache changes on
 * click and the request follows. Each post's like (and save) mutations share a
 * scope, so quick repeated clicks reach the API in order. A failure undoes only
 * that click's change for that one post, instead of restoring a snapshot that
 * could overwrite other posts' changes made in the meantime.
 */

const likeMutationKey = (postId: string) => ["post-like", postId] as const;
const saveMutationKey = (postId: string) => ["post-save", postId] as const;

/** Likes or unlikes a post optimistically. Call `mutate(true)` to like, `mutate(false)` to unlike. */
export function useToggleLike(postId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const mutationKey = likeMutationKey(postId);

  return useMutation({
    mutationKey,
    scope: { id: mutationKey.join(":") },
    mutationFn: (liked: boolean) =>
      liked
        ? api.post("/posts/{id}/like", { path: { id: postId } })
        : api.delete("/posts/{id}/like", { path: { id: postId } }),
    onMutate: async (liked) => {
      // An in-flight refetch would otherwise land after this and undo the change.
      await queryClient.cancelQueries({ queryKey: postKeys.all });
      updatePostInCache(queryClient, postId, (post) => withLiked(post, liked));
    },
    onError: (error, liked) => {
      updatePostInCache(queryClient, postId, (post) => withLiked(post, !liked));
      if (isSessionExpiredError(error)) return;
      toast.error(t(liked ? "post.toast.likeFailed" : "post.toast.unlikeFailed"), {
        description: t(mapApiErrorToMessageKey(error)),
      });
    },
    onSuccess: (state) => {
      // Adopt the server's count, unless another click on this post is still
      // pending: its optimistic state is the newer one.
      if (queryClient.isMutating({ mutationKey }) > 1) return;
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        likedByMe: state.likedByMe,
        likeCount: state.likeCount,
      }));
    },
  });
}

/** Saves or unsaves a post optimistically. Call `mutate(true)` to save, `mutate(false)` to unsave. */
export function useToggleSave(postId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const mutationKey = saveMutationKey(postId);

  return useMutation({
    mutationKey,
    scope: { id: mutationKey.join(":") },
    mutationFn: (saved: boolean) =>
      saved
        ? api.post("/posts/{id}/save", { path: { id: postId } })
        : api.delete("/posts/{id}/save", { path: { id: postId } }),
    onMutate: async (saved) => {
      await queryClient.cancelQueries({ queryKey: postKeys.all });
      updatePostInCache(queryClient, postId, (post) => withSaved(post, saved));
    },
    onError: (error, saved) => {
      updatePostInCache(queryClient, postId, (post) => withSaved(post, !saved));
      if (isSessionExpiredError(error)) return;
      toast.error(t(saved ? "post.toast.saveFailed" : "post.toast.unsaveFailed"), {
        description: t(mapApiErrorToMessageKey(error)),
      });
    },
    onSuccess: (state, saved) => {
      if (queryClient.isMutating({ mutationKey }) > 1) return;
      updatePostInCache(queryClient, postId, (post) => withSaved(post, state.savedByMe));
      toast.success(t(saved ? "post.toast.saved" : "post.toast.unsaved"));
    },
    // The saved list (FR-PROF-03) gains or loses this post; its order comes from
    // the server, so it reloads instead of being patched.
    onSettled: () => queryClient.invalidateQueries({ queryKey: postKeys.saved() }),
  });
}

/** Returns a function that copies a post's link and confirms with a toast (FR-FEED-05). */
export function useSharePost(): (post: Pick<Post, "id">) => Promise<void> {
  const t = useTranslations();

  return useCallback(
    async (post) => {
      const copied = await copyPostLink(post.id);
      if (copied) toast.success(t("post.toast.linkCopied"));
      else toast.error(t("post.toast.linkCopyFailed"));
    },
    [t],
  );
}
