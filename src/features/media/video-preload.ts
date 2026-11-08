/*
 * Which feed videos are buffered ahead of time (FR-FEED-09, NFR-PERF-03).
 * Plain TypeScript with no DOM access, so it can be unit-tested; the Home feed
 * supplies the visible post's index and the network hints.
 */

import type { MediaType } from "@/lib/api/types";

/** The `preload` values the app uses on a `<video>`. */
export type VideoPreload = "auto" | "metadata";

/** How many posts past the visible one are searched for the video to buffer. */
export const LOOK_AHEAD_POSTS = 3;

/** The parts of the Network Information API this module reads; it is missing in some browsers. */
export type ConnectionHints = { saveData?: unknown; effectiveType?: unknown };

const SLOW_CONNECTIONS: readonly unknown[] = ["2g", "slow-2g"];

/**
 * Whether buffering a video the viewer hasn't reached yet is acceptable: not
 * when they turned on Data Saver or the connection is 2G or slower. Without
 * the API (`undefined`), the network is unknown and look-ahead stays on.
 */
export function allowsLookAhead(connection: ConnectionHints | undefined): boolean {
  if (!connection) return true;
  if (connection.saveData === true) return false;
  return !SLOW_CONNECTIONS.includes(connection.effectiveType);
}

/**
 * The index of the one video to buffer ahead: the first video post after the
 * visible post, at most LOOK_AHEAD_POSTS further on. It works whatever the
 * visible post is, so the first video after a run of images is ready too.
 * Null when look-ahead is off, nothing is visible yet, or no video is in range.
 */
export function lookAheadVideoIndex(
  mediaTypes: readonly MediaType[],
  visibleIndex: number | null,
  allowed: boolean,
): number | null {
  if (!allowed || visibleIndex === null) return null;
  const last = Math.min(visibleIndex + LOOK_AHEAD_POSTS, mediaTypes.length - 1);
  for (let index = visibleIndex + 1; index <= last; index += 1) {
    if (mediaTypes[index] === "VIDEO") return index;
  }
  return null;
}

/** What needsLoadRestart reads from a `<video>` element. */
export type VideoLoadState = {
  paused: boolean;
  /** networkState is NETWORK_IDLE: the browser has stopped fetching. */
  networkIdle: boolean;
  /** End of the last buffered range, in seconds (0 when nothing is buffered). */
  bufferedEnd: number;
  /** NaN until the metadata is known. */
  duration: number;
};

/**
 * Whether a video that was just asked to buffer fully needs `load()` to do so.
 * Chrome doesn't resume a fetch that went idle under preload="metadata" when
 * the attribute later changes to "auto" (measured for #40), so a paused, idle,
 * not fully buffered video is restarted. A playing video loads by itself.
 */
export function needsLoadRestart({
  paused,
  networkIdle,
  bufferedEnd,
  duration,
}: VideoLoadState): boolean {
  if (!paused || !networkIdle) return false;
  return !(bufferedEnd >= duration);
}

/**
 * How many posts before and after the visible one keep a real `<video>`
 * element. None before: a paused video that has played keeps downloading as
 * fast as the playing one (measured for #40), and only unmounting stops it.
 * The video still playing while the user scrolls on is kept by `activeIndex`.
 */
export const VIDEO_WINDOW = { before: 0, after: 2 } as const;

/** The posts the feed's video window is built around; null where not known. */
export type VideoWindowAnchors = {
  /** The post on screen; null before the first one is seen, when the window starts at the top. */
  visibleIndex: number | null;
  /** The video being buffered ahead (lookAheadVideoIndex), which may lie past the window. */
  lookAheadIndex: number | null;
  /** The video allowed to play: it must never be unmounted while it plays. */
  activeIndex: number | null;
  /** The post holding keyboard focus, so focus is never lost to an unmounted player. */
  focusedIndex: number | null;
};

/**
 * Whether the feed post at `index` gets a real `<video>` (true) or a
 * lightweight placeholder (false). Only posts near the visible one, plus the
 * look-ahead, active and focused posts, keep an element, so videos far away
 * release their downloads and decoders (NFR-PERF-03).
 */
export function isInVideoWindow(
  index: number,
  { visibleIndex, lookAheadIndex, activeIndex, focusedIndex }: VideoWindowAnchors,
): boolean {
  const current = visibleIndex ?? 0;
  if (index >= current - VIDEO_WINDOW.before && index <= current + VIDEO_WINDOW.after) return true;
  return index === lookAheadIndex || index === activeIndex || index === focusedIndex;
}

/**
 * The `preload` hint for the feed post at `index`: "auto" for the look-ahead
 * video, "metadata" for all others. The playing video upgrades itself to
 * "auto" in VideoPlayer, so this only covers the one ahead.
 */
export function feedVideoPreload(index: number, lookAheadIndex: number | null): VideoPreload {
  return index === lookAheadIndex ? "auto" : "metadata";
}

/** Posts from the end of the loaded feed at which the next page is fetched. */
export const PREFETCH_PAGE_POSTS = LOOK_AHEAD_POSTS + 2;

/**
 * Whether the feed should fetch its next page now: once the visible post is
 * within PREFETCH_PAGE_POSTS of the end, so the next page's videos arrive in
 * time to be buffered ahead. The scroll sentinel at the bottom would only
 * fetch it on the last post (measured for #40).
 */
export function shouldPrefetchNextPage(visibleIndex: number | null, loadedCount: number): boolean {
  return visibleIndex !== null && visibleIndex >= loadedCount - PREFETCH_PAGE_POSTS;
}
