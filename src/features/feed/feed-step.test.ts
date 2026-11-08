import { describe, expect, it } from "vitest";

import {
  type FeedKeyContext,
  type FeedStepPosition,
  feedStepState,
  feedStepTarget,
  resolveFeedStepKey,
} from "./feed-step";

const middle: FeedStepPosition = {
  direction: "next",
  currentIndex: 3,
  loadedCount: 10,
  hasNextPage: true,
  currentScrolledPast: false,
};

describe("feedStepTarget", () => {
  it("moves one post either way", () => {
    expect(feedStepTarget(middle)).toBe(4);
    expect(feedStepTarget({ ...middle, direction: "previous" })).toBe(2);
  });

  it("treats an unknown position as the first post", () => {
    expect(feedStepTarget({ ...middle, currentIndex: null })).toBe(1);
    expect(feedStepTarget({ ...middle, currentIndex: null, direction: "previous" })).toBeNull();
  });

  it("has no previous post on the first one", () => {
    expect(feedStepTarget({ ...middle, currentIndex: 0, direction: "previous" })).toBeNull();
  });

  it("asks for the next page on the last loaded post", () => {
    expect(feedStepTarget({ ...middle, currentIndex: 9 })).toBe("load");
  });

  it("has no next post at the end of the feed", () => {
    expect(feedStepTarget({ ...middle, currentIndex: 9, hasNextPage: false })).toBeNull();
  });

  it("returns to the start of a post scrolled partly out of view", () => {
    const onEndMarker = {
      ...middle,
      currentIndex: 9,
      direction: "previous",
      currentScrolledPast: true,
    } as const;
    expect(feedStepTarget(onEndMarker)).toBe(9);
  });

  it("clamps a stale index to the loaded posts", () => {
    expect(feedStepTarget({ ...middle, currentIndex: 20, direction: "previous" })).toBe(8);
  });

  it("goes nowhere in an empty feed", () => {
    expect(feedStepTarget({ ...middle, loadedCount: 0 })).toBeNull();
  });
});

describe("feedStepState", () => {
  const base = { currentIndex: 3, loadedCount: 10, hasNextPage: true, awaitingNext: false };

  it("enables both buttons in the middle", () => {
    expect(feedStepState(base)).toEqual({
      previousDisabled: false,
      nextDisabled: false,
      nextLoading: false,
    });
  });

  it("disables Previous on the first post and at the top", () => {
    expect(feedStepState({ ...base, currentIndex: 0 }).previousDisabled).toBe(true);
    expect(feedStepState({ ...base, currentIndex: null }).previousDisabled).toBe(true);
  });

  it("keeps Next enabled on the last loaded post while more pages exist", () => {
    expect(feedStepState({ ...base, currentIndex: 9 }).nextDisabled).toBe(false);
  });

  it("disables Next at the end of the feed", () => {
    expect(feedStepState({ ...base, currentIndex: 9, hasNextPage: false }).nextDisabled).toBe(true);
  });

  it("shows Next loading while waiting for the next page", () => {
    expect(feedStepState({ ...base, currentIndex: 9, awaitingNext: true }).nextLoading).toBe(true);
  });

  it("disables both in an empty feed", () => {
    const state = feedStepState({
      ...base,
      currentIndex: null,
      loadedCount: 0,
      hasNextPage: false,
    });
    expect(state.previousDisabled && state.nextDisabled).toBe(true);
  });
});

describe("resolveFeedStepKey", () => {
  const plain: FeedKeyContext = {
    key: "ArrowDown",
    hasModifier: false,
    isComposing: false,
    defaultPrevented: false,
    target: "page",
    overlayOpen: false,
  };

  it("maps the Up and Down arrows to steps", () => {
    expect(resolveFeedStepKey(plain)).toBe("next");
    expect(resolveFeedStepKey({ ...plain, key: "ArrowUp" })).toBe("previous");
  });

  it.each(["PageUp", "PageDown", " ", "ArrowLeft", "End"])("leaves %j to the browser", (key) => {
    expect(resolveFeedStepKey({ ...plain, key })).toBeNull();
  });

  it.each<[string, Partial<FeedKeyContext>]>([
    ["with a modifier", { hasModifier: true }],
    ["while composing", { isComposing: true }],
    ["when already handled", { defaultPrevented: true }],
    ["while a dialog or menu is open", { overlayOpen: true }],
    ["in a text field", { target: "editable" }],
    ["in the video player", { target: "player" }],
    ["in another arrow-key widget", { target: "widget" }],
  ])("ignores the arrows %s", (_, override) => {
    expect(resolveFeedStepKey({ ...plain, ...override })).toBeNull();
  });
});
