"use client";

import { useEffect, useRef, useState } from "react";

import { type FeedRefreshRequest, isRefreshRendered, refreshResultAction } from "./feed-refresh";

type FeedRefreshInput<TData> = {
  /** The feed data currently rendered (TanStack Query's `data`). */
  data: TData | undefined;
  refetch: () => Promise<{ isError: boolean; data: TData | undefined }>;
  /** Runs once the refreshed feed is on screen, e.g. to scroll to the first post. */
  onRefreshed: () => void;
};

/**
 * The Home feed's manual refresh (FR-FEED-01): refetches the feed and calls
 * `onRefreshed` after every successful refresh, once its result is on screen.
 * Each refresh is its own request (a token), because a refresh with no new
 * posts returns the same data object as before. Waiting for the render
 * matters when there are new posts: they are inserted above the current one,
 * and scrolling before they exist would leave the user on an old post.
 *
 * A refresh that finishes, or is still waiting to render, while Next.js has
 * the feed hidden (Activity) is dropped, so the position restored on return
 * wins.
 */
export function useFeedRefresh<TData>({
  data,
  refetch,
  onRefreshed,
}: FeedRefreshInput<TData>): () => void {
  const [request, setRequest] = useState<FeedRefreshRequest<TData> | null>(null);
  const nextTokenRef = useRef(0);
  // Every refresh up to this token is done with (followed up, superseded or dropped).
  const handledTokenRef = useRef(-1);
  const renderedRef = useRef(data);
  const shownRef = useRef(false);
  // The promise below outlives the render that started it; it must see the latest values.
  const onRefreshedRef = useRef(onRefreshed);

  useEffect(() => {
    renderedRef.current = data;
    onRefreshedRef.current = onRefreshed;
  });

  // Declared before the follow-up effect so it runs first when Activity shows the feed again.
  useEffect(() => {
    shownRef.current = true;
    // Refreshes started before the feed was hidden are dropped: the restored position wins.
    handledTokenRef.current = nextTokenRef.current - 1;
    return () => {
      shownRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isRefreshRendered(request, data, handledTokenRef.current)) return;
    handledTokenRef.current = request.token;
    onRefreshed();
  });

  return () => {
    const token = nextTokenRef.current++;
    void refetch().then((result) => {
      const action = refreshResultAction({
        isError: result.isError,
        data: result.data,
        rendered: renderedRef.current,
        // Shown now, and not hidden at any point since this refresh started.
        shown: shownRef.current && token > handledTokenRef.current,
      });
      // A newer refresh has started meanwhile; it does the follow-up.
      if (action === "skip" || token !== nextTokenRef.current - 1) return;
      if (action === "now") {
        handledTokenRef.current = token;
        onRefreshedRef.current();
        return;
      }
      if (result.data !== undefined) setRequest({ token, data: result.data });
    });
  };
}
