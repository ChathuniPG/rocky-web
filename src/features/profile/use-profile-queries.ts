"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { postKeys } from "@/features/posts/post-query-keys";
import { userKeys } from "@/features/users/user-query-keys";
import { api } from "@/lib/api/client";

/** A user's public profile with counts and follow state (GET /users/{username}, FR-PROF-01). */
export function useProfile(username: string, enabled: boolean) {
  return useQuery({
    queryKey: userKeys.profile(username),
    queryFn: ({ signal }) => api.get("/users/{username}", { path: { username }, signal }),
    enabled,
  });
}

/**
 * A user's posts, newest first, as an infinite list (GET /users/{username}/posts,
 * FR-PROF-02). Lives under ["posts"], so likes elsewhere update the grid too.
 */
export function useUserPosts(username: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: postKeys.byUser(username),
    queryFn: ({ pageParam, signal }) =>
      api.get("/users/{username}/posts", {
        path: { username },
        query: { cursor: pageParam },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

/** The signed-in user's saved posts, most recently saved first (GET /users/me/saved, FR-PROF-03). */
export function useSavedPosts(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: postKeys.saved(),
    queryFn: ({ pageParam, signal }) =>
      api.get("/users/me/saved", { query: { cursor: pageParam }, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
