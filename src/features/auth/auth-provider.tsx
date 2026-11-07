"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { useTranslations } from "@/i18n/i18n-provider";
import { api, setSessionExpiredHandler } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { queueToastAfterReload } from "@/lib/toast-after-reload";

import { authMeQueryKey, fetchCurrentUser } from "./auth-query";
import { endSessionWithFullReload } from "./session-navigation";

/** What {@link useAuth} returns. */
export type AuthContextValue = {
  /** The signed-in user, or null while loading, after an error or once signed out. */
  user: User | null;
  /** True until the first answer from /auth/me (or while signing out). */
  isLoading: boolean;
  /** The error from /auth/me, if loading the user failed. */
  error: Error | null;
  /** Retries loading the user after an error. */
  retry: () => void;
  /** Revokes the session (FR-AUTH-06), clears cached data and loads /login as a new page. */
  logout: () => void;
  /** True while the logout request is in flight. */
  isLoggingOut: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Builds the login URL that brings the user back to where they were. */
function loginUrlForCurrentPage(): string {
  const next = `${window.location.pathname}${window.location.search}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

/**
 * Loads the signed-in user from /auth/me and shares it with the app (design.md 7.3).
 * Wraps the signed-in routes only. Route protection happens here on the client
 * (ADR-013): if the session can't be refreshed, the user is sent to
 * /login?next=<current path>. The API stays the security boundary.
 *
 * Ending the session always loads the next page as a new document, so no
 * state of this provider (or anything else) carries over to the next user;
 * see session-navigation.ts.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const t = useTranslations();
  // Once the session has ended, stop asking /auth/me until the new page loads:
  // clearing the cache would otherwise let the query refetch and start a second
  // redirect. The full page load discards this state, so it never outlives the session.
  const [sessionEnded, setSessionEnded] = useState(false);

  const userQuery = useQuery({
    queryKey: authMeQueryKey,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled: !sessionEnded,
    // The user rarely changes behind our back; profile edits update this entry directly.
    staleTime: 5 * 60_000,
  });

  const endSession = useCallback(
    (destination: string) => {
      setSessionEnded(true);
      endSessionWithFullReload(queryClient, destination);
    },
    [queryClient],
  );

  useEffect(
    () => setSessionExpiredHandler(() => endSession(loginUrlForCurrentPage())),
    [endSession],
  );

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      // Shown on the login page, after the full page load.
      queueToastAfterReload(t("auth.logout.success"));
      endSession("/login");
    },
    // Logout always succeeds on the API; failing here means the request never
    // arrived, so the cookies are still set and the user is still signed in.
    onError: () => {
      toast.error(t("auth.logout.error"));
    },
  });

  const { mutate: logoutMutate, isPending: isLoggingOut } = logoutMutation;
  const { refetch } = userQuery;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: sessionEnded ? null : (userQuery.data ?? null),
      isLoading: sessionEnded || userQuery.isPending,
      error: userQuery.error,
      retry: () => void refetch(),
      logout: () => logoutMutate(),
      isLoggingOut,
    }),
    [
      sessionEnded,
      userQuery.data,
      userQuery.isPending,
      userQuery.error,
      refetch,
      logoutMutate,
      isLoggingOut,
    ],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

/** Auth state and actions. Must be used inside {@link AuthProvider}. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}

/**
 * The signed-in user, for components rendered inside the AuthGate (which only
 * renders its children once the user is known), so they need no null checks.
 */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser must be used inside <AuthGate>.");
  return user;
}
