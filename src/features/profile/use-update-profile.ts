"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authMeQueryKey } from "@/features/auth/auth-query";
import { updateAuthorInCache } from "@/features/posts/post-cache";
import { updateUserInCache } from "@/features/users/user-cache";
import { api } from "@/lib/api/client";

import type { ProfileUpdate } from "./profile-schema";

/**
 * Saves profile changes (PATCH /users/me, FR-PROF-04). On success the new
 * details go straight into the cache instead of being refetched: the signed-in
 * user (so the sidebar updates at once), their profile and search rows, and the
 * author on their cached posts. Errors are shown by the form.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ProfileUpdate) => api.patch("/users/me", { body }),
    onSuccess: (user) => {
      queryClient.setQueryData(authMeQueryKey, user);
      updateUserInCache(queryClient, user);
      updateAuthorInCache(queryClient, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      });
    },
  });
}
