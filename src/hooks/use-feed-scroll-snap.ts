"use client";

import { useLayoutEffect } from "react";

// The feed's last scroll position, kept outside React so it also survives the
// feed being unmounted (Next.js keeps only the last few routes alive).
let savedScrollY: number | null = null;

/**
 * Turns on one-post-per-screen scroll snapping for the page (FR-FEED-10) while
 * the feed is shown, and brings back the feed's scroll position when the user
 * returns to it (FR-POST-07).
 *
 * Next.js keeps visited pages mounted but hidden (React Activity), so a global
 * style must be switched off when the feed is hidden: the snap is a `data-*`
 * attribute on <html> set in a layout effect and removed in its cleanup, which
 * Activity runs on hide. The position is tracked while scrolling, because by
 * the time the cleanup runs the hidden feed may no longer have a scroll height.
 */
export function useFeedScrollSnap(enabled: boolean): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;

    if (savedScrollY !== null && Math.abs(window.scrollY - savedScrollY) > 1) {
      window.scrollTo({ top: savedScrollY, behavior: "instant" });
    }
    root.dataset.feedSnap = "true";

    const recordScroll = () => {
      savedScrollY = window.scrollY;
    };
    window.addEventListener("scroll", recordScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", recordScroll);
      delete root.dataset.feedSnap;
    };
  }, [enabled]);
}
