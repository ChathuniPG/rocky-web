"use client";

import { useLayoutEffect } from "react";

import { feedScrollRestoreTarget } from "./feed-scroll-restore";

// The feed's last scroll position, kept outside React so it also survives the
// feed being unmounted (Next.js keeps only the last few routes alive).
let savedScrollY: number | null = null;

/**
 * Turns on one-post-per-screen scroll snapping for the page (FR-FEED-10) while
 * the feed is shown, and brings back the feed's scroll position whenever it is
 * shown again, however the user got there (FR-POST-07).
 *
 * Next.js keeps visited pages mounted but hidden (React Activity), so a global
 * style must be switched off when the feed is hidden: the snap is a `data-*`
 * attribute on <html> set in a layout effect and removed in its cleanup, which
 * Activity runs on hide. The position is tracked while scrolling, because by
 * the time the cleanup runs the hidden feed may no longer have a scroll height.
 *
 * The restore runs in a microtask: on a push navigation (e.g. a sidebar link)
 * Next.js scrolls to the top in its own layout effect, which runs after this
 * one because it belongs to a parent component. The microtask runs once the
 * whole commit is done but before the browser paints or fires `scroll`, so
 * Next.js handles the navigation as usual and the feed then puts its own
 * position back without a visible jump. On Back, Next.js doesn't scroll and
 * the restore finds the page already in place.
 */
export function useFeedScrollSnap(enabled: boolean): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    // Read before anything this commit scrolls (and the listener records) can overwrite it.
    const restoreTo = savedScrollY;
    let cancelled = false;

    root.dataset.feedSnap = "true";
    queueMicrotask(() => {
      if (cancelled) return;
      const target = feedScrollRestoreTarget(restoreTo, window.scrollY);
      if (target !== null) window.scrollTo({ top: target, behavior: "instant" });
    });

    const recordScroll = () => {
      savedScrollY = window.scrollY;
    };
    window.addEventListener("scroll", recordScroll, { passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", recordScroll);
      delete root.dataset.feedSnap;
    };
  }, [enabled]);
}
