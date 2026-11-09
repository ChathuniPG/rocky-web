/**
 * One manual refresh of the Home feed: its own token (so two refreshes that
 * return the same data are still two requests) and the data it returned.
 */
export type FeedRefreshRequest<TData> = { token: number; data: TData };

/** What to do when a refresh finishes; see refreshResultAction. */
export type FeedRefreshAction = "skip" | "now" | "wait";

/**
 * What a finished manual refresh should do next:
 * - "skip": it failed, returned nothing, or the feed is hidden (Next.js
 *   Activity); the position restored on return wins.
 * - "now": the result is the data already on screen (no new posts: TanStack
 *   Query's structural sharing keeps the same reference), so nothing will
 *   re-render and the follow-up runs straight away.
 * - "wait": new data has to render first, so new posts above the current one
 *   exist before the feed scrolls to them.
 */
export function refreshResultAction<TData>(input: {
  isError: boolean;
  data: TData | undefined;
  rendered: TData | undefined;
  shown: boolean;
}): FeedRefreshAction {
  if (input.isError || input.data === undefined || !input.shown) return "skip";
  return input.data === input.rendered ? "now" : "wait";
}

/**
 * Whether a refresh that was waiting for its data to render can now be
 * followed up: its data is on screen and it is newer than `handledToken`,
 * the last token dealt with (tokens only increase).
 */
export function isRefreshRendered<TData>(
  request: FeedRefreshRequest<TData> | null,
  rendered: TData | undefined,
  handledToken: number,
): request is FeedRefreshRequest<TData> {
  return request !== null && request.token > handledToken && request.data === rendered;
}
