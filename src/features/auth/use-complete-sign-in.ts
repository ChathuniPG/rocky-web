"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { User } from "@/lib/api/types";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

import { authMeQueryKey } from "./auth-query";

/**
 * Returns the step after a successful login or sign-up: store the returned user
 * as the auth state (so the AuthGate opens without another /auth/me request) and
 * go to the validated `next` path, or the home page.
 */
export function useCompleteSignIn(): (user: User) => void {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(
    (user: User) => {
      queryClient.setQueryData(authMeQueryKey, user);
      // Read at submit time instead of via useSearchParams, which would need a
      // Suspense boundary around the whole form under cacheComponents.
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(getSafeRedirectPath(next));
    },
    [queryClient, router],
  );
}
