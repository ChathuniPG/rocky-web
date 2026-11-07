import { api } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

/** TanStack Query key for the signed-in user (GET /auth/me). */
export const authMeQueryKey = ["auth", "me"] as const;

/** Loads the signed-in user. The client refreshes an expired ID token first (FR-AUTH-08). */
export function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  return api.get("/auth/me", { signal });
}
