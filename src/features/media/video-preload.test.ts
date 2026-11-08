import { describe, expect, it } from "vitest";

import type { MediaType } from "@/lib/api/types";

import {
  allowsLookAhead,
  feedVideoPreload,
  isInVideoWindow,
  lookAheadVideoIndex,
  needsLoadRestart,
  shouldPrefetchNextPage,
} from "./video-preload";

const I: MediaType = "IMAGE";
const V: MediaType = "VIDEO";

describe("lookAheadVideoIndex", () => {
  it("finds a video two posts past a visible image", () => {
    expect(lookAheadVideoIndex([I, I, V, I], 0, true)).toBe(2);
  });

  it("finds the next video after a visible video, not the visible one", () => {
    expect(lookAheadVideoIndex([V, I, V, V], 0, true)).toBe(2);
    expect(lookAheadVideoIndex([V, V, I], 0, true)).toBe(1);
  });

  it("searches at most three posts ahead", () => {
    expect(lookAheadVideoIndex([I, I, I, V], 0, true)).toBe(3);
    expect(lookAheadVideoIndex([I, I, I, I, V], 0, true)).toBeNull();
  });

  it("returns null when no video is in range or the feed ends", () => {
    expect(lookAheadVideoIndex([V, I, I], 0, true)).toBeNull();
    expect(lookAheadVideoIndex([I, V], 1, true)).toBeNull();
  });

  it("never looks behind the visible post", () => {
    expect(lookAheadVideoIndex([V, I, I], 1, true)).toBeNull();
  });

  it("returns null before any post is visible", () => {
    expect(lookAheadVideoIndex([I, V], null, true)).toBeNull();
  });

  it("returns null when look-ahead is not allowed (data saver)", () => {
    expect(lookAheadVideoIndex([I, V], 0, allowsLookAhead({ saveData: true }))).toBeNull();
  });
});

describe("feedVideoPreload", () => {
  it("gives auto only to the look-ahead index", () => {
    expect(feedVideoPreload(2, 2)).toBe("auto");
    expect(feedVideoPreload(1, 2)).toBe("metadata");
    expect(feedVideoPreload(3, 2)).toBe("metadata");
    expect(feedVideoPreload(0, null)).toBe("metadata");
  });
});

describe("needsLoadRestart", () => {
  const idle = { paused: true, networkIdle: true, bufferedEnd: 0.5, duration: 7 };

  it("restarts a paused video whose fetch went idle with little buffered", () => {
    expect(needsLoadRestart(idle)).toBe(true);
  });

  it("restarts when the duration isn't known yet", () => {
    expect(needsLoadRestart({ ...idle, bufferedEnd: 0, duration: Number.NaN })).toBe(true);
  });

  it("leaves a video that is still fetching, playing or fully buffered alone", () => {
    expect(needsLoadRestart({ ...idle, networkIdle: false })).toBe(false);
    expect(needsLoadRestart({ ...idle, paused: false })).toBe(false);
    expect(needsLoadRestart({ ...idle, bufferedEnd: 7 })).toBe(false);
  });
});

describe("isInVideoWindow", () => {
  const none = { visibleIndex: null, lookAheadIndex: null, activeIndex: null, focusedIndex: null };

  it("keeps the visible post and the two after it", () => {
    const anchors = { ...none, visibleIndex: 10 };
    const kept = [7, 8, 9, 10, 11, 12, 13, 14].filter((i) => isInVideoWindow(i, anchors));
    expect(kept).toEqual([10, 11, 12]);
  });

  it("starts at the top before any post is visible", () => {
    const kept = [0, 1, 2, 3].filter((i) => isInVideoWindow(i, none));
    expect(kept).toEqual([0, 1, 2]);
  });

  it("keeps the look-ahead video even three posts ahead", () => {
    expect(isInVideoWindow(13, { ...none, visibleIndex: 10, lookAheadIndex: 13 })).toBe(true);
  });

  it("keeps the active video mounted wherever it is", () => {
    expect(isInVideoWindow(9, { ...none, visibleIndex: 10, activeIndex: 9 })).toBe(true);
    expect(isInVideoWindow(4, { ...none, visibleIndex: 10, activeIndex: 4 })).toBe(true);
  });

  it("keeps the post holding keyboard focus", () => {
    expect(isInVideoWindow(20, { ...none, visibleIndex: 10, focusedIndex: 20 })).toBe(true);
  });

  it("drops posts that match no anchor", () => {
    const anchors = { visibleIndex: 10, lookAheadIndex: 12, activeIndex: 10, focusedIndex: 11 };
    expect(isInVideoWindow(5, anchors)).toBe(false);
    expect(isInVideoWindow(14, anchors)).toBe(false);
  });
});

describe("allowsLookAhead", () => {
  it("allows it when the Network Information API is missing", () => {
    expect(allowsLookAhead(undefined)).toBe(true);
  });

  it("disallows it when Data Saver is on", () => {
    expect(allowsLookAhead({ saveData: true, effectiveType: "4g" })).toBe(false);
  });

  it("disallows it on 2g and slow-2g", () => {
    expect(allowsLookAhead({ effectiveType: "2g" })).toBe(false);
    expect(allowsLookAhead({ effectiveType: "slow-2g" })).toBe(false);
  });

  it("allows it on faster or unreported connections", () => {
    expect(allowsLookAhead({ saveData: false, effectiveType: "3g" })).toBe(true);
    expect(allowsLookAhead({ effectiveType: "4g" })).toBe(true);
    expect(allowsLookAhead({})).toBe(true);
  });
});

describe("shouldPrefetchNextPage", () => {
  it("fetches once the visible post is within five of the end", () => {
    expect(shouldPrefetchNextPage(9, 15)).toBe(false);
    expect(shouldPrefetchNextPage(10, 15)).toBe(true);
    expect(shouldPrefetchNextPage(14, 15)).toBe(true);
  });

  it("waits until a post is visible", () => {
    expect(shouldPrefetchNextPage(null, 3)).toBe(false);
  });
});
