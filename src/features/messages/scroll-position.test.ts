import { describe, expect, it } from "vitest";

import {
  distanceFromBottom,
  isNearBottom,
  NEAR_BOTTOM_PX,
  scrollTopKeepingBottomDistance,
} from "./scroll-position";

describe("distanceFromBottom and isNearBottom", () => {
  it("measures the gap below the visible area", () => {
    expect(distanceFromBottom({ scrollTop: 600, scrollHeight: 1000, clientHeight: 400 })).toBe(0);
    expect(distanceFromBottom({ scrollTop: 100, scrollHeight: 1000, clientHeight: 400 })).toBe(500);
  });

  it("never reports a negative distance (content shorter than the view)", () => {
    expect(distanceFromBottom({ scrollTop: 0, scrollHeight: 200, clientHeight: 400 })).toBe(0);
  });

  it("counts the threshold as near", () => {
    const atThreshold = { scrollTop: 600 - NEAR_BOTTOM_PX, scrollHeight: 1000, clientHeight: 400 };
    expect(isNearBottom(atThreshold)).toBe(true);
    expect(isNearBottom({ ...atThreshold, scrollTop: atThreshold.scrollTop - 1 })).toBe(false);
  });
});

describe("scrollTopKeepingBottomDistance", () => {
  it("keeps the content in place after older messages are added above", () => {
    // Before: 300px from the bottom. 500px of older messages are added on top.
    expect(scrollTopKeepingBottomDistance(300, { scrollHeight: 1500, clientHeight: 400 })).toBe(
      800,
    );
  });

  it("never returns a negative position", () => {
    expect(scrollTopKeepingBottomDistance(900, { scrollHeight: 500, clientHeight: 400 })).toBe(0);
  });
});
