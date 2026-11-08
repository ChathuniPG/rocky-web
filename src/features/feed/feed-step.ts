/*
 * Previous/next stepping through the Home feed (FR-FEED-10). Plain TypeScript
 * with no DOM access, so the rules can be unit-tested; the feed passes in the
 * post on screen and what the key press went to.
 */

/** Which way a step goes. */
export type FeedStepDirection = "previous" | "next";

/** What feedStepTarget needs to know about the feed. */
export type FeedStepPosition = {
  direction: FeedStepDirection;
  /** The post on screen (or being scrolled to); null before one is seen, i.e. at the top. */
  currentIndex: number | null;
  loadedCount: number;
  /** Whether more pages exist after the loaded posts. */
  hasNextPage: boolean;
  /** The current post's top is above the header, e.g. on the end marker's snap point. */
  currentScrolledPast: boolean;
};

/**
 * The index of the post a step moves to, "load" when the next post isn't
 * loaded yet but another page exists, or null when there is nowhere to go.
 * Previous from a post scrolled partly out of view returns to that post's
 * start first, so the last post isn't skipped when leaving the end marker.
 */
export function feedStepTarget({
  direction,
  currentIndex,
  loadedCount,
  hasNextPage,
  currentScrolledPast,
}: FeedStepPosition): number | "load" | null {
  if (loadedCount === 0) return null;
  const current = Math.min(currentIndex ?? 0, loadedCount - 1);

  if (direction === "previous") {
    if (currentScrolledPast) return current;
    return current > 0 ? current - 1 : null;
  }
  if (current + 1 < loadedCount) return current + 1;
  return hasNextPage ? "load" : null;
}

/** What feedStepState needs to know about the feed. */
export type FeedStepStateInput = {
  currentIndex: number | null;
  loadedCount: number;
  hasNextPage: boolean;
  /** Next was pressed on the last loaded post and the next page hasn't arrived yet. */
  awaitingNext: boolean;
};

/** Whether the previous/next buttons are disabled, and whether Next is waiting for a page. */
export type FeedStepState = {
  previousDisabled: boolean;
  nextDisabled: boolean;
  nextLoading: boolean;
};

/**
 * The state of the previous/next buttons: Previous is disabled on the first
 * post, Next at the end of the feed; while Next waits for the next page it
 * shows a spinner instead.
 */
export function feedStepState({
  currentIndex,
  loadedCount,
  hasNextPage,
  awaitingNext,
}: FeedStepStateInput): FeedStepState {
  const current = currentIndex ?? 0;
  return {
    previousDisabled: loadedCount === 0 || current <= 0,
    nextDisabled: loadedCount === 0 || (current >= loadedCount - 1 && !hasNextPage),
    nextLoading: awaitingNext,
  };
}

/**
 * The kind of element a key press went to: the page itself, a text field,
 * the video player (Up/Down change its volume), or another widget that uses
 * the arrow keys (a slider, a scrollable caption, a list).
 */
export type FeedKeyTarget = "page" | "editable" | "player" | "widget";

/** Everything that decides whether a key press steps the feed. */
export type FeedKeyContext = {
  key: string;
  /** Alt, Ctrl, Meta or Shift held: leave browser and OS shortcuts alone. */
  hasModifier: boolean;
  /** Part of an IME composition (e.g. typing Sinhala). */
  isComposing: boolean;
  /** Already handled by something else. */
  defaultPrevented: boolean;
  target: FeedKeyTarget;
  /** A dialog or menu is open. */
  overlayOpen: boolean;
};

/**
 * Maps a key press to a feed step, or null to let the browser handle it. Only
 * plain Up/Down arrows step; Page Up, Page Down and Space keep their native
 * snap scrolling.
 */
export function resolveFeedStepKey(context: FeedKeyContext): FeedStepDirection | null {
  if (
    context.hasModifier ||
    context.isComposing ||
    context.defaultPrevented ||
    context.overlayOpen ||
    context.target !== "page"
  ) {
    return null;
  }
  if (context.key === "ArrowUp") return "previous";
  if (context.key === "ArrowDown") return "next";
  return null;
}
