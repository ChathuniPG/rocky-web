"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/auth-provider";
import { userKeys } from "@/features/users/user-query-keys";
import { api } from "@/lib/api/client";

import { postKeys } from "./post-query-keys";

/** Body of POST /posts. */
type CreatePostInput = { caption: string; mediaPath: string };

/**
 * Creates a post from an uploaded file's path (FR-POST-01, ADR-007). On success
 * the feed and the author's profile reload so the new post shows up there.
 */
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { username } = useCurrentUser();

  return useMutation({
    mutationFn: (input: CreatePostInput) => api.post("/posts", { body: input }),
    onSuccess: () => {
      // Not awaited: the dialog can close while the feed (possibly many pages) refetches.
      void queryClient.invalidateQueries({ queryKey: postKeys.feed() });
      void queryClient.invalidateQueries({ queryKey: postKeys.byUser(username) });
      // The profile header's post count.
      void queryClient.invalidateQueries({ queryKey: userKeys.profile(username) });
    },
  });
}
