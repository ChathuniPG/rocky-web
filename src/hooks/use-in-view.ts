"use client";

import { useCallback, useEffect, useRef } from "react";

type UseInViewOptions = {
  /** Called each time the element enters the (expanded) viewport. */
  onEnter: () => void;
  /** Grows the viewport so the callback fires before the element is actually visible. */
  rootMargin?: string;
  /** Set to false to stop observing, e.g. when there is nothing more to load. */
  enabled?: boolean;
};

/**
 * Calls `onEnter` when the element attached to the returned ref scrolls into view
 * (IntersectionObserver). Used as an infinite-scroll sentinel (FR-FEED-07). Does
 * nothing where IntersectionObserver is unavailable; lists keep a "Load more"
 * button for that case.
 *
 * Returns a ref callback (not a ref object) so observing starts and stops with
 * the element itself, even when it's rendered conditionally.
 */
export function useInView({ onEnter, rootMargin = "0px", enabled = true }: UseInViewOptions) {
  // The latest callback, so a new function every render doesn't re-create the observer.
  const onEnterRef = useRef(onEnter);
  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  return useCallback(
    (element: Element | null) => {
      if (!element || !enabled || typeof IntersectionObserver === "undefined") return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) onEnterRef.current();
        },
        { rootMargin },
      );
      observer.observe(element);
      // React 19 calls a ref callback's returned function when the element goes away.
      return () => observer.disconnect();
    },
    [enabled, rootMargin],
  );
}
