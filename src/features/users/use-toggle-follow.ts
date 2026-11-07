"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCurrentUser } from "@/features/auth/auth-provider";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { isSessionExpiredError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

import { cancelFollowQueries, markFollowingSearchesStale, updateFollowInCache } from "./user-cache";
import { userKeys } from "./user-query-keys";

/** The user a follow button acts on. */
export type FollowTarget = { id: string; displayName: string };

const followMutationKey = (userId: string) => ["user-follow", userId] as const;

/**
 * Follows or unfollows a user optimistically (FR-PROF-05). Call `mutate(true)`
 * to follow, `mutate(false)` to unfollow. The cache changes on click, in every
 * place the user appears (see user-cache.ts), and the request follows. Clicks
 * on the same user share a scope, so they reach the API in order; a failure
 * undoes only that click's change and explains it in a toast.
 */
export function useToggleFollow(target: FollowTarget) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const viewer = useCurrentUser();
  const mutationKey = followMutationKey(target.id);

  return useMutation({
    mutationKey,
    scope: { id: mutationKey.join(":") },
    mutationFn: (follow: boolean) =>
      follow
        ? api.post("/users/{id}/follow", { path: { id: target.id } })
        : api.delete("/users/{id}/follow", { path: { id: target.id } }),
    onMutate: async (follow) => {
      // An in-flight refetch would otherwise land after this and undo the change.
      await cancelFollowQueries(queryClient, [target.id, viewer.id]);
      updateFollowInCache(queryClient, {
        userId: target.id,
        isFollowing: follow,
        viewerId: viewer.id,
        viewerFollowingDelta: follow ? 1 : -1,
      });
    },
    onError: (error, follow) => {
      updateFollowInCache(queryClient, {
        userId: target.id,
        isFollowing: !follow,
        viewerId: viewer.id,
        viewerFollowingDelta: follow ? -1 : 1,
      });
      if (isSessionExpiredError(error)) return;
      toast.error(
        t(follow ? "follow.toast.followFailed" : "follow.toast.unfollowFailed", {
          name: target.displayName,
        }),
        { description: t(mapApiErrorToMessageKey(error)) },
      );
    },
    onSuccess: (state) => {
      // Adopt the server's count, unless another click on this user is still
      // pending: its optimistic state is the newer one.
      if (queryClient.isMutating({ mutationKey }) > 1) return;
      updateFollowInCache(queryClient, {
        userId: target.id,
        isFollowing: state.isFollowing,
        followerCount: state.followerCount,
        viewerId: viewer.id,
        viewerFollowingDelta: 0,
      });
    },
    onSettled: async () => {
      await markFollowingSearchesStale(queryClient);
      // The viewer's own following count was only adjusted locally; the follow
      // endpoint doesn't return it. Reload it the next time the profile shows.
      await queryClient.invalidateQueries({
        queryKey: userKeys.profile(viewer.username),
        refetchType: "none",
      });
    },
  });
}
