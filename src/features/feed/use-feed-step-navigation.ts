"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import {
  type FeedKeyTarget,
  type FeedStepDirection,
  type FeedStepState,
  feedStepState,
  feedStepTarget,
  resolveFeedStepKey,
} from "./feed-step";

// Radix renders these only while open, in a portal (same as useEscapeToGoBack).
const OPEN_OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"]';
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
// Widgets that use the arrow keys themselves, e.g. the expanded caption's scroll region.
const ARROW_WIDGET_SELECTOR =
  '[role="slider"], [role="region"][tabindex], [role="listbox"], [role="menu"], [role="tablist"], [role="radiogroup"]';
// Fallback for browsers without `scrollend`, and for a step that doesn't scroll at all.
const SCROLL_SETTLE_MS = 1000;
// Sub-pixel rounding at a snap point must not count as "scrolled past".
const SCROLLED_PAST_TOLERANCE_PX = 2;

/** What a key press went to, for resolveFeedStepKey. */
function feedKeyTargetOf(target: EventTarget | null): FeedKeyTarget {
  if (!(target instanceof Element)) return "page";
  if (target.closest(EDITABLE_SELECTOR)) return "editable";
  if (target.closest("[data-video-player]")) return "player";
  if (target.closest(ARROW_WIDGET_SELECTOR)) return "widget";
  return "page";
}

/** The page's scroll-padding-top (the sticky header), where a snapped post starts. */
function scrollPaddingTop(): number {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
}

type FeedStepNavigationInput = {
  /** The list whose children are the posts. */
  listRef: RefObject<HTMLElement | null>;
  /** The post on screen (useVisiblePostIndex). */
  visibleIndex: number | null;
  loadedCount: number;
  hasNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: (options: { cancelRefetch: boolean }) => Promise<{ isError: boolean }>;
};

/** A Next press on the last loaded post, waiting for the next page. */
type AwaitedStep = { index: number; fromVisibleIndex: number | null };

/**
 * Previous/next stepping through the Home feed (FR-FEED-10): the buttons'
 * state and handlers, plus the Up/Down arrow keys. Each step scrolls exactly
 * one post, smoothly unless the user prefers reduced motion. Next on the last
 * loaded post fetches the next page and moves once it has rendered.
 *
 * Steps count from the post being scrolled to, so quick presses move one post
 * each even before the visible index catches up. The key listener lives in an
 * effect, so it is removed when Next.js hides the feed with Activity.
 */
export function useFeedStepNavigation({
  listRef,
  visibleIndex,
  loadedCount,
  hasNextPage,
  isFetchNextPageError,
  fetchNextPage,
}: FeedStepNavigationInput): FeedStepState & {
  goPrevious: () => void;
  goNext: () => void;
} {
  const prefersReducedMotion = usePrefersReducedMotion();
  const pendingTargetRef = useRef<number | null>(null);
  const settleRef = useRef<(() => void) | null>(null);
  const [awaited, setAwaited] = useState<AwaitedStep | null>(null);
  const consumedRef = useRef<AwaitedStep | null>(null);

  // A wait ends when the user scrolls elsewhere meanwhile or the page fails (the footer offers a retry).
  const awaitedValid =
    awaited !== null && awaited.fromVisibleIndex === visibleIndex && !isFetchNextPageError;
  const awaitingNext = awaitedValid && loadedCount <= awaited.index;

  function scrollToPost(index: number) {
    const post = listRef.current?.children[index];
    if (!(post instanceof HTMLElement)) return;
    settleRef.current?.();
    pendingTargetRef.current = index;

    const settle = () => {
      window.clearTimeout(timer);
      window.removeEventListener("scrollend", settle);
      if (settleRef.current === settle) settleRef.current = null;
      pendingTargetRef.current = null;
    };
    const timer = window.setTimeout(settle, SCROLL_SETTLE_MS);
    window.addEventListener("scrollend", settle);
    settleRef.current = settle;

    post.scrollIntoView({ block: "start", behavior: prefersReducedMotion ? "instant" : "smooth" });
  }

  function isScrolledPast(index: number | null): boolean {
    if (index === null) return false;
    const post = listRef.current?.children[index];
    if (!post) return false;
    return post.getBoundingClientRect().top < scrollPaddingTop() - SCROLLED_PAST_TOLERANCE_PX;
  }

  function step(direction: FeedStepDirection) {
    if (direction === "next" && awaitingNext) return;
    if (awaited) setAwaited(null);
    const pending = pendingTargetRef.current;
    const currentIndex = pending ?? visibleIndex;
    const target = feedStepTarget({
      direction,
      currentIndex,
      loadedCount,
      hasNextPage,
      // Mid-scroll, the post being scrolled to is the current one, not partly out of view.
      currentScrolledPast: pending === null && isScrolledPast(currentIndex),
    });
    if (target === null) return;
    if (target !== "load") {
      scrollToPost(target);
      return;
    }

    const wait: AwaitedStep = { index: loadedCount, fromVisibleIndex: visibleIndex };
    setAwaited(wait);
    // cancelRefetch: false joins a fetch already running (e.g. the early prefetch) instead of restarting it.
    void fetchNextPage({ cancelRefetch: false }).then((result) => {
      if (result.isError) setAwaited((current) => (current === wait ? null : current));
    });
  }

  // Moves once the awaited post has rendered; the ref keeps a later page from moving again.
  useEffect(() => {
    if (!awaitedValid || loadedCount <= awaited.index || consumedRef.current === awaited) return;
    consumedRef.current = awaited;
    scrollToPost(awaited.index);
  });

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const direction = resolveFeedStepKey({
      key: event.key,
      hasModifier: event.altKey || event.ctrlKey || event.metaKey || event.shiftKey,
      isComposing: event.isComposing,
      defaultPrevented: event.defaultPrevented,
      target: feedKeyTargetOf(event.target),
      overlayOpen: document.querySelector(OPEN_OVERLAY_SELECTOR) !== null,
    });
    if (!direction) return;
    // Replaces the browser's own arrow scrolling, which can land between snap points mid-load.
    event.preventDefault();
    step(direction);
  });

  useEffect(() => {
    // Bubble phase, so the video player and Radix widgets handle their keys first.
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      // A step still settling when the feed is hidden must not count once it is shown again.
      settleRef.current?.();
    };
  }, []);

  return {
    ...feedStepState({ currentIndex: visibleIndex, loadedCount, hasNextPage, awaitingNext }),
    goPrevious: () => step("previous"),
    goNext: () => step("next"),
  };
}
