/*
 * Navigation for the moments the signed-in user changes: login, sign-up,
 * logout and an ended session. These always load a new document
 * (window.location.assign) instead of a client-side router navigation (ADR-014).
 *
 * With cacheComponents, Next.js keeps visited pages mounted but hidden (React
 * Activity), so a client-side navigation would carry over the previous
 * session's React state: an AuthProvider still marked "session ended" kept the
 * app on its loading skeleton after the next login, and a login form still
 * marked "succeeded" ignored every submit (#29). Module state (feed scroll
 * memory, in-app history) and the client router cache would also survive. A
 * new document starts all of it fresh, so nothing from the previous account
 * can leak into the next one.
 */

import type { QueryClient } from "@tanstack/react-query";

import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { queueToastAfterReload } from "@/lib/toast-after-reload";

/** The part of window.location used here; tests pass a fake. */
export type DocumentLocation = Pick<Location, "assign" | "search">;

/**
 * Ends the session in this tab: clears all cached server data first, so
 * nothing of the previous user remains even for the moment before the page
 * unloads, then loads `destination` as a new document.
 */
export function endSessionWithFullReload(
  queryClient: Pick<QueryClient, "clear">,
  destination: string,
  location: DocumentLocation = window.location,
): void {
  queryClient.clear();
  location.assign(destination);
}

/**
 * The step after a successful login or sign-up: queues the welcome toast and
 * loads the validated `next` path (or the home page) as a new document. The
 * new page loads the user from /auth/me itself.
 */
export function completeSignIn(
  successMessage: string,
  location: DocumentLocation = window.location,
): void {
  queueToastAfterReload(successMessage);
  // Read at submit time instead of via useSearchParams, which would need a
  // Suspense boundary around the whole form under cacheComponents.
  const next = new URLSearchParams(location.search).get("next");
  location.assign(getSafeRedirectPath(next));
}
