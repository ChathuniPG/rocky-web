"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCurrentUser } from "@/features/auth/auth-provider";
import { userKeys } from "@/features/users/user-query-keys";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { isApiError, isSessionExpiredError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

import { updatePostInCache } from "./post-cache";

/** Edits a post's caption (FR-POST-04) and updates every cached copy of the post. */
export function useEditCaption(postId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: (caption: string) =>
      api.patch("/posts/{id}", { path: { id: postId }, body: { caption } }),
    onSuccess: (updated) => {
      // Only the caption (and updatedAt) changed. The viewer's like and save state
      // stays as it is in each copy, in case a toggle is still in flight.
      updatePostInCache(queryClient, postId, (post) => ({
        ...post,
        caption: updated.caption,
        updatedAt: updated.updatedAt,
      }));
      toast.success(t("editCaption.success"));
    },
    onError: (error) => {
      if (isSessionExpiredError(error)) return;
      toast.error(t("editCaption.error"), { description: t(mapApiErrorToMessageKey(error)) });
    },
  });
}

/**
 * Deletes a post (FR-POST-05). A 404 means it is already gone, so that counts
 * as success. Removing it from the cache is left to the caller, which first
 * has to leave the post's page.
 */
export function useDeletePost(postId: string) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const { username } = useCurrentUser();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.delete("/posts/{id}", { path: { id: postId } });
      } catch (error) {
        if (!isApiError(error, 404)) throw error;
      }
    },
    onSuccess: () => {
      // The owner's profile header shows the post count.
      void queryClient.invalidateQueries({ queryKey: userKeys.profile(username) });
      toast.success(t("deletePost.success"));
    },
    onError: (error) => {
      if (isSessionExpiredError(error)) return;
      toast.error(t("deletePost.error"), { description: t(mapApiErrorToMessageKey(error)) });
    },
  });
}
