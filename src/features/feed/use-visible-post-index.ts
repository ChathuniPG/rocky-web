"use client";

import { useEffect, useState, type RefObject } from "react";

import { mostVisibleIndex } from "./most-visible-index";

// Coarse steps are enough: each post fills the screen, so one is clearly the most visible.
const VISIBILITY_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1];

/**
 * The index of the feed post currently on screen, whatever its media type, so
 * the feed can buffer the video after it (NFR-PERF-03). Watches the list's
 * children with an IntersectionObserver. `items` is the data the list is
 * rendered from (a stable reference, e.g. TanStack Query's `data`): when it
 * changes (more posts, a refresh) the observer is re-attached to the new
 * children. Null until a post has been seen; while nothing is visible (e.g.
 * on the end marker) the last post seen is kept.
 */
export function useVisiblePostIndex(
  listRef: RefObject<HTMLElement | null>,
  items: unknown,
): number | null {
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return;
    const children = Array.from(list.children);
    const ratios = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);
        const index = mostVisibleIndex(children.map((child) => ratios.get(child) ?? 0));
        if (index !== null) setVisibleIndex(index);
      },
      { threshold: VISIBILITY_THRESHOLDS },
    );
    for (const child of children) observer.observe(child);
    return () => observer.disconnect();
  }, [listRef, items]);

  return visibleIndex;
}
